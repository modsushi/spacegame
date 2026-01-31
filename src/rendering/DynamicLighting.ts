import * as THREE from 'three';
import { BaseEntity } from '../entities/BaseEntity';
import { EvolutionStageType } from '../config/GameConfig';

interface StarLight {
  entity: BaseEntity;
  light: THREE.PointLight;
}

// Star type configurations
const STAR_LIGHT_CONFIG: Record<string, { color: number; intensityMultiplier: number; rangeMultiplier: number }> = {
  star: {
    color: 0xffffcc,
    intensityMultiplier: 1.0,
    rangeMultiplier: 1.0,
  },
  blue_star: {
    color: 0x88aaff,
    intensityMultiplier: 1.5,
    rangeMultiplier: 1.2,
  },
  neutron_star: {
    color: 0xeeccff,
    intensityMultiplier: 2.0,
    rangeMultiplier: 0.8,
  },
};

const STAR_TYPES: EvolutionStageType[] = ['star', 'blue_star', 'neutron_star'];
const MAX_ACTIVE_LIGHTS = 4;

export class DynamicLighting {
  private scene: THREE.Scene;
  private activeLights: StarLight[] = [];
  private playerPosition: THREE.Vector3 = new THREE.Vector3();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  setPlayerPosition(x: number, y: number, z: number = 0): void {
    this.playerPosition.set(x, y, z);
  }

  update(entities: BaseEntity[]): void {
    // Find all star entities
    const stars = entities.filter(entity => {
      const type = (entity as { entityType?: EvolutionStageType }).entityType;
      return type && STAR_TYPES.includes(type);
    });

    // Sort by distance to player
    stars.sort((a, b) => {
      const distA = a.position.distanceTo(this.playerPosition);
      const distB = b.position.distanceTo(this.playerPosition);
      return distA - distB;
    });

    // Get the closest stars (up to MAX_ACTIVE_LIGHTS)
    const closestStars = stars.slice(0, MAX_ACTIVE_LIGHTS);

    // Remove lights for stars that are no longer in the closest list
    const starsToRemove = this.activeLights.filter(
      sl => !closestStars.includes(sl.entity)
    );
    for (const starLight of starsToRemove) {
      this.scene.remove(starLight.light);
      starLight.light.dispose();
      const index = this.activeLights.indexOf(starLight);
      if (index !== -1) {
        this.activeLights.splice(index, 1);
      }
    }

    // Add or update lights for closest stars
    for (const star of closestStars) {
      let starLight = this.activeLights.find(sl => sl.entity === star);

      const starType = (star as { entityType?: EvolutionStageType }).entityType ?? 'star';
      const config = STAR_LIGHT_CONFIG[starType] ?? STAR_LIGHT_CONFIG.star;

      if (!starLight) {
        // Create new light
        const light = new THREE.PointLight(
          config.color,
          this.calculateIntensity(star, config),
          this.calculateRange(star, config)
        );
        light.position.copy(star.position);
        this.scene.add(light);

        starLight = { entity: star, light };
        this.activeLights.push(starLight);
      }

      // Update light position and properties
      starLight.light.position.copy(star.position);
      starLight.light.color.setHex(config.color);
      starLight.light.intensity = this.calculateIntensity(star, config);
      starLight.light.distance = this.calculateRange(star, config);
    }
  }

  private calculateIntensity(
    star: BaseEntity,
    config: { intensityMultiplier: number }
  ): number {
    // Base intensity scales with star radius/size
    const baseIntensity = 2.0;
    const sizeMultiplier = Math.min(star.radius / 10, 3); // Cap at 3x
    return baseIntensity * sizeMultiplier * config.intensityMultiplier;
  }

  private calculateRange(
    star: BaseEntity,
    config: { rangeMultiplier: number }
  ): number {
    // Range scales with star size
    const baseRange = 200;
    const sizeMultiplier = Math.min(star.radius / 5, 5); // Cap at 5x
    return baseRange * sizeMultiplier * config.rangeMultiplier;
  }

  dispose(): void {
    for (const starLight of this.activeLights) {
      this.scene.remove(starLight.light);
      starLight.light.dispose();
    }
    this.activeLights = [];
  }
}
