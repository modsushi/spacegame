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
  private maxDistance: number = 40;
  private baseSize: number = 120;
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
      bottom: 30px;
      left: 30px;
      width: ${this.baseSize}px;
      height: ${this.baseSize}px;
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
      width: ${this.baseSize}px;
      height: ${this.baseSize}px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 60%, rgba(255,255,255,0.02) 100%);
      border: 2px solid rgba(255, 255, 255, 0.15);
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 0 30px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.05);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
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
      background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 100%);
      border: 2px solid rgba(255, 255, 255, 0.4);
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 15px rgba(255, 255, 255, 0.2), inset 0 0 10px rgba(255, 255, 255, 0.1);
      transition: box-shadow 0.15s ease, border-color 0.15s ease;
    `;
    return thumb;
  }

  private showHint(): void {
    this.hint = document.createElement('div');
    this.hint.id = 'mobile-hint';
    this.hint.textContent = 'DRAG TO MOVE';
    this.hint.style.cssText = `
      position: fixed;
      bottom: ${30 + this.baseSize + 15}px;
      left: 30px;
      width: ${this.baseSize}px;
      color: rgba(255, 255, 255, 0.5);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11px;
      letter-spacing: 2px;
      text-align: center;
      z-index: 140;
      pointer-events: none;
      animation: fadeInOut 2s ease-in-out infinite;
    `;

    // Add animation
    const style = document.createElement('style');
    style.id = 'mobile-hint-style';
    style.textContent = `
      @keyframes fadeInOut {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 0.8; }
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
        document.getElementById('mobile-hint-style')?.remove();
      }, 500);
    }
  }

  private setupTouchListeners(): void {
    // Listen on the whole document for more forgiving touch area
    document.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
    document.addEventListener('touchcancel', this.onTouchEnd.bind(this), { passive: false });
  }

  private getJoystickCenter(): { x: number; y: number } {
    const rect = this.joystickBase.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }

  private onTouchStart(e: TouchEvent): void {
    // Hide hint on first interaction
    this.hideHint();

    if (this.touchId !== null) return;

    const touch = e.changedTouches[0];
    const center = this.getJoystickCenter();

    // Check if touch is within expanded joystick area (more forgiving)
    const dx = touch.clientX - center.x;
    const dy = touch.clientY - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Allow touch within 100px of joystick center
    if (distance > 100) return;

    e.preventDefault();
    this.touchId = touch.identifier;

    // Activate visual state
    this.joystickBase.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    this.joystickBase.style.boxShadow = '0 0 30px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)';
    this.joystickThumb.style.borderColor = 'rgba(255, 255, 255, 0.6)';
    this.joystickThumb.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.2)';

    this.state.active = true;
    this.updateThumbPosition(touch.clientX, touch.clientY);
  }

  private onTouchMove(e: TouchEvent): void {
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
    e.preventDefault();

    this.updateThumbPosition(touch.clientX, touch.clientY);
  }

  private updateThumbPosition(touchX: number, touchY: number): void {
    const center = this.getJoystickCenter();

    // Calculate offset from center
    const dx = touchX - center.x;
    const dy = touchY - center.y;

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
    // Use a small deadzone (5px) to prevent drift
    const deadzone = 5;
    if (clampedDistance > deadzone) {
      const magnitude = (clampedDistance - deadzone) / (this.maxDistance - deadzone);
      this.state.x = normalizedX * magnitude;
      this.state.y = -normalizedY * magnitude; // Invert Y for game coordinates
    } else {
      this.state.x = 0;
      this.state.y = 0;
    }
  }

  private onTouchEnd(e: TouchEvent): void {
    // Check if our tracked touch ended
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.touchId) {
        e.preventDefault();
        this.touchId = null;
        this.state.active = false;
        this.state.x = 0;
        this.state.y = 0;

        // Reset visual state
        this.joystickBase.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        this.joystickBase.style.boxShadow = '0 0 30px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.05)';
        this.joystickThumb.style.borderColor = 'rgba(255, 255, 255, 0.4)';
        this.joystickThumb.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.2), inset 0 0 10px rgba(255, 255, 255, 0.1)';

        // Animate thumb back to center
        this.joystickThumb.style.transition = 'left 0.15s ease-out, top 0.15s ease-out';
        this.joystickThumb.style.left = '50%';
        this.joystickThumb.style.top = '50%';

        // Remove transition after animation
        setTimeout(() => {
          this.joystickThumb.style.transition = '';
        }, 150);
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
    this.state.active = false;
    this.state.x = 0;
    this.state.y = 0;
    this.touchId = null;
  }

  destroy(): void {
    this.container.remove();
    this.hint?.remove();
    document.getElementById('mobile-hint-style')?.remove();
  }

  reset(): void {
    this.hasInteracted = false;
    if (this.isMobile && !this.hint) {
      this.showHint();
    }
    // Reset thumb to center
    this.joystickThumb.style.left = '50%';
    this.joystickThumb.style.top = '50%';
    this.state.x = 0;
    this.state.y = 0;
  }
}
