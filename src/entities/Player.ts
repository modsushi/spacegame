import * as THREE from 'three';
import { BaseEntity } from './BaseEntity';
import { GameConfig, EVOLUTION_STAGES, EvolutionStageType } from '../config/GameConfig';
import { MaterialFactory } from '../rendering/MaterialFactory';
import { GeometryFactory } from '../rendering/GeometryFactory';
import { GlowHelper } from '../rendering/GlowHelper';

export class Player extends BaseEntity {
  public evolutionStage: EvolutionStageType = 'meteorite';
  private stageIndex = 0;
  private glowSprite: THREE.Sprite | null = null;

  constructor() {
    super(GameConfig.PLAYER_START_MASS, 0, 0);
  }

  createMesh(): THREE.Mesh {
    const geometry = GeometryFactory.createForStage(this.evolutionStage);
    const material = MaterialFactory.createForStage(this.evolutionStage);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.position);

    this.glowSprite = GlowHelper.createGlowSprite(this.evolutionStage, this.radius);
    if (this.glowSprite) {
      mesh.add(this.glowSprite);
    }

    return mesh;
  }

  applyInput(dirX: number, dirY: number, deltaTime: number): void {
    this.velocity.x += dirX * GameConfig.PLAYER_ACCELERATION * deltaTime;
    this.velocity.y += dirY * GameConfig.PLAYER_ACCELERATION * deltaTime;

    const speed = this.velocity.length();
    if (speed > GameConfig.PLAYER_MAX_SPEED) {
      this.velocity.multiplyScalar(GameConfig.PLAYER_MAX_SPEED / speed);
    }
  }

  onCollision(other: BaseEntity): void {
    this.addMass(other.mass);
  }

  addMass(amount: number): void {
    this.mass += amount;
    this.radius = this.calculateRadius(this.mass);
  }

  checkEvolution(): boolean {
    const currentStage = EVOLUTION_STAGES[this.stageIndex];

    if (this.mass >= currentStage.maxMass && this.stageIndex < EVOLUTION_STAGES.length - 1) {
      this.stageIndex++;
      this.evolutionStage = EVOLUTION_STAGES[this.stageIndex].type;
      return true;
    }

    return false;
  }

  updateMesh(scene: THREE.Scene): void {
    if (this.mesh) {
      scene.remove(this.mesh);
      this.destroy();
    }

    this.mesh = this.createMesh();
    scene.add(this.mesh);
  }

  update(deltaTime: number): void {
    super.update(deltaTime);

    if (this.mesh) {
      this.mesh.rotation.x += deltaTime * 0.5;
      this.mesh.rotation.y += deltaTime * 0.3;
    }

    if (this.glowSprite) {
      this.glowSprite.scale.setScalar(this.radius * 1.3);
    }
  }
}
