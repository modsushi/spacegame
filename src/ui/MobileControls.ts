export interface JoystickState {
  active: boolean;
  x: number; // -1 to 1
  y: number; // -1 to 1
}

export class MobileControls {
  private container: HTMLElement;
  private joystickBase: HTMLElement;
  private joystickThumb: HTMLElement;
  private hint: HTMLElement | null = null;
  private state: JoystickState = { active: false, x: 0, y: 0 };
  private isMobile: boolean;
  private touchId: number | null = null;
  private baseX: number = 0;
  private baseY: number = 0;
  private maxDistance: number = 50;
  private hasInteracted: boolean = false;

  constructor() {
    this.isMobile = this.detectMobile();

    this.container = this.createContainer();
    this.joystickBase = this.createJoystickBase();
    this.joystickThumb = this.createJoystickThumb();

    this.joystickBase.appendChild(this.joystickThumb);
    this.container.appendChild(this.joystickBase);
    document.body.appendChild(this.container);

    if (this.isMobile) {
      this.show();
      this.setupTouchListeners();
      this.showHint();
    } else {
      this.hide();
    }
  }

  private showHint(): void {
    this.hint = document.createElement('div');
    this.hint.id = 'mobile-hint';
    this.hint.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
        <div style="width: 60px; height: 60px; border: 2px solid rgba(255,255,255,0.4); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <div style="width: 24px; height: 24px; background: rgba(255,255,255,0.6); border-radius: 50%;"></div>
        </div>
        <div style="font-size: 14px; letter-spacing: 2px;">TOUCH TO MOVE</div>
      </div>
    `;
    this.hint.style.cssText = `
      position: fixed;
      bottom: 15%;
      left: 25%;
      transform: translateX(-50%);
      color: rgba(255, 255, 255, 0.6);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      text-align: center;
      z-index: 140;
      pointer-events: none;
      animation: pulse 2s ease-in-out infinite;
    `;

    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
        50% { opacity: 1; transform: translateX(-50%) scale(1.05); }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(this.hint);
  }

  private hideHint(): void {
    if (this.hint && !this.hasInteracted) {
      this.hasInteracted = true;
      this.hint.style.transition = 'opacity 0.5s ease';
      this.hint.style.opacity = '0';
      setTimeout(() => {
        this.hint?.remove();
        this.hint = null;
      }, 500);
    }
  }

  private detectMobile(): boolean {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'mobile-controls';
    container.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      width: 50%;
      height: 40%;
      z-index: 150;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
    `;
    return container;
  }

  private createJoystickBase(): HTMLElement {
    const base = document.createElement('div');
    base.id = 'joystick-base';
    base.style.cssText = `
      position: absolute;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 70%, rgba(255,255,255,0.02) 100%);
      border: 2px solid rgba(255, 255, 255, 0.2);
      display: none;
      justify-content: center;
      align-items: center;
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    `;
    return base;
  }

  private createJoystickThumb(): HTMLElement {
    const thumb = document.createElement('div');
    thumb.id = 'joystick-thumb';
    thumb.style.cssText = `
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%);
      border: 2px solid rgba(255, 255, 255, 0.5);
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
      transition: box-shadow 0.1s ease;
    `;
    return thumb;
  }

  private setupTouchListeners(): void {
    this.container.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.container.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.container.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
    this.container.addEventListener('touchcancel', this.onTouchEnd.bind(this), { passive: false });
  }

  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();

    // Hide hint on first interaction
    this.hideHint();

    if (this.touchId !== null) return;

    const touch = e.changedTouches[0];
    this.touchId = touch.identifier;

    // Position joystick at touch location
    this.baseX = touch.clientX;
    this.baseY = touch.clientY;

    this.joystickBase.style.display = 'flex';
    this.joystickBase.style.left = `${this.baseX - 60}px`;
    this.joystickBase.style.top = `${this.baseY - 60}px`;

    // Reset thumb to center
    this.joystickThumb.style.left = '50%';
    this.joystickThumb.style.top = '50%';
    this.joystickThumb.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.5)';

    this.state.active = true;
    this.state.x = 0;
    this.state.y = 0;
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();

    if (this.touchId === null) return;

    // Find our tracked touch
    let touch: Touch | null = null;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.touchId) {
        touch = e.changedTouches[i];
        break;
      }
    }

    if (!touch) return;

    // Calculate offset from base center
    const dx = touch.clientX - this.baseX;
    const dy = touch.clientY - this.baseY;

    // Calculate distance and clamp to max
    const distance = Math.sqrt(dx * dx + dy * dy);
    const clampedDistance = Math.min(distance, this.maxDistance);

    // Normalize direction
    let normalizedX = 0;
    let normalizedY = 0;

    if (distance > 0) {
      normalizedX = dx / distance;
      normalizedY = dy / distance;
    }

    // Calculate thumb position (clamped)
    const thumbX = normalizedX * clampedDistance;
    const thumbY = normalizedY * clampedDistance;

    // Update thumb visual position
    this.joystickThumb.style.left = `calc(50% + ${thumbX}px)`;
    this.joystickThumb.style.top = `calc(50% + ${thumbY}px)`;

    // Update state (normalize to -1 to 1 range)
    // Note: y is inverted because screen Y increases downward
    this.state.x = clampedDistance > 5 ? normalizedX * (clampedDistance / this.maxDistance) : 0;
    this.state.y = clampedDistance > 5 ? -normalizedY * (clampedDistance / this.maxDistance) : 0;
  }

  private onTouchEnd(e: TouchEvent): void {
    e.preventDefault();

    // Check if our tracked touch ended
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.touchId) {
        this.touchId = null;
        this.state.active = false;
        this.state.x = 0;
        this.state.y = 0;

        // Hide joystick
        this.joystickBase.style.display = 'none';

        // Reset thumb
        this.joystickThumb.style.left = '50%';
        this.joystickThumb.style.top = '50%';
        this.joystickThumb.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.3)';
        break;
      }
    }
  }

  getState(): JoystickState {
    return { ...this.state };
  }

  getDirection(): { x: number; y: number } {
    return { x: this.state.x, y: this.state.y };
  }

  isMobileDevice(): boolean {
    return this.isMobile;
  }

  show(): void {
    this.container.style.display = 'block';
  }

  hide(): void {
    this.container.style.display = 'none';
    this.joystickBase.style.display = 'none';
    this.state.active = false;
    this.state.x = 0;
    this.state.y = 0;
    this.touchId = null;
  }

  destroy(): void {
    this.container.remove();
    this.hint?.remove();
  }

  reset(): void {
    this.hasInteracted = false;
    if (this.isMobile && !this.hint) {
      this.showHint();
    }
  }
}
