import * as THREE from 'three';
import { BaseEntity } from './BaseEntity';
import { GameConfig, EVOLUTION_STAGES, EvolutionStageType } from '../config/GameConfig';
import { MaterialFactory } from '../rendering/MaterialFactory';
import { GeometryFactory } from '../rendering/GeometryFactory';
import { GlowHelper } from '../rendering/GlowHelper';
import { createAtmosphereMesh } from '../rendering/shaders/AtmosphereShader';

// Stages that should have atmosphere
const ATMOSPHERE_STAGES: EvolutionStageType[] = ['planet', 'gas_giant'];

export class Player extends BaseEntity {
  public evolutionStage: EvolutionStageType = 'meteorite';
  private stageIndex = 0;
  private glowSprite: THREE.Sprite | null = null;
  private shaderMaterial: THREE.ShaderMaterial | null = null;
  private atmosphereMesh: THREE.Mesh | null = null;

  constructor() {
    super(GameConfig.PLAYER_START_MASS, 0, 0);
  }

  createMesh(): THREE.Mesh {
    const geometry = GeometryFactory.createForStage(this.evolutionStage);
    const materialResult = MaterialFactory.createForStage(this.evolutionStage, undefined, true);
    const mesh = new THREE.Mesh(geometry, materialResult.material);
    mesh.position.copy(this.position);

    // Store shader material for animation updates
    if (materialResult.isShader && materialResult.material instanceof THREE.ShaderMaterial) {
      this.shaderMaterial = materialResult.material;
    }

    // Add atmosphere for planet stages
    if (ATMOSPHERE_STAGES.includes(this.evolutionStage) && materialResult.atmosphereColor) {
      this.atmosphereMesh = createAtmosphereMesh(
        this.radius,
        materialResult.atmosphereColor,
        0.7
      );
      mesh.add(this.atmosphereMesh);
    }

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

    // Reset references before creating new mesh
    this.shaderMaterial = null;
    this.atmosphereMesh = null;
    this.glowSprite = null;

    this.mesh = this.createMesh();
    scene.add(this.mesh);
  }

  update(deltaTime: number): void {
    super.update(deltaTime);

    if (this.mesh) {
      this.mesh.rotation.x += deltaTime * 0.5;
      this.mesh.rotation.y += deltaTime * 0.3;
    }

    // Update shader uniforms for animated materials
    if (this.shaderMaterial && this.shaderMaterial.uniforms.time) {
      this.shaderMaterial.uniforms.time.value += deltaTime;
    }

    if (this.glowSprite) {
      this.glowSprite.scale.setScalar(this.radius * 1.3);
    }
  }

  destroy(): void {
    if (this.shaderMaterial) {
      this.shaderMaterial.dispose();
      this.shaderMaterial = null;
    }

    if (this.atmosphereMesh) {
      this.atmosphereMesh.geometry.dispose();
      (this.atmosphereMesh.material as THREE.Material).dispose();
      this.atmosphereMesh = null;
    }

    super.destroy();
  }
}
