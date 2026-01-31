import { BaseEntity } from '../entities/BaseEntity';
import { GameConfig } from '../config/GameConfig';

export class PhysicsSystem {
  update(entities: BaseEntity[], deltaTime: number): void {
    for (const entity of entities) {
      entity.position.x += entity.velocity.x * deltaTime;
      entity.position.y += entity.velocity.y * deltaTime;

      entity.velocity.x *= GameConfig.PLAYER_FRICTION;
      entity.velocity.y *= GameConfig.PLAYER_FRICTION;

      if (Math.abs(entity.velocity.x) < 0.01) entity.velocity.x = 0;
      if (Math.abs(entity.velocity.y) < 0.01) entity.velocity.y = 0;
    }
  }
}
