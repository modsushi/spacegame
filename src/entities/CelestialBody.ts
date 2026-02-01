import * as THREE from 'three';
import { BaseEntity } from './BaseEntity';
import { EVOLUTION_STAGES, EvolutionStageType } from '../config/GameConfig';
import { MaterialFactory, MaterialResult } from '../rendering/MaterialFactory';
import { GeometryFactory } from '../rendering/GeometryFactory';
import { GlowHelper } from '../rendering/GlowHelper';
import { DangerIndicator } from '../rendering/DangerIndicator';
import { createAtmosphereMesh } from '../rendering/shaders/AtmosphereShader';
import { createBlackHoleMesh } from '../rendering/shaders/BlackHoleShader';
import { createWormholeMesh } from '../rendering/shaders/WormholeShader';

export class CelestialBody extends BaseEntity {
  public readonly entityType: EvolutionStageType;
  private rotationSpeed: THREE.Vector3;
  private glowSprite: THREE.Sprite | null = null;
  private rings: THREE.Mesh | null = null;
  public readonly hasRings: boolean;
  private dangerSprite: THREE.Sprite | null = null;

  private orbitParent: BaseEntity | null = null;
  private orbitRadius = 0;
  private orbitAngle = 0;
  private orbitSpeed = 0;
  private orbitLine: THREE.Line | null = null;
  private moons: CelestialBody[] = [];

  // Graphics enhancements
  private shaderMaterial: THREE.ShaderMaterial | null = null;
  private atmosphereMesh: THREE.Mesh | null = null;
  private specialMesh: THREE.Group | null = null; // For black holes, wormholes

  constructor(mass: number, x: number, y: number, entityType?: EvolutionStageType) {
    super(mass, x, y);

    if (entityType) {
      this.entityType = entityType;
    } else {
      this.entityType = this.determineType(mass);
    }

    // Disable rings - too visually noisy at large scales
    this.hasRings = false;

    this.rotationSpeed = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 0.5
    );

