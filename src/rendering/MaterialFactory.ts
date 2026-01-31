import * as THREE from 'three';
import { EvolutionStageType, EVOLUTION_STAGES } from '../config/GameConfig';

// Diverse color palettes for variety
const PLANET_COLORS = [
  0x4169e1, // Blue (Earth-like)
  0x228b22, // Green (forest world)
  0xcd853f, // Tan (desert)
  0x8b0000, // Dark red (Mars-like)
  0x4a4a6a, // Slate (rocky)
];

const ICY_COLORS = [
  0xadd8e6, // Light blue
  0xe0ffff, // Light cyan
  0xf0f8ff, // Alice blue
  0xb0e0e6, // Powder blue
];

const ROCKY_COLORS = [
  0x696969, // Dim gray
  0x808080, // Gray
  0xa0522d, // Sienna
  0x8b4513, // Saddle brown
  0x556b2f, // Dark olive
];

const GAS_GIANT_COLORS = [
  0xffd700, // Gold (Saturn-like)
  0xdaa520, // Goldenrod
  0xf4a460, // Sandy brown
  0xd2691e, // Chocolate
  0xcd5c5c, // Indian red (Jupiter-like)
];

export class MaterialFactory {
  static createForStage(stage: EvolutionStageType, variant?: number): THREE.Material {
    const stageConfig = EVOLUTION_STAGES.find((s) => s.type === stage);
    const baseColor = stageConfig?.color ?? 0xffffff;

    // Use variant for color diversity
    const v = variant ?? Math.random();

    let material: THREE.Material;

    switch (stage) {
      case 'meteorite':
        material = new THREE.MeshStandardMaterial({
          color: ROCKY_COLORS[Math.floor(v * ROCKY_COLORS.length)],
          roughness: 0.95,
          metalness: 0.1
        });
        break;

      case 'asteroid':
        material = new THREE.MeshStandardMaterial({
          color: ROCKY_COLORS[Math.floor(v * ROCKY_COLORS.length)],
          roughness: 0.9,
          metalness: 0.15
        });
        break;

      case 'dwarf_planet': {
        // Mix of icy and rocky
        const isIcy = v < 0.4;
        const colors = isIcy ? ICY_COLORS : ROCKY_COLORS;
        material = new THREE.MeshStandardMaterial({
          color: colors[Math.floor(Math.random() * colors.length)],
          roughness: isIcy ? 0.3 : 0.7,
          metalness: isIcy ? 0.1 : 0.2
        });
        break;
      }

      case 'planet': {
        // Diverse planet types
        const planetType = Math.random();
        let color: number;
        let roughness: number;

        if (planetType < 0.3) {
          // Icy world
          color = ICY_COLORS[Math.floor(Math.random() * ICY_COLORS.length)];
          roughness = 0.2;
        } else if (planetType < 0.6) {
          // Rocky world
          color = ROCKY_COLORS[Math.floor(Math.random() * ROCKY_COLORS.length)];
          roughness = 0.7;
        } else {
          // Earth-like
          color = PLANET_COLORS[Math.floor(Math.random() * PLANET_COLORS.length)];
          roughness = 0.5;
        }

        material = new THREE.MeshStandardMaterial({
          color,
          roughness,
          metalness: 0.1
        });
        break;
      }

      case 'gas_giant':
        material = new THREE.MeshStandardMaterial({
          color: GAS_GIANT_COLORS[Math.floor(v * GAS_GIANT_COLORS.length)],
          roughness: 0.4,
          metalness: 0.0,
          emissive: new THREE.Color(GAS_GIANT_COLORS[Math.floor(v * GAS_GIANT_COLORS.length)]),
          emissiveIntensity: 0.05
        });
        break;

      case 'star':
        material = new THREE.MeshStandardMaterial({
          color: 0xffffee,
          emissive: new THREE.Color(0xffdd44),
          emissiveIntensity: 0.4,
          roughness: 0.0,
          metalness: 0.0
        });
        break;

      case 'blue_star':
        material = new THREE.MeshStandardMaterial({
          color: 0xeeeeff,
          emissive: new THREE.Color(0x4488ff),
          emissiveIntensity: 0.5,
          roughness: 0.0,
          metalness: 0.0
        });
        break;

      case 'neutron_star':
        material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: new THREE.Color(0xee88ff),
          emissiveIntensity: 0.6,
          roughness: 0.0,
          metalness: 0.0
        });
        break;

      case 'black_hole':
        material = new THREE.MeshBasicMaterial({
          color: 0x000000
        });
        break;

      case 'wormhole':
        material = new THREE.MeshStandardMaterial({
          color: 0xddddff,
          emissive: new THREE.Color(0x8844dd),
          emissiveIntensity: 0.3,
          roughness: 0.0,
          metalness: 0.0,
          transparent: true,
          opacity: 0.9
        });
        break;

      default:
        material = new THREE.MeshStandardMaterial({ color: baseColor });
    }

    return material;
  }

  static createRingMaterial(): THREE.Material {
    return new THREE.MeshBasicMaterial({
      color: 0xaa9966,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });
  }
}
