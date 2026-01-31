import { BaseEntity } from '../entities/BaseEntity';
import { GameConfig } from '../config/GameConfig';

export class SpatialHash {
  private cellSize: number;
  private cells: Map<string, BaseEntity[]> = new Map();

  constructor(cellSize: number = GameConfig.COLLISION_CELL_SIZE) {
    this.cellSize = cellSize;
  }

  clear(): void {
    this.cells.clear();
  }

  insert(entity: BaseEntity): void {
    const minX = entity.position.x - entity.radius;
    const maxX = entity.position.x + entity.radius;
    const minY = entity.position.y - entity.radius;
    const maxY = entity.position.y + entity.radius;

    const startCellX = Math.floor(minX / this.cellSize);
    const endCellX = Math.floor(maxX / this.cellSize);
    const startCellY = Math.floor(minY / this.cellSize);
    const endCellY = Math.floor(maxY / this.cellSize);

    for (let x = startCellX; x <= endCellX; x++) {
      for (let y = startCellY; y <= endCellY; y++) {
        const key = `${x},${y}`;
        if (!this.cells.has(key)) {
          this.cells.set(key, []);
        }
        this.cells.get(key)!.push(entity);
      }
    }
  }

  getNearby(entity: BaseEntity): BaseEntity[] {
    const nearby: Set<BaseEntity> = new Set();

    const minX = entity.position.x - entity.radius;
    const maxX = entity.position.x + entity.radius;
    const minY = entity.position.y - entity.radius;
    const maxY = entity.position.y + entity.radius;

    const startCellX = Math.floor(minX / this.cellSize);
    const endCellX = Math.floor(maxX / this.cellSize);
    const startCellY = Math.floor(minY / this.cellSize);
    const endCellY = Math.floor(maxY / this.cellSize);

    for (let x = startCellX; x <= endCellX; x++) {
      for (let y = startCellY; y <= endCellY; y++) {
        const key = `${x},${y}`;
        const cell = this.cells.get(key);
        if (cell) {
          for (const other of cell) {
            if (other.id !== entity.id) {
              nearby.add(other);
            }
          }
        }
      }
    }

    return Array.from(nearby);
  }
}