    this.velocity.x = (Math.random() - 0.5) * 40;
    this.velocity.y = (Math.random() - 0.5) * 40;
  }

  private determineType(mass: number): EvolutionStageType {
    for (let i = EVOLUTION_STAGES.length - 1; i >= 0; i--) {
      if (mass >= EVOLUTION_STAGES[i].minMass) {
        return EVOLUTION_STAGES[i].type;
      }
    }
    return 'meteorite';
  }

  createMesh(): THREE.Mesh {
    // Special handling for black holes and wormholes
    if (this.entityType === 'black_hole') {
      return this.createBlackHoleMesh();
    }
    if (this.entityType === 'wormhole') {
      return this.createWormholeMesh();
    }

    const geometry = GeometryFactory.createForStage(this.entityType);
    const materialResult = MaterialFactory.createForStage(this.entityType);
    const mesh = new THREE.Mesh(geometry, materialResult.material);
    mesh.position.copy(this.position);

    // Store shader material reference for animation updates
    if (materialResult.isShader && materialResult.material instanceof THREE.ShaderMaterial) {
      this.shaderMaterial = materialResult.material;
    }

    // Add rings for Saturn-like gas giants
    if (this.hasRings) {
      const ringGeometry = GeometryFactory.createRingGeometry(
        this.radius * 1.2,
        this.radius * 1.6
      );
      const ringMaterial = MaterialFactory.createRingMaterial();
      this.rings = new THREE.Mesh(ringGeometry, ringMaterial);
      this.rings.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.2;
      mesh.add(this.rings);
    }

    // Add atmosphere for planets (70% chance)
    if (this.shouldHaveAtmosphere(this.entityType, materialResult)) {
      this.addAtmosphere(mesh, materialResult);
    }

    // Add glow for glowing entities
    this.glowSprite = GlowHelper.createGlowSprite(this.entityType, this.radius);
    if (this.glowSprite) {
      mesh.add(this.glowSprite);
    }

    // Add danger indicator (hidden by default)
    this.dangerSprite = DangerIndicator.createDangerSprite(this.radius);
    mesh.add(this.dangerSprite);

    return mesh;
  }

  private shouldHaveAtmosphere(type: EvolutionStageType, materialResult: MaterialResult): boolean {
    const atmosphereTypes: EvolutionStageType[] = ['dwarf_planet', 'planet'];
    if (!atmosphereTypes.includes(type)) return false;
    if (!materialResult.atmosphereColor) return false;
    return Math.random() < 0.7; // 70% chance
  }

  private addAtmosphere(mesh: THREE.Mesh, materialResult: MaterialResult): void {
    if (!materialResult.atmosphereColor) return;

    const intensity = materialResult.planetType === 'earth' ? 0.7 : 0.5;
    this.atmosphereMesh = createAtmosphereMesh(
      this.radius,
      materialResult.atmosphereColor,
      intensity
    );
    mesh.add(this.atmosphereMesh);
  }

  private createBlackHoleMesh(): THREE.Mesh {
    // Create the black hole group
    this.specialMesh = createBlackHoleMesh(this.radius);

    // We need to return a mesh for compatibility, so create a transparent placeholder
    const geometry = new THREE.SphereGeometry(this.radius * 0.01, 4, 4);
    const material = new THREE.MeshBasicMaterial({ visible: false });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.position);

    // Add the special mesh to this placeholder
    mesh.add(this.specialMesh);

    // Store shader materials for animation
    this.specialMesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
        this.shaderMaterial = child.material;
      }
    });

    // Add danger indicator
    this.dangerSprite = DangerIndicator.createDangerSprite(this.radius);
    mesh.add(this.dangerSprite);

    return mesh;
  }

  private createWormholeMesh(): THREE.Mesh {
    // Create the wormhole group
    this.specialMesh = createWormholeMesh(this.radius);

    // Transparent placeholder mesh
    const geometry = new THREE.SphereGeometry(this.radius * 0.01, 4, 4);
    const material = new THREE.MeshBasicMaterial({ visible: false });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.position);

    mesh.add(this.specialMesh);

    // Store first shader material for animation
    this.specialMesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
        if (!this.shaderMaterial) {
          this.shaderMaterial = child.material;
        }
      }
    });

    // Add glow
    this.glowSprite = GlowHelper.createGlowSprite(this.entityType, this.radius);
    if (this.glowSprite) {
      mesh.add(this.glowSprite);
    }

    // Add danger indicator
    this.dangerSprite = DangerIndicator.createDangerSprite(this.radius);
    mesh.add(this.dangerSprite);

    return mesh;
  }

  private createOrbitLine(): THREE.Line {
    const segments = 64;
    const points: THREE.Vector3[] = [];

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * this.orbitRadius,
          Math.sin(angle) * this.orbitRadius,
          0
        )
      );
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.25
    });

    return new THREE.Line(geometry, material);
  }

  onCollision(_other: BaseEntity): void {
    // Non-player entities don't consume others
  }

  setDangerous(isDangerous: boolean): void {
    if (this.dangerSprite) {
      this.dangerSprite.visible = isDangerous;
    }
  }

  isOrbiting(): boolean {
    return this.orbitParent !== null;
  }

  getOrbitLine(): THREE.Line | null {
    return this.orbitLine;
  }

  startOrbit(parent: BaseEntity, distance: number, scene?: THREE.Scene): void {
    this.orbitParent = parent;
    this.orbitRadius = distance;

    const dx = this.position.x - parent.position.x;
    const dy = this.position.y - parent.position.y;
    this.orbitAngle = Math.atan2(dy, dx);

    this.orbitSpeed = Math.sqrt(50 * parent.mass / distance) / distance;
    this.orbitSpeed *= 0.5 + Math.random() * 0.5;

    if (Math.random() > 0.5) {
      this.orbitSpeed *= -1;
    }

    this.orbitLine = this.createOrbitLine();
    if (scene) {
      scene.add(this.orbitLine);
    }
  }

  stopOrbit(scene?: THREE.Scene): void {
    if (this.orbitParent instanceof CelestialBody) {
      this.orbitParent.removeMoon(this);
    }
    this.orbitParent = null;

    if (this.orbitLine) {
      if (scene) {
        scene.remove(this.orbitLine);
      }
      this.orbitLine.geometry.dispose();
      (this.orbitLine.material as THREE.Material).dispose();
      this.orbitLine = null;
    }

    this.velocity.x = (Math.random() - 0.5) * 20;
    this.velocity.y = (Math.random() - 0.5) * 20;
  }

  getOrbitParent(): BaseEntity | null {
    return this.orbitParent;
  }

  addMoon(moon: CelestialBody): void {
    if (!this.moons.includes(moon)) {
      this.moons.push(moon);
    }
  }

  removeMoon(moon: CelestialBody): void {
    const index = this.moons.indexOf(moon);
    if (index !== -1) {
      this.moons.splice(index, 1);
    }
  }

  getMoonCount(): number {
    return this.moons.length;
  }

  getMoons(): CelestialBody[] {
    return [...this.moons];
  }

  updateOrbit(deltaTime: number): void {
    if (!this.orbitParent) return;

    this.orbitAngle += this.orbitSpeed * deltaTime;

    this.position.x =
      this.orbitParent.position.x + Math.cos(this.orbitAngle) * this.orbitRadius;
    this.position.y =
      this.orbitParent.position.y + Math.sin(this.orbitAngle) * this.orbitRadius;

    this.velocity.x = this.orbitParent.velocity.x;
    this.velocity.y = this.orbitParent.velocity.y;

    if (this.orbitLine) {
      this.orbitLine.position.x = this.orbitParent.position.x;
      this.orbitLine.position.y = this.orbitParent.position.y;
    }
  }

  update(deltaTime: number): void {
    super.update(deltaTime);

    if (this.mesh) {
      this.mesh.rotation.x += this.rotationSpeed.x * deltaTime;
      this.mesh.rotation.y += this.rotationSpeed.y * deltaTime;
      this.mesh.rotation.z += this.rotationSpeed.z * deltaTime;
    }

    // Update shader uniforms for animated materials
    if (this.shaderMaterial && this.shaderMaterial.uniforms.time) {
      this.shaderMaterial.uniforms.time.value += deltaTime;
    }

    // Update all shader materials in special meshes (black holes, wormholes)
    if (this.specialMesh) {
      this.specialMesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
          if (child.material.uniforms.time) {
            child.material.uniforms.time.value += deltaTime;
          }
        }
      });
    }

    if (this.glowSprite) {
      this.glowSprite.scale.setScalar(this.radius * 1.3);
    }

    if (this.dangerSprite) {
      DangerIndicator.updatePosition(this.dangerSprite, this.radius);
    }

    // Scale atmosphere with entity if needed
    if (this.atmosphereMesh) {
      // Atmosphere is added to mesh, scales automatically
    }
  }

  destroy(): void {
    for (const moon of this.moons) {
      moon.stopOrbit();
    }
    this.moons = [];

    if (this.orbitParent instanceof CelestialBody) {
      this.orbitParent.removeMoon(this);
    }

    if (this.orbitLine) {
      this.orbitLine.geometry.dispose();
      (this.orbitLine.material as THREE.Material).dispose();
      this.orbitLine = null;
    }

    // Dispose shader material
    if (this.shaderMaterial) {
      this.shaderMaterial.dispose();
      this.shaderMaterial = null;
    }

    // Dispose atmosphere
    if (this.atmosphereMesh) {
      this.atmosphereMesh.geometry.dispose();
      (this.atmosphereMesh.material as THREE.Material).dispose();
      this.atmosphereMesh = null;
    }

    // Dispose special mesh components
    if (this.specialMesh) {
      this.specialMesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
      this.specialMesh = null;
    }

    super.destroy();
  }
}
