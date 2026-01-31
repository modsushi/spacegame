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
import { Player } from '../entities/Player';
import { HUD } from '../ui/HUD';

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
  private player: Player;
  private hud: HUD;

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
    this.hud = new HUD();

    this.player = new Player();
    this.entityManager.add(this.player);

    this.spawnSystem = new SpawnSystem(this.entityManager, this.player);
  }

  start(): void {
    this.gameLoop.start(
      (deltaTime) => this.update(deltaTime),
      () => this.render()
    );
  }

  private update(deltaTime: number): void {
    const direction = this.inputManager.getDirection();
    this.player.applyInput(direction.x, direction.y, deltaTime);

    this.gravitySystem.update(this.entityManager.getEntities(), deltaTime);

    this.physicsSystem.update(this.entityManager.getEntities(), deltaTime);

    const collisions = this.collisionSystem.detectCollisions(this.entityManager.getEntities());
    for (const [entityA, entityB] of collisions) {
      if (entityA.mass > entityB.mass) {
        entityA.onCollision(entityB);
        this.entityManager.remove(entityB);
      } else if (entityB.mass > entityA.mass) {
        entityB.onCollision(entityA);
        this.entityManager.remove(entityA);
      }
    }

    const evolved = this.evolutionSystem.checkEvolution(this.player);
    if (evolved) {
      this.player.updateMesh(this.sceneManager.scene);
      this.hud.showEvolutionNotification(this.player.evolutionStage);
    }

    this.spawnSystem.update();

    this.entityManager.update(deltaTime);

    this.cameraController.update(
      this.player.position.x,
      this.player.position.y,
      this.player.radius
    );

    this.hud.update(this.player.mass, this.player.evolutionStage);
  }

  private render(): void {
    this.sceneManager.render();
  }
}
