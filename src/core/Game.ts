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
import { EVOLUTION_STAGES } from '../config/GameConfig';

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

  private update(deltaTime: number): void {
    // Don't update game logic if game is over
    if (this.isGameOver) {
      // Still render particles and effects
      this.particleEffects.update(deltaTime);
      return;
    }

    const direction = this.inputManager.getDirection();
    this.player.applyInput(direction.x, direction.y, deltaTime);

    this.gravitySystem.update(this.entityManager.getEntities(), deltaTime);

    this.physicsSystem.update(this.entityManager.getEntities(), deltaTime);

    const collisions = this.collisionSystem.detectCollisions(this.entityManager.getEntities());
    for (const [entityA, entityB] of collisions) {
      if (entityA.mass > entityB.mass) {
        entityA.onCollision(entityB);
        if (entityB instanceof CelestialBody || entityB instanceof Player) {
          this.spawnDestructionEffect(entityB);
        }

        // Check if player died
        if (entityB === this.player) {
          this.handlePlayerDeath();
          return;
        }

        this.entityManager.remove(entityB);
      } else if (entityB.mass > entityA.mass) {
        entityB.onCollision(entityA);
        if (entityA instanceof CelestialBody || entityA instanceof Player) {
          this.spawnDestructionEffect(entityA);
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

  private handlePlayerDeath(): void {
    this.isGameOver = true;

    // Remove player from entity manager
    this.entityManager.remove(this.player);

    // Show game over screen after a brief delay for the destruction effect
    setTimeout(() => {
      this.hud.showGameOver();
    }, 800);
  }

  private render(): void {
    this.sceneManager.render();
  }

  private spawnDestructionEffect(entity: CelestialBody | Player): void {
    // Get entity color from evolution stage config
    let color = 0xffffff;

    if (entity instanceof CelestialBody) {
      const stageConfig = EVOLUTION_STAGES.find(s => s.type === entity.entityType);
      if (stageConfig) {
        color = stageConfig.color;
      }
    } else if (entity instanceof Player) {
      const stageConfig = EVOLUTION_STAGES.find(s => s.type === entity.evolutionStage);
      if (stageConfig) {
        color = stageConfig.color;
      }
    }

    this.particleEffects.createDestructionEffect(
      entity.position.x,
      entity.position.y,
      entity.position.z,
      entity.radius,
      color
    );
  }
}
