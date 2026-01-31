import * as THREE from 'three';
import { EvolutionStageType } from '../config/GameConfig';
import { GameConfig } from '../config/GameConfig';

export class GeometryFactory {
  static createForStage(stage: EvolutionStageType): THREE.BufferGeometry {
    let geometry: THREE.BufferGeometry;

    switch (stage) {
      case 'meteorite':
        geometry = new THREE.IcosahedronGeometry(GameConfig.BASE_RADIUS, 0);
        break;

      case 'asteroid':
        geometry = new THREE.IcosahedronGeometry(GameConfig.BASE_RADIUS, 1);
        this.distortGeometry(geometry, 0.3);
        break;

      case 'dwarf_planet':
        geometry = new THREE.IcosahedronGeometry(GameConfig.BASE_RADIUS, 2);
        this.distortGeometry(geometry, 0.15);
        break;

      case 'planet':
        geometry = new THREE.SphereGeometry(GameConfig.BASE_RADIUS, 24, 24);
        break;

      case 'gas_giant':
        geometry = new THREE.SphereGeometry(GameConfig.BASE_RADIUS, 32, 32);
        break;

      case 'star':
        geometry = new THREE.SphereGeometry(GameConfig.BASE_RADIUS, 24, 24);
        break;

      case 'blue_star':
        geometry = new THREE.SphereGeometry(GameConfig.BASE_RADIUS, 24, 24);
        break;

      case 'neutron_star':
        geometry = new THREE.SphereGeometry(GameConfig.BASE_RADIUS, 16, 16);
        break;

      case 'black_hole':
        geometry = new THREE.TorusGeometry(GameConfig.BASE_RADIUS, GameConfig.BASE_RADIUS * 0.25, 16, 32);
        break;

      case 'wormhole':
        geometry = new THREE.TorusGeometry(GameConfig.BASE_RADIUS, GameConfig.BASE_RADIUS * 0.3, 16, 32);
        break;

      default:
        geometry = new THREE.SphereGeometry(GameConfig.BASE_RADIUS, 16, 16);
    }

    return geometry;
  }

  static createRingGeometry(innerRadius: number, outerRadius: number): THREE.BufferGeometry {
    return new THREE.RingGeometry(innerRadius, outerRadius, 32);
  }

  private static distortGeometry(geometry: THREE.BufferGeometry, amount: number): void {
    const positionAttribute = geometry.getAttribute('position');
    const positions = positionAttribute.array as Float32Array;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];

      const length = Math.sqrt(x * x + y * y + z * z);
      const noise = 1 + (Math.random() - 0.5) * amount;

      positions[i] = (x / length) * length * noise;
      positions[i + 1] = (y / length) * length * noise;
      positions[i + 2] = (z / length) * length * noise;
    }

    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
  }
}
