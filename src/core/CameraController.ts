import * as THREE from 'three';
import { GameConfig } from '../config/GameConfig';

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private targetPosition = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  update(targetX: number, targetY: number, targetRadius: number): void {
    this.targetPosition.set(targetX, targetY, 0);

    const currentPos = new THREE.Vector3(
      this.camera.position.x,
      this.camera.position.y,
      0
    );

    currentPos.lerp(this.targetPosition, GameConfig.CAMERA_LERP_SPEED);

    this.camera.position.x = currentPos.x;
    this.camera.position.y = currentPos.y;

    const zoomFactor = Math.max(1, targetRadius / GameConfig.BASE_RADIUS);
    const targetZ = GameConfig.CAMERA_DISTANCE * Math.sqrt(zoomFactor);
    const clampedZ = Math.min(
      Math.max(targetZ, GameConfig.CAMERA_MIN_DISTANCE),
      GameConfig.CAMERA_MAX_DISTANCE
    );

    this.camera.position.z += (clampedZ - this.camera.position.z) * GameConfig.CAMERA_LERP_SPEED;
  }
}
