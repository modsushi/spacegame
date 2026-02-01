import { GameLoop } from './GameLoop';
import { SceneManager } from './SceneManager';
import { InputManager } from './InputManager';
import { CameraController } from './CameraController';
import { EntityManager } from '../systems/EntityManager';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { GravitySystem } from '../systems/GravitySystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { EvolutionSystem } from '../systems/EvolutionSystem';
import { DynamicLighting } from '../rendering/DynamicLighting';
import { ParticleEffects } from '../rendering/ParticleEffects';
import { Player } from '../entities/Player';
import { CelestialBody } from '../entities/CelestialBody';
import { HUD } from '../ui/HUD';
import { ControlsGuide } from '../ui/ControlsGuide';
import { FloatingText } from '../ui/FloatingText';
import { EVOLUTION_STAGES, EvolutionStageType } from '../config/GameConfig';

// Mass similarity threshold - entities within this ratio are considered "same mass"
const SAME_MASS_THRESHOLD = 0.15; // 15% difference

// Chance for dramatic fusion explosion instead of regular explosion
const FUSION_EXPLOSION_CHANCE = 0.18; // 18% chance

export class Game {
  private gameLoop: GameLoop;
  private sceneManager: SceneManager;
  private inputManager: InputManager;
  private cameraController: CameraController;
  private entityManager: EntityManager;
  private physicsSystem: PhysicsSystem;
  private collisionSystem: CollisionSystem;
  private gravitySystem: GravitySystem;
  private spawnSystem: SpawnSystem;
  private evolutionSystem: EvolutionSystem;
  private dynamicLighting: DynamicLighting;
  private particleEffects: ParticleEffects;
  private player: Player;
  private hud: HUD;
  private controlsGuide: ControlsGuide;
  private floatingText: FloatingText;
  private isGameOver: boolean = false;

  constructor() {
    this.gameLoop = new GameLoop();
    this.sceneManager = new SceneManager();
    this.inputManager = new InputManager();
    this.cameraController = new CameraController(this.sceneManager.camera);
    this.entityManager = new EntityManager(this.sceneManager.scene);
    this.physicsSystem = new PhysicsSystem();
    this.collisionSystem = new CollisionSystem();
    this.gravitySystem = new GravitySystem(this.sceneManager.scene);
    this.evolutionSystem = new EvolutionSystem();
    this.dynamicLighting = new DynamicLighting(this.sceneManager.scene);
    this.particleEffects = new ParticleEffects(this.sceneManager.scene);
    this.hud = new HUD();
    this.controlsGuide = new ControlsGuide();
    this.floatingText = new FloatingText(this.sceneManager.camera);

    this.player = new Player();
    this.entityManager.add(this.player);

    this.spawnSystem = new SpawnSystem(this.entityManager, this.player);

    // Set up replay callback
    this.hud.setOnReplay(() => this.restart());
  }

  start(): void {
    this.gameLoop.start(
      (deltaTime) => this.update(deltaTime),
      () => this.render()
    );
  }

  private restart(): void {
    this.isGameOver = false;

    // Clear all entities (this also cleans up orbit lines)
    this.entityManager.clear();

    // Create new player
    this.player = new Player();
    this.entityManager.add(this.player);

    // Reset spawn system with new player reference
    this.spawnSystem = new SpawnSystem(this.entityManager, this.player);

    // Reset HUD
    this.hud.reset();

    // Reset camera
    this.cameraController.reset();

    // Show controls guide again
    this.controlsGuide.show();
  }

  private areSameMass(massA: number, massB: number): boolean {
    const ratio = Math.abs(massA - massB) / Math.max(massA, massB);
    return ratio <= SAME_MASS_THRESHOLD;
  }

  private getMinMassForStage(stage: EvolutionStageType): number {
    const stageConfig = EVOLUTION_STAGES.find(s => s.type === stage);
    return stageConfig ? stageConfig.minMass : 0;
  }

