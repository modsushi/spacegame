import { EntityManager } from './EntityManager';
import { CelestialBody } from '../entities/CelestialBody';
import { Player } from '../entities/Player';
import { GameConfig, EVOLUTION_STAGES } from '../config/GameConfig';

export class SpawnSystem {
  private entityManager: EntityManager;
  private player: Player;
  private lastSpawnTime = 0;

  constructor(entityManager: EntityManager, player: Player) {
    this.entityManager = entityManager;
    this.player = player;

    this.initialSpawn();
  }

  private initialSpawn(): void {
    for (let i = 0; i < GameConfig.INITIAL_SPAWN_COUNT; i++) {
      this.spawnEntity();
    }
  }

  update(): void {
    const now = Date.now();

    if (now - this.lastSpawnTime > GameConfig.SPAWN_INTERVAL) {
      if (this.entityManager.getEntityCount() < GameConfig.MAX_ENTITIES) {
        this.spawnEntity();
      }
      this.lastSpawnTime = now;
    }

    this.despawnDistantEntities();
  }

  private spawnEntity(): void {
    const angle = Math.random() * Math.PI * 2;
    const distance =
      GameConfig.SPAWN_DISTANCE + Math.random() * GameConfig.SPAWN_DISTANCE * 0.5;

    const x = this.player.position.x + Math.cos(angle) * distance;
    const y = this.player.position.y + Math.sin(angle) * distance;

    const mass = this.generateMass();
    const entity = new CelestialBody(mass, x, y);

    this.entityManager.add(entity);
  }

  private hasLargeBody(): boolean {
    const entities = this.entityManager.getEntities();
    const playerMass = this.player.mass;

    for (const entity of entities) {
      if (entity === this.player) continue;
      if (entity.mass > playerMass) {
        return true;
      }
    }
    return false;
  }

  private generateMass(): number {
    const rand = Math.random();
    const playerMass = this.player.mass;

    let targetMass: number;

    // Check if we already have a large body
    const hasLarge = this.hasLargeBody();

    if (hasLarge) {
      // Only spawn smaller entities
      if (rand < 0.7) {
        // 70% much smaller (easy food)
        targetMass = playerMass * (0.1 + Math.random() * 0.3);
      } else {
        // 30% similar size
        targetMass = playerMass * (0.4 + Math.random() * 0.5);
      }
    } else {
      // Can spawn one large body
      if (rand < 0.6) {
        // 60% smaller (easy food)
        targetMass = playerMass * (0.1 + Math.random() * 0.4);
      } else if (rand < 0.85) {
        // 25% similar size
        targetMass = playerMass * (0.5 + Math.random() * 0.4);
      } else {
        // 15% larger (the ONE big threat)
        targetMass = playerMass * (1.2 + Math.random() * 0.5);
      }
    }

    // Clamp to valid range
    const minMass = EVOLUTION_STAGES[0].minMass + 1;
    const maxAllowedMass = Math.max(playerMass * 1.8, 15);

    return Math.max(minMass, Math.min(maxAllowedMass, targetMass));
  }

  private despawnDistantEntities(): void {
    const entities = this.entityManager.getEntities();

    for (const entity of entities) {
      if (entity === this.player) continue;

      if (entity instanceof CelestialBody && entity.isOrbiting()) {
        continue;
      }

      const dx = entity.position.x - this.player.position.x;
      const dy = entity.position.y - this.player.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > GameConfig.DESPAWN_DISTANCE) {
        this.entityManager.remove(entity);
      }
    }
  }
}
