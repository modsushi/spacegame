import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
}

interface ParticleSystem {
  particles: Particle[];
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
  points: THREE.Points;
  startTime: number;
}

export class ParticleEffects {
  private scene: THREE.Scene;
  private activeSystems: ParticleSystem[] = [];
  private textureCache: THREE.Texture | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  private createParticleTexture(): THREE.Texture {
    if (this.textureCache) return this.textureCache;

    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    this.textureCache = new THREE.CanvasTexture(canvas);
    return this.textureCache;
  }

  createDestructionEffect(
    x: number,
    y: number,
    z: number,
    radius: number,
    color: number
  ): void {
    const particleCount = Math.min(Math.floor(radius * 8) + 20, 80);
    const particles: Particle[] = [];
    const baseColor = new THREE.Color(color);

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      // Random direction in sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = radius * 0.5 + Math.random() * radius * 1.5;

      const velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed * 0.3 // Less z movement for 2D feel
      );

      // Vary the color slightly
      const particleColor = baseColor.clone();
      particleColor.offsetHSL(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.3
      );

      particles.push({
        position: new THREE.Vector3(x, y, z),
        velocity,
        life: 1.0,
        maxLife: 0.6 + Math.random() * 0.4, // 0.6-1.0 seconds
        size: (radius * 0.1 + Math.random() * radius * 0.15) * 2,
        color: particleColor,
      });
    }

    // Create geometry
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = particles[i].position.x;
      positions[i * 3 + 1] = particles[i].position.y;
      positions[i * 3 + 2] = particles[i].position.z;

      colors[i * 3] = particles[i].color.r;
      colors[i * 3 + 1] = particles[i].color.g;
      colors[i * 3 + 2] = particles[i].color.b;

      sizes[i] = particles[i].size;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: radius * 0.3,
      map: this.createParticleTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);

    this.activeSystems.push({
      particles,
      geometry,
      material,
      points,
      startTime: performance.now(),
    });
  }

  update(deltaTime: number): void {
    const systemsToRemove: ParticleSystem[] = [];

    for (const system of this.activeSystems) {
      let allDead = true;
      const positions = system.geometry.attributes.position.array as Float32Array;
      const sizes = system.geometry.attributes.size.array as Float32Array;

      for (let i = 0; i < system.particles.length; i++) {
        const particle = system.particles[i];

        if (particle.life > 0) {
          allDead = false;

          // Update position
          particle.position.x += particle.velocity.x * deltaTime;
          particle.position.y += particle.velocity.y * deltaTime;
          particle.position.z += particle.velocity.z * deltaTime;

          // Slow down
          particle.velocity.multiplyScalar(0.96);

          // Decrease life
          particle.life -= deltaTime / particle.maxLife;

          // Update buffer
          positions[i * 3] = particle.position.x;
          positions[i * 3 + 1] = particle.position.y;
          positions[i * 3 + 2] = particle.position.z;

          // Shrink as life decreases
          sizes[i] = particle.size * Math.max(0, particle.life);
        } else {
          sizes[i] = 0;
        }
      }

      system.geometry.attributes.position.needsUpdate = true;
      system.geometry.attributes.size.needsUpdate = true;

      // Fade out overall
      const elapsed = (performance.now() - system.startTime) / 1000;
      system.material.opacity = Math.max(0, 1 - elapsed * 1.2);

      if (allDead || elapsed > 1.5) {
        systemsToRemove.push(system);
      }
    }

    // Remove dead systems
    for (const system of systemsToRemove) {
      this.scene.remove(system.points);
      system.geometry.dispose();
      system.material.dispose();
      const index = this.activeSystems.indexOf(system);
      if (index !== -1) {
        this.activeSystems.splice(index, 1);
      }
    }
  }

  dispose(): void {
    for (const system of this.activeSystems) {
      this.scene.remove(system.points);
      system.geometry.dispose();
      system.material.dispose();
    }
    this.activeSystems = [];

    if (this.textureCache) {
      this.textureCache.dispose();
      this.textureCache = null;
    }
  }
}
