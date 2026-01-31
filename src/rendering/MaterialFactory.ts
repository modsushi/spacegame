import * as THREE from 'three';
import { EvolutionStageType, EVOLUTION_STAGES } from '../config/GameConfig';
import { TextureGenerator, TextureType } from './TextureGenerator';
import { createStarMaterial } from './shaders/StarShader';
import { createGasGiantMaterial } from './shaders/GasGiantShader';
import { createBlackHoleCoreMaterial } from './shaders/BlackHoleShader';
import { createWormholeMaterial } from './shaders/WormholeShader';

// Atmosphere colors for different planet types
export const ATMOSPHERE_COLORS: Record<string, THREE.Color> = {
  earth: new THREE.Color(0x88aaff),
  desert: new THREE.Color(0xffaa88),
  ice: new THREE.Color(0xaaddff),
  rocky: new THREE.Color(0x888899),
};

export interface MaterialResult {
  material: THREE.Material;
  isShader: boolean;
  atmosphereColor?: THREE.Color;
  planetType?: string;
}

// Number of texture variations per type (for caching)
const TEXTURE_POOL_SIZE = 4;

export class MaterialFactory {
  static createForStage(
    stage: EvolutionStageType,
    variant?: number,
    isPlayer: boolean = false
  ): MaterialResult {
    const stageConfig = EVOLUTION_STAGES.find((s) => s.type === stage);
    const baseColor = stageConfig?.color ?? 0xffffff;

    // Use variant for color diversity and texture seeding
    const v = variant ?? Math.random();
    // Use a small pool of seeds so textures can be cached and reused
    const seedIndex = Math.floor(v * TEXTURE_POOL_SIZE);
    const seed = isPlayer ? Math.floor(v * 10000) : seedIndex * 1000;

    let material: THREE.Material;
    let isShader = false;
    let atmosphereColor: THREE.Color | undefined;
    let planetType: string | undefined;

    switch (stage) {
      case 'meteorite': {
        const texture = TextureGenerator.generateTexture('rocky', seed, isPlayer);
        const normalMap = TextureGenerator.generateNormalMap('rocky', seed, isPlayer);
        material = new THREE.MeshStandardMaterial({
          map: texture,
          normalMap: normalMap,
          normalScale: new THREE.Vector2(0.5, 0.5),
          color: 0xffffff, // White - let texture provide color
          roughness: 0.95,
          metalness: 0.1,
        });
        break;
      }

      case 'asteroid': {
        const texture = TextureGenerator.generateTexture('rocky', seed + 1000, isPlayer);
        const normalMap = TextureGenerator.generateNormalMap('rocky', seed + 1000, isPlayer);
        material = new THREE.MeshStandardMaterial({
          map: texture,
          normalMap: normalMap,
          normalScale: new THREE.Vector2(0.6, 0.6),
          color: 0xffffff, // White - let texture provide color
          roughness: 0.9,
          metalness: 0.15,
        });
        break;
      }

      case 'dwarf_planet': {
        const isIcy = v < 0.4;
        const textureType: TextureType = isIcy ? 'planet_ice' : 'rocky';
        const texture = TextureGenerator.generateTexture(textureType, seed, isPlayer);
        const normalMap = TextureGenerator.generateNormalMap(textureType, seed, isPlayer);

        material = new THREE.MeshStandardMaterial({
          map: texture,
          normalMap: normalMap,
          normalScale: new THREE.Vector2(0.4, 0.4),
          color: 0xffffff, // White - let texture provide color
          roughness: isIcy ? 0.3 : 0.7,
          metalness: isIcy ? 0.1 : 0.2,
        });

        if (isIcy) {
          atmosphereColor = ATMOSPHERE_COLORS.ice;
          planetType = 'ice';
        }
        break;
      }

      case 'planet': {
        const planetRand = Math.random();
        let roughness: number;
        let textureType: TextureType;

        if (planetRand < 0.3) {
          // Icy world
          textureType = 'planet_ice';
          roughness = 0.2;
          atmosphereColor = ATMOSPHERE_COLORS.ice;
          planetType = 'ice';
        } else if (planetRand < 0.5) {
          // Rocky world
          textureType = 'rocky';
          roughness = 0.7;
          atmosphereColor = ATMOSPHERE_COLORS.rocky;
          planetType = 'rocky';
        } else if (planetRand < 0.75) {
          // Desert world
          textureType = 'planet_desert';
          roughness = 0.6;
          atmosphereColor = ATMOSPHERE_COLORS.desert;
          planetType = 'desert';
        } else {
          // Earth-like
          textureType = 'planet_earth';
          roughness = 0.5;
          atmosphereColor = ATMOSPHERE_COLORS.earth;
          planetType = 'earth';
        }

        const texture = TextureGenerator.generateTexture(textureType, seed, isPlayer);
        const normalMap = TextureGenerator.generateNormalMap(textureType, seed, isPlayer);

        material = new THREE.MeshStandardMaterial({
          map: texture,
          normalMap: normalMap,
          normalScale: new THREE.Vector2(0.3, 0.3),
          color: 0xffffff, // White - let texture provide color
          roughness,
          metalness: 0.1,
        });
        break;
      }

      case 'gas_giant': {
        // Use custom shader for animated bands
        material = createGasGiantMaterial();
        isShader = true;
        break;
      }

      case 'star': {
        // Use custom shader for animated plasma
        material = createStarMaterial(
          new THREE.Color(0xffdd44),
          new THREE.Color(0xffaa00)
        );
        isShader = true;
        break;
      }

      case 'blue_star': {
        material = createStarMaterial(
          new THREE.Color(0x88aaff),
          new THREE.Color(0x4488ff)
        );
        isShader = true;
        break;
      }

      case 'neutron_star': {
        material = createStarMaterial(
          new THREE.Color(0xeeccff),
          new THREE.Color(0xcc88ff)
        );
        isShader = true;
        break;
      }

      case 'black_hole': {
        material = createBlackHoleCoreMaterial();
        isShader = false; // Core is not animated, but accretion disk is added separately
        break;
      }

      case 'wormhole': {
        material = createWormholeMaterial();
        isShader = true;
        break;
      }

      default:
        material = new THREE.MeshStandardMaterial({ color: baseColor });
    }

    return { material, isShader, atmosphereColor, planetType };
  }

  // Legacy method for backwards compatibility
  static createMaterialOnly(stage: EvolutionStageType, variant?: number): THREE.Material {
    return this.createForStage(stage, variant).material;
  }

  static createRingMaterial(): THREE.Material {
    return new THREE.MeshBasicMaterial({
      color: 0xaa9966,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
  }
}