  private update(deltaTime: number): void {
    // Don't update game logic if game is over
    if (this.isGameOver) {
      // Still render particles and effects
      this.particleEffects.update(deltaTime);
      this.floatingText.update();
      return;
    }

    const direction = this.inputManager.getDirection();
    this.player.applyInput(direction.x, direction.y, deltaTime);

    this.gravitySystem.update(this.entityManager.getEntities(), deltaTime);

    this.physicsSystem.update(this.entityManager.getEntities(), deltaTime);

    const collisions = this.collisionSystem.detectCollisions(this.entityManager.getEntities());
    for (const [entityA, entityB] of collisions) {
      // Check if masses are similar (both lose mass)
      if (this.areSameMass(entityA.mass, entityB.mass)) {
        this.handleSameMassCollision(entityA, entityB);
        continue;
      }

      // One entity absorbs the other
      if (entityA.mass > entityB.mass) {
        const massGained = entityB.mass;
        entityA.onCollision(entityB);

        // Visual feedback
        if (entityB instanceof CelestialBody || entityB instanceof Player) {
          this.spawnDestructionEffect(entityB);

          // If player absorbed something, show absorption effect and mass text
          if (entityA === this.player) {
            this.spawnAbsorptionEffect(entityB, this.player);
            this.floatingText.showMassGain(
              this.player.position.x,
              this.player.position.y + this.player.radius + 2,
              this.player.position.z,
              massGained
            );
          }
        }

        // Check if player died
        if (entityB === this.player) {
          this.handlePlayerDeath();
          return;
        }

        this.entityManager.remove(entityB);
      } else if (entityB.mass > entityA.mass) {
        const massGained = entityA.mass;
        entityB.onCollision(entityA);

        // Visual feedback
        if (entityA instanceof CelestialBody || entityA instanceof Player) {
          this.spawnDestructionEffect(entityA);

          // If player absorbed something, show absorption effect and mass text
          if (entityB === this.player) {
            this.spawnAbsorptionEffect(entityA, this.player);
            this.floatingText.showMassGain(
              this.player.position.x,
              this.player.position.y + this.player.radius + 2,
              this.player.position.z,
              massGained
            );
          }
        }

        // Check if player died
        if (entityA === this.player) {
          this.handlePlayerDeath();
          return;
        }

        this.entityManager.remove(entityA);
      }
    }

    const evolved = this.evolutionSystem.checkEvolution(this.player);
    if (evolved) {
      this.player.updateMesh(this.sceneManager.scene);
      this.hud.showEvolutionNotification(this.player.evolutionStage);
    }

    this.spawnSystem.update();

    // Update danger indicators on celestial bodies
    for (const entity of this.entityManager.getEntities()) {
      if (entity instanceof CelestialBody) {
        entity.setDangerous(entity.mass >= this.player.mass);
      }
    }

    this.entityManager.update(deltaTime);

    // Update particle effects
    this.particleEffects.update(deltaTime);

    // Update floating text
    this.floatingText.update();

    // Update dynamic lighting from nearby stars
    this.dynamicLighting.setPlayerPosition(
      this.player.position.x,
      this.player.position.y
    );
    this.dynamicLighting.update(this.entityManager.getEntities());

    this.cameraController.update(
      this.player.position.x,
      this.player.position.y,
      this.player.radius
    );

    this.hud.update(this.player.mass, this.player.evolutionStage);
  }

