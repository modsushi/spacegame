import { BaseEntity } from '../entities/BaseEntity';
import { SpatialHash } from '../utils/SpatialHash';

export class CollisionSystem {
  private spatialHash: SpatialHash;
  private checkedPairs: Set<string> = new Set();

  constructor() {
    this.spatialHash = new SpatialHash();
  }

  detectCollisions(entities: BaseEntity[]): [BaseEntity, BaseEntity][] {
    const collisions: [BaseEntity, BaseEntity][] = [];

    this.spatialHash.clear();
    this.checkedPairs.clear();

    for (const entity of entities) {
      this.spatialHash.insert(entity);
    }

    for (const entity of entities) {
      const nearby = this.spatialHash.getNearby(entity);

      for (const other of nearby) {
        const pairKey = this.getPairKey(entity.id, other.id);
        if (this.checkedPairs.has(pairKey)) {
          continue;
        }
        this.checkedPairs.add(pairKey);

        if (this.checkCollision(entity, other)) {
          collisions.push([entity, other]);
        }
      }
    }

    return collisions;
  }

  private getPairKey(id1: string, id2: string): string {
    return id1 < id2 ? `${id1}:${id2}` : `${id2}:${id1}`;
  }

  private checkCollision(a: BaseEntity, b: BaseEntity): boolean {
    const dx = b.position.x - a.position.x;
    const dy = b.position.y - a.position.y;
    const distanceSquared = dx * dx + dy * dy;
    const radiusSum = a.radius + b.radius;

    return distanceSquared < radiusSum * radiusSum;
  }
}
