import * as THREE from 'three';
import { EvolutionStageType, EVOLUTION_STAGES, isGlowing } from '../config/GameConfig';

export class GlowHelper {
  private static glowTexture: THREE.CanvasTexture | null = null;

  private static createGlowTexture(): THREE.CanvasTexture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      const data = new Uint8Array(size * size * 4);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 32;
      }
      const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
      texture.needsUpdate = true;
      return texture as unknown as THREE.CanvasTexture;
    }

    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    // Balanced glow intensity
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
    gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.08)');
    gradient.addColorStop(0.65, 'rgba(255, 255, 255, 0.02)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  static createGlowSprite(stage: EvolutionStageType, baseRadius: number): THREE.Sprite | null {
    if (!isGlowing(stage)) return null;

    if (!this.glowTexture) {
      this.glowTexture = this.createGlowTexture();
    }

    const stageConfig = EVOLUTION_STAGES.find((s) => s.type === stage);
    const color = stageConfig?.color ?? 0xffffff;

    let glowScale = 1.2;

    switch (stage) {
      case 'gas_giant':
        glowScale = 1.15;
        break;
      case 'star':
        glowScale = 1.25;
        break;
      case 'blue_star':
        glowScale = 1.3;
        break;
      case 'neutron_star':
        glowScale = 1.35;
        break;
      case 'wormhole':
        glowScale = 1.25;
        break;
    }

    // Cap glow size for very large entities to prevent screen clutter
    const maxGlowRadius = 100;
    const glowRadius = Math.min(baseRadius * glowScale, maxGlowRadius);

    const spriteMaterial = new THREE.SpriteMaterial({
      map: this.glowTexture,
      color: new THREE.Color(color),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.85
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.setScalar(glowRadius);

    return sprite;
  }
}
