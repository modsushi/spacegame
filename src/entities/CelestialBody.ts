import * as THREE from 'three';
import { BaseEntity } from './BaseEntity';
import { EVOLUTION_STAGES, EvolutionStageType } from '../config/GameConfig';
import { MaterialFactory } from '../rendering/MaterialFactory';
import { GeometryFactory } from '../rendering/GeometryFactory';
import { GlowHelper } from '../rendering/GlowHelper';

export class CelestialBody extends BaseEntity {
  public readonly entityType: EvolutionStageType;
  private rotationSpeed: THREE.Vector3;
  private glowSprite: THREE.Sprite | null = null;
  private rings: THREE.Mesh | null = null;
  public readonly hasRings: boolean;

  private orbitParent: BaseEntity | null = null;
  private orbitRadius = 0;
  private orbitAngle = 0;
  private orbitSpeed = 0;
  private orbitLine: THREE.Line | null = null;
  private moons: CelestialBody[] = [];

  constructor(mass: number, x: number, y: number, entityType?: EvolutionStageType) {
    super(mass, x, y);

    if (entityType) {
      this.entityType = entityType;
    } else {
      this.entityType = this.determineType(mass);
    }

    // 40% of gas giants have rings (Saturn-like)
    this.hasRings = this.entityType === 'gas_giant' && Math.random() < 0.4;

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
    const geometry = GeometryFactory.createForStage(this.entityType);
    const material = MaterialFactory.createForStage(this.entityType);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.position);

    // Add rings for Saturn-like gas giants (smaller, more subtle)
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

    // Add glow for glowing entities
    this.glowSprite = GlowHelper.createGlowSprite(this.entityType, this.radius);
    if (this.glowSprite) {
      mesh.add(this.glowSprite);
    }

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
      opacity: 0.3
    });

    return new THREE.Line(geometry, material);
  }

  onCollision(_other: BaseEntity): void {
    // Non-player entities don't consume others
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

    if (this.glowSprite) {
      this.glowSprite.scale.setScalar(this.radius * 1.3);
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

    super.destroy();
  }
}
