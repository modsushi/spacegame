import * as THREE from 'three';

export class DangerIndicator {
  private static warningTexture: THREE.CanvasTexture | null = null;

  private static createWarningTexture(): THREE.CanvasTexture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      const data = new Uint8Array(size * size * 4);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 200;
      }
      const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
      texture.needsUpdate = true;
      return texture as unknown as THREE.CanvasTexture;
    }

    ctx.clearRect(0, 0, size, size);

    // Draw warning triangle
    const centerX = size / 2;
    const centerY = size / 2;
    const triangleSize = size * 0.4;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY - triangleSize);
    ctx.lineTo(centerX - triangleSize * 0.9, centerY + triangleSize * 0.7);
    ctx.lineTo(centerX + triangleSize * 0.9, centerY + triangleSize * 0.7);
    ctx.closePath();

    // Yellow fill with red border
    ctx.fillStyle = 'rgba(255, 200, 0, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(200, 0, 0, 1)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw exclamation mark
    ctx.fillStyle = 'rgba(50, 0, 0, 1)';
    ctx.font = `bold ${size * 0.4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', centerX, centerY + 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  static createDangerSprite(baseRadius: number): THREE.Sprite {
    if (!this.warningTexture) {
      this.warningTexture = this.createWarningTexture();
    }

    const spriteMaterial = new THREE.SpriteMaterial({
      map: this.warningTexture,
      transparent: true,
      depthWrite: false,
      depthTest: false
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.setScalar(baseRadius * 0.8);
    sprite.position.set(0, baseRadius * 1.5, 0);
    sprite.visible = false;

    return sprite;
  }

  static updatePosition(sprite: THREE.Sprite, radius: number): void {
    sprite.scale.setScalar(Math.max(radius * 0.6, 3));
    sprite.position.set(0, radius * 1.3, 0);
  }
}
