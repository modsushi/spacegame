import * as THREE from 'three';
import { GameConfig } from '../config/GameConfig';

let entityIdCounter = 0;

export abstract class BaseEntity {
  public readonly id: string;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public mass: number;
  public radius: number;
  public mesh: THREE.Mesh | null = null;

  constructor(mass: number, x = 0, y = 0) {
    this.id = `entity_${entityIdCounter++}`;
    this.position = new THREE.Vector3(x, y, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.mass = mass;
    this.radius = this.calculateRadius(mass);
  }

  protected calculateRadius(mass: number): number {
    return GameConfig.BASE_RADIUS * Math.pow(mass, GameConfig.MASS_TO_RADIUS_POWER);
  }

  abstract createMesh(): THREE.Mesh;

  abstract onCollision(other: BaseEntity): void;

  update(_deltaTime: number): void {
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.scale.setScalar(this.radius / GameConfig.BASE_RADIUS);
    }
  }

  destroy(): void {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      if (this.mesh.material instanceof THREE.Material) {
        this.mesh.material.dispose();
      }
    }
  }
}
