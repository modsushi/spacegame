import * as THREE from 'three';
import { BaseEntity } from '../entities/BaseEntity';
import { CelestialBody } from '../entities/CelestialBody';

export class EntityManager {
  private entities: Map<string, BaseEntity> = new Map();
  private scene: THREE.Scene;
  private toRemove: Set<string> = new Set();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  add(entity: BaseEntity): void {
    this.entities.set(entity.id, entity);
    entity.mesh = entity.createMesh();
    this.scene.add(entity.mesh);
  }

  remove(entity: BaseEntity): void {
    this.toRemove.add(entity.id);
  }

  private processRemovals(): void {
    for (const id of this.toRemove) {
      const entity = this.entities.get(id);
      if (entity) {
        if (entity.mesh) {
          this.scene.remove(entity.mesh);
        }

        if (entity instanceof CelestialBody) {
          const orbitLine = entity.getOrbitLine();
          if (orbitLine) {
            this.scene.remove(orbitLine);
          }
          entity.stopOrbit(this.scene);
        }

        entity.destroy();
        this.entities.delete(id);
      }
    }
    this.toRemove.clear();
  }

  update(deltaTime: number): void {
    this.processRemovals();

    for (const entity of this.entities.values()) {
      entity.update(deltaTime);
    }
  }

  getEntities(): BaseEntity[] {
    return Array.from(this.entities.values());
  }

  getEntityCount(): number {
    return this.entities.size;
  }

  getEntity(id: string): BaseEntity | undefined {
    return this.entities.get(id);
  }

  getScene(): THREE.Scene {
    return this.scene;
  }
}
