import * as THREE from 'three';
import { BaseEntity } from '../entities/BaseEntity';
import { CelestialBody } from '../entities/CelestialBody';
import { Player } from '../entities/Player';
import { GameConfig, hasGravity } from '../config/GameConfig';

export class GravitySystem {
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  update(entities: BaseEntity[], deltaTime: number): void {
    const gravityBodies: BaseEntity[] = [];
    const orbitableBodies: BaseEntity[] = [];

    for (const entity of entities) {
      if (entity.mass >= GameConfig.MIN_MASS_FOR_GRAVITY) {
        if (entity instanceof CelestialBody && hasGravity(entity.entityType)) {
          gravityBodies.push(entity);
        } else if (entity instanceof Player && hasGravity(entity.evolutionStage)) {
          gravityBodies.push(entity);
        }
      }

      if (entity instanceof CelestialBody && !entity.isOrbiting()) {
        orbitableBodies.push(entity);
      }
    }

    for (const attractor of gravityBodies) {
      const gravityRange = attractor.radius * GameConfig.GRAVITY_RANGE_MULTIPLIER;

      for (const body of orbitableBodies) {
        if (body === attractor) continue;
        if (body.mass >= attractor.mass * 0.5) continue;

        const dx = attractor.position.x - body.position.x;
        const dy = attractor.position.y - body.position.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        if (dist > gravityRange) continue;
        if (dist < attractor.radius + body.radius) continue;

        const forceMag =
          (GameConfig.GRAVITY_CONSTANT * attractor.mass) / (distSq + 100);

        const fx = (dx / dist) * forceMag * deltaTime;
        const fy = (dy / dist) * forceMag * deltaTime;

        body.velocity.x += fx;
        body.velocity.y += fy;

        if (body instanceof CelestialBody) {
          this.checkCapture(attractor, body, dist);
        }
      }
    }

    for (const entity of entities) {
      if (entity instanceof CelestialBody && entity.isOrbiting()) {
        entity.updateOrbit(deltaTime);
      }
    }
  }

  private checkCapture(attractor: BaseEntity, body: CelestialBody, distance: number): void {
    if (body.isOrbiting()) return;

    let attractorMoons = 0;
    if (attractor instanceof CelestialBody) {
      attractorMoons = attractor.getMoonCount();
    }
    if (attractorMoons >= GameConfig.MAX_MOONS) return;

    const relVelX = body.velocity.x - attractor.velocity.x;
    const relVelY = body.velocity.y - attractor.velocity.y;
    const relSpeed = Math.sqrt(relVelX * relVelX + relVelY * relVelY);

    const captureRange = attractor.radius * 4;

    if (distance < captureRange && relSpeed < GameConfig.CAPTURE_VELOCITY_THRESHOLD) {
      const escapeVel = Math.sqrt(
        (2 * GameConfig.GRAVITY_CONSTANT * attractor.mass) / distance
      );

      if (relSpeed < escapeVel * 0.8) {
        body.startOrbit(attractor, distance, this.scene);

        if (attractor instanceof CelestialBody) {
          attractor.addMoon(body);
        }
      }
    }
  }
}
