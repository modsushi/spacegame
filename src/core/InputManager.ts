import { MobileControls } from '../ui/MobileControls';

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export class InputManager {
  private state: InputState = {
    up: false,
    down: false,
    left: false,
    right: false
  };

  private mobileControls: MobileControls;

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    this.mobileControls = new MobileControls();
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.updateKey(e.code, true);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.updateKey(e.code, false);
  };

  private updateKey(code: string, pressed: boolean): void {
    switch (code) {
      case 'KeyW':
      case 'ArrowUp':
        this.state.up = pressed;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.state.down = pressed;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.state.left = pressed;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.state.right = pressed;
        break;
    }
  }

  getState(): InputState {
    return { ...this.state };
  }

  getDirection(): { x: number; y: number } {
    // Check mobile controls first (analog input)
    const mobileDir = this.mobileControls.getDirection();
    if (mobileDir.x !== 0 || mobileDir.y !== 0) {
      return mobileDir;
    }

    // Fall back to keyboard (digital input)
    let x = 0;
    let y = 0;

    if (this.state.left) x -= 1;
    if (this.state.right) x += 1;
    if (this.state.up) y += 1;
    if (this.state.down) y -= 1;

    const length = Math.sqrt(x * x + y * y);
    if (length > 0) {
      x /= length;
      y /= length;
    }

    return { x, y };
  }

  isMobile(): boolean {
    return this.mobileControls.isMobileDevice();
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.mobileControls.destroy();
  }
}
