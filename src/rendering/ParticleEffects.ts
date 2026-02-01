import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
}

interface Debris {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
  life: number;
  maxLife: number;
  startScale: number;
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
  private activeDebris: Debris[] = [];
  private textureCache: THREE.Texture | null = null;
  private audioPool: HTMLAudioElement[] = [];
  private audioPoolSize = 5;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initAudio();
  }

  private initAudio(): void {
    // Create a pool of audio elements for overlapping sounds
    for (let i = 0; i < this.audioPoolSize; i++) {
      const audio = new Audio('/meteorite.mp3');
      audio.volume = 0.3;
      this.audioPool.push(audio);
    }
  }

  private playSound(volume: number = 0.3): void {
    // Find an available audio element from the pool
    const audio = this.audioPool.find(a => a.paused || a.ended);
    if (audio) {
      audio.volume = Math.min(volume, 1.0);
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  }

  private createParticleTexture(): THREE.Texture {
    if (this.textureCache) return this.textureCache;

    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
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
    // Play sound with volume based on size
    const soundVolume = Math.min(0.2 + radius * 0.02, 0.7);
    this.playSound(soundVolume);

    // More particles for larger objects
    const particleCount = Math.min(Math.floor(radius * 15) + 40, 200);
    const particles: Particle[] = [];
    const baseColor = new THREE.Color(color);

    // Create shockwave ring particles
    const ringCount = Math.floor(radius * 3) + 10;
    for (let i = 0; i < ringCount; i++) {
      const angle = (i / ringCount) * Math.PI * 2;
      const speed = radius * 3 + Math.random() * radius * 2;

      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        (Math.random() - 0.5) * speed * 0.2
      );

      const particleColor = baseColor.clone();
      particleColor.offsetHSL(0, 0, 0.3); // Brighter for shockwave

      particles.push({
        position: new THREE.Vector3(x, y, z),
        velocity,
        life: 1.0,
        maxLife: 0.4 + Math.random() * 0.2,
        size: (radius * 0.2 + Math.random() * radius * 0.1) * 3,
        color: particleColor,
      });
    }

    // Create explosion burst particles
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = radius * 1.5 + Math.random() * radius * 3;

      const velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed * 0.4
      );

      // Vary the color - some brighter (fire), some darker (smoke)
      const particleColor = baseColor.clone();
      const variation = Math.random();
      if (variation < 0.3) {
        // Fire/bright
        particleColor.offsetHSL(-0.05, 0.2, 0.4);
      } else if (variation < 0.6) {
        // Normal
        particleColor.offsetHSL(
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        );
      } else {
        // Darker/smoke
        particleColor.offsetHSL(0, -0.3, -0.2);
      }

      particles.push({
        position: new THREE.Vector3(
          x + (Math.random() - 0.5) * radius * 0.5,
          y + (Math.random() - 0.5) * radius * 0.5,
          z + (Math.random() - 0.5) * radius * 0.3
        ),
        velocity,
        life: 1.0,
        maxLife: 0.5 + Math.random() * 0.8,
        size: (radius * 0.08 + Math.random() * radius * 0.15) * 2.5,
        color: particleColor,
      });
    }

    // Create secondary explosion sparks
    const sparkCount = Math.floor(radius * 5) + 20;
    for (let i = 0; i < sparkCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = radius * 4 + Math.random() * radius * 4;

      const velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed * 0.3
      );

      const sparkColor = new THREE.Color(0xffffff);
      sparkColor.offsetHSL(Math.random() * 0.1 - 0.05, 0, 0);

      particles.push({
        position: new THREE.Vector3(x, y, z),
        velocity,
        life: 1.0,
        maxLife: 0.2 + Math.random() * 0.3,
        size: radius * 0.05 + Math.random() * radius * 0.05,
        color: sparkColor,
      });
    }

    // Create geometry
    const totalParticles = particles.length;
    const positions = new Float32Array(totalParticles * 3);
    const colors = new Float32Array(totalParticles * 3);
    const sizes = new Float32Array(totalParticles);

    for (let i = 0; i < totalParticles; i++) {
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
      size: radius * 0.4,
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

    // Create debris chunks for larger objects
    if (radius > 3) {
      this.createDebris(x, y, z, radius, color);
    }

    // Create flash effect
    this.createFlash(x, y, z, radius, color);
  }

  private createDebris(
    x: number,
    y: number,
    z: number,
    radius: number,
    color: number
  ): void {
    const debrisCount = Math.min(Math.floor(radius * 0.8) + 3, 12);
    const baseColor = new THREE.Color(color);

    for (let i = 0; i < debrisCount; i++) {
      // Random irregular shape
      const size = radius * (0.1 + Math.random() * 0.2);
      const geometry = new THREE.IcosahedronGeometry(size, 0);

      // Deform the geometry for irregular chunks
      const positions = geometry.attributes.position;
      for (let j = 0; j < positions.count; j++) {
        positions.setX(j, positions.getX(j) * (0.7 + Math.random() * 0.6));
        positions.setY(j, positions.getY(j) * (0.7 + Math.random() * 0.6));
        positions.setZ(j, positions.getZ(j) * (0.7 + Math.random() * 0.6));
      }
      geometry.computeVertexNormals();

      const debrisColor = baseColor.clone();
      debrisColor.offsetHSL(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3
      );

      const material = new THREE.MeshStandardMaterial({
        color: debrisColor,
        roughness: 0.8,
        metalness: 0.2,
        emissive: debrisColor,
        emissiveIntensity: 0.3,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        x + (Math.random() - 0.5) * radius * 0.5,
        y + (Math.random() - 0.5) * radius * 0.5,
        z + (Math.random() - 0.5) * radius * 0.3
      );

      // Random rotation
      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = radius * 1.5 + Math.random() * radius * 2;

      const velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed * 0.3
      );

      const rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );

      this.scene.add(mesh);

      this.activeDebris.push({
        mesh,
        velocity,
        rotationSpeed,
        life: 1.0,
        maxLife: 1.5 + Math.random() * 1.0,
        startScale: size,
      });
    }
  }

  private createFlash(
    x: number,
    y: number,
    z: number,
    radius: number,
    color: number
  ): void {
    const flashGeometry = new THREE.SphereGeometry(radius * 0.5, 16, 16);
    const flashColor = new THREE.Color(color);
    flashColor.offsetHSL(0, -0.3, 0.5); // Brighter, less saturated

    const flashMaterial = new THREE.MeshBasicMaterial({
      color: flashColor,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.set(x, y, z);
    this.scene.add(flash);

    // Animate flash expansion and fade
    const startTime = performance.now();
    const duration = 300;

    const animateFlash = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        const scale = 1 + progress * 4;
        flash.scale.setScalar(scale);
        flashMaterial.opacity = 0.8 * (1 - progress);
        requestAnimationFrame(animateFlash);
      } else {
        this.scene.remove(flash);
        flashGeometry.dispose();
        flashMaterial.dispose();
      }
    };

    requestAnimationFrame(animateFlash);
  }

  update(deltaTime: number): void {
    // Update particle systems
    const systemsToRemove: ParticleSystem[] = [];

    for (const system of this.activeSystems) {
      let allDead = true;
      const positions = system.geometry.attributes.position.array as Float32Array;
      const sizes = system.geometry.attributes.size.array as Float32Array;
      const colors = system.geometry.attributes.color.array as Float32Array;

      for (let i = 0; i < system.particles.length; i++) {
        const particle = system.particles[i];

        if (particle.life > 0) {
          allDead = false;

          // Update position
          particle.position.x += particle.velocity.x * deltaTime;
          particle.position.y += particle.velocity.y * deltaTime;
          particle.position.z += particle.velocity.z * deltaTime;

          // Slow down with drag
          particle.velocity.multiplyScalar(0.94);

          // Decrease life
          particle.life -= deltaTime / particle.maxLife;

          // Update buffer
          positions[i * 3] = particle.position.x;
          positions[i * 3 + 1] = particle.position.y;
          positions[i * 3 + 2] = particle.position.z;

          // Fade color towards darker as it ages
          const fadeProgress = 1 - particle.life;
          colors[i * 3] = particle.color.r * (1 - fadeProgress * 0.5);
          colors[i * 3 + 1] = particle.color.g * (1 - fadeProgress * 0.7);
          colors[i * 3 + 2] = particle.color.b * (1 - fadeProgress * 0.8);

          // Shrink as life decreases (but not too fast initially)
          const sizeMultiplier = particle.life > 0.5 ? 1 : particle.life * 2;
          sizes[i] = particle.size * sizeMultiplier;
        } else {
          sizes[i] = 0;
        }
      }

      system.geometry.attributes.position.needsUpdate = true;
      system.geometry.attributes.size.needsUpdate = true;
      system.geometry.attributes.color.needsUpdate = true;

      // Fade out overall
      const elapsed = (performance.now() - system.startTime) / 1000;
      system.material.opacity = Math.max(0, 1 - elapsed * 0.8);

      if (allDead || elapsed > 2.0) {
        systemsToRemove.push(system);
      }
    }

    // Remove dead particle systems
    for (const system of systemsToRemove) {
      this.scene.remove(system.points);
      system.geometry.dispose();
      system.material.dispose();
      const index = this.activeSystems.indexOf(system);
      if (index !== -1) {
        this.activeSystems.splice(index, 1);
      }
    }

    // Update debris
    const debrisToRemove: Debris[] = [];

    for (const debris of this.activeDebris) {
      if (debris.life > 0) {
        // Update position
        debris.mesh.position.x += debris.velocity.x * deltaTime;
        debris.mesh.position.y += debris.velocity.y * deltaTime;
        debris.mesh.position.z += debris.velocity.z * deltaTime;

        // Update rotation
        debris.mesh.rotation.x += debris.rotationSpeed.x * deltaTime;
        debris.mesh.rotation.y += debris.rotationSpeed.y * deltaTime;
        debris.mesh.rotation.z += debris.rotationSpeed.z * deltaTime;

        // Slow down
        debris.velocity.multiplyScalar(0.98);
        debris.rotationSpeed.multiplyScalar(0.99);

        // Decrease life
        debris.life -= deltaTime / debris.maxLife;

        // Shrink and fade as life decreases
        const lifeRatio = Math.max(0, debris.life);
        const scale = lifeRatio * lifeRatio; // Quadratic shrink for dramatic effect
        debris.mesh.scale.setScalar(scale);

        // Reduce emissive as it cools
        const material = debris.mesh.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = lifeRatio * 0.5;
      } else {
        debrisToRemove.push(debris);
      }
    }

    // Remove dead debris
    for (const debris of debrisToRemove) {
      this.scene.remove(debris.mesh);
      debris.mesh.geometry.dispose();
      (debris.mesh.material as THREE.Material).dispose();
      const index = this.activeDebris.indexOf(debris);
      if (index !== -1) {
        this.activeDebris.splice(index, 1);
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

    for (const debris of this.activeDebris) {
      this.scene.remove(debris.mesh);
      debris.mesh.geometry.dispose();
      (debris.mesh.material as THREE.Material).dispose();
    }
    this.activeDebris = [];

    if (this.textureCache) {
      this.textureCache.dispose();
      this.textureCache = null;
    }
  }
}
