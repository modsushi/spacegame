import * as THREE from 'three';

interface FloatingTextItem {
  element: HTMLElement;
  startTime: number;
  duration: number;
  startX: number;
  startY: number;
  worldPos: THREE.Vector3;
}

export class FloatingText {
  private container: HTMLElement;
  private activeTexts: FloatingTextItem[] = [];
  private camera: THREE.Camera;

  constructor(camera: THREE.Camera) {
    this.camera = camera;

    this.container = document.createElement('div');
    this.container.id = 'floating-text-container';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 250;
      overflow: hidden;
    `;
    document.body.appendChild(this.container);
  }

  show(
    worldX: number,
    worldY: number,
    worldZ: number,
    text: string,
    color: string = '#ffffff',
    duration: number = 1500
  ): void {
    const element = document.createElement('div');
    element.textContent = text;
    element.style.cssText = `
      position: absolute;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 18px;
      font-weight: bold;
      color: ${color};
      text-shadow: 0 0 10px ${color}, 0 2px 4px rgba(0,0,0,0.5);
      white-space: nowrap;
      transform: translate(-50%, -50%);
      opacity: 1;
      transition: none;
    `;

    this.container.appendChild(element);

    const worldPos = new THREE.Vector3(worldX, worldY, worldZ);
    const screenPos = this.worldToScreen(worldPos);

    element.style.left = `${screenPos.x}px`;
    element.style.top = `${screenPos.y}px`;

    this.activeTexts.push({
      element,
      startTime: performance.now(),
      duration,
      startX: screenPos.x,
      startY: screenPos.y,
      worldPos,
    });
  }

  showMassGain(worldX: number, worldY: number, worldZ: number, mass: number): void {
    const text = `+${Math.floor(mass)}`;
    const color = '#4ade80'; // Green
    this.show(worldX, worldY, worldZ, text, color, 1200);
  }

  showMassLoss(worldX: number, worldY: number, worldZ: number, mass: number): void {
    const text = `-${Math.floor(mass)}`;
    const color = '#f87171'; // Red
    this.show(worldX, worldY, worldZ, text, color, 1200);
  }

  private worldToScreen(worldPos: THREE.Vector3): { x: number; y: number } {
    const vector = worldPos.clone();
    vector.project(this.camera);

    return {
      x: (vector.x * 0.5 + 0.5) * window.innerWidth,
      y: (-vector.y * 0.5 + 0.5) * window.innerHeight,
    };
  }

  update(): void {
    const now = performance.now();
    const toRemove: FloatingTextItem[] = [];

    for (const item of this.activeTexts) {
      const elapsed = now - item.startTime;
      const progress = elapsed / item.duration;

      if (progress >= 1) {
        toRemove.push(item);
        continue;
      }

      // Update screen position based on world position
      const screenPos = this.worldToScreen(item.worldPos);

      // Float upward effect
      const floatOffset = progress * 40;

      item.element.style.left = `${screenPos.x}px`;
      item.element.style.top = `${screenPos.y - floatOffset}px`;

      // Scale up slightly then back down
      const scale = progress < 0.2 ? 1 + progress * 1.5 : 1.3 - (progress - 0.2) * 0.375;
      item.element.style.transform = `translate(-50%, -50%) scale(${scale})`;

      // Fade out in last 40%
      const opacity = progress > 0.6 ? 1 - (progress - 0.6) / 0.4 : 1;
      item.element.style.opacity = String(opacity);
    }

    // Remove finished texts
    for (const item of toRemove) {
      item.element.remove();
      const index = this.activeTexts.indexOf(item);
      if (index !== -1) {
        this.activeTexts.splice(index, 1);
      }
    }
  }

  dispose(): void {
    for (const item of this.activeTexts) {
      item.element.remove();
    }
    this.activeTexts = [];
    this.container.remove();
  }
}