  private handleSameMassCollision(entityA: any, entityB: any): void {
    // Both entities lose 30% of their mass
    const lossRatio = 0.3;
    const lossA = entityA.mass * lossRatio;
    const lossB = entityB.mass * lossRatio;

    entityA.mass -= lossA;
    entityB.mass -= lossB;

    // Update radii based on new mass
    entityA.updateRadiusFromMass();
    entityB.updateRadiusFromMass();

    // Create collision sparks at impact point
    const midX = (entityA.position.x + entityB.position.x) / 2;
    const midY = (entityA.position.y + entityB.position.y) / 2;
    const midZ = (entityA.position.z + entityB.position.z) / 2;
    const avgRadius = (entityA.radius + entityB.radius) / 2;

    // Spawn a small explosion at collision point
    this.particleEffects.createDestructionEffect(
      midX, midY, midZ,
      avgRadius * 0.5,
      0xffaa00 // Orange for collision
    );

    // Show mass loss for player if involved
    if (entityA === this.player) {
      this.floatingText.showMassLoss(
        this.player.position.x,
        this.player.position.y + this.player.radius + 2,
        this.player.position.z,
        lossA
      );

      // Bounce player away
      const dx = entityA.position.x - entityB.position.x;
      const dy = entityA.position.y - entityB.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      entityA.velocity.x += (dx / dist) * 30;
      entityA.velocity.y += (dy / dist) * 30;
    } else if (entityB === this.player) {
      this.floatingText.showMassLoss(
        this.player.position.x,
        this.player.position.y + this.player.radius + 2,
        this.player.position.z,
        lossB
      );

      // Bounce player away
      const dx = entityB.position.x - entityA.position.x;
      const dy = entityB.position.y - entityA.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      entityB.velocity.x += (dx / dist) * 30;
      entityB.velocity.y += (dy / dist) * 30;
    }

    // Bounce both entities apart
    const dx = entityA.position.x - entityB.position.x;
    const dy = entityA.position.y - entityB.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const bounceForce = 20;

    if (entityA !== this.player) {
      entityA.velocity.x += (dx / dist) * bounceForce;
      entityA.velocity.y += (dy / dist) * bounceForce;
    }
    if (entityB !== this.player) {
      entityB.velocity.x -= (dx / dist) * bounceForce;
      entityB.velocity.y -= (dy / dist) * bounceForce;
    }

    // Check if player dropped below their evolution stage minimum mass
    if (entityA === this.player || entityB === this.player) {
      const minMassForStage = this.getMinMassForStage(this.player.evolutionStage);
      if (this.player.mass < minMassForStage) {
        // Player lost too much mass to sustain their form
        this.floatingText.show(
          this.player.position.x,
          this.player.position.y + this.player.radius + 5,
          this.player.position.z,
          'UNSTABLE',
          '#ff4444',
          1500
        );
        setTimeout(() => this.handlePlayerDeath(), 300);
        return;
      }
    }

    // Check if either entity is now too small (mass < 1)
    if (entityA.mass < 1) {
      if (entityA === this.player) {
        this.handlePlayerDeath();
      } else {
        this.spawnDestructionEffect(entityA);
        this.entityManager.remove(entityA);
      }
    }
    if (entityB.mass < 1) {
      if (entityB === this.player) {
        this.handlePlayerDeath();
      } else {
        this.spawnDestructionEffect(entityB);
        this.entityManager.remove(entityB);
      }
    }
  }

  private handlePlayerDeath(): void {
    if (this.isGameOver) return; // Prevent multiple calls
    this.isGameOver = true;

    // Always use dramatic fusion explosion for player death
    this.spawnDestructionEffect(this.player, true);

    // Remove player from entity manager
    this.entityManager.remove(this.player);

    // Show game over screen after a brief delay for the destruction effect
    setTimeout(() => {
      this.hud.showGameOver();
    }, 1000);
  }

  private render(): void {
    this.sceneManager.render();
  }

  private spawnDestructionEffect(entity: CelestialBody | Player, forceFusion: boolean = false): void {
    // Get entity color and type from evolution stage config
    let color = 0xffffff;
    let entityType: EvolutionStageType = 'meteorite';

    if (entity instanceof CelestialBody) {
      entityType = entity.entityType;
      const stageConfig = EVOLUTION_STAGES.find(s => s.type === entityType);
      if (stageConfig) {
        color = stageConfig.color;
      }
    } else if (entity instanceof Player) {
      entityType = entity.evolutionStage;
      const stageConfig = EVOLUTION_STAGES.find(s => s.type === entityType);
      if (stageConfig) {
        color = stageConfig.color;
      }
    }

    // Only use fusion explosion for planet-tier and above
    const planetTierTypes: EvolutionStageType[] = [
      'planet', 'gas_giant', 'star', 'blue_star', 'neutron_star', 'black_hole', 'wormhole'
    ];
    const isPlanetTier = planetTierTypes.includes(entityType);

    // Randomly trigger fusion explosion for planet+ entities
    const useFusion = forceFusion || (isPlanetTier && Math.random() < FUSION_EXPLOSION_CHANCE);

    if (useFusion) {
      this.particleEffects.createFusionExplosion(
        entity.position.x,
        entity.position.y,
        entity.position.z,
        entity.radius,
        color
      );
    } else {
      this.particleEffects.createDestructionEffect(
        entity.position.x,
        entity.position.y,
        entity.position.z,
        entity.radius,
        color
      );
    }
  }

  private spawnAbsorptionEffect(from: CelestialBody | Player, to: Player): void {
    let color = 0xffffff;

    if (from instanceof CelestialBody) {
      const stageConfig = EVOLUTION_STAGES.find(s => s.type === from.entityType);
      if (stageConfig) {
        color = stageConfig.color;
      }
    } else if (from instanceof Player) {
      const stageConfig = EVOLUTION_STAGES.find(s => s.type === from.evolutionStage);
      if (stageConfig) {
        color = stageConfig.color;
      }
    }

    this.particleEffects.createAbsorptionEffect(
      from.position.x,
      from.position.y,
      from.position.z,
      from.radius,
      color,
      () => to.position.clone()
    );
  }
}
