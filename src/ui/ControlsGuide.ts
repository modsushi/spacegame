export class ControlsGuide {
  private element: HTMLElement;
  private keyElements: Map<string, HTMLElement> = new Map();
  private keystrokeCount = 0;
  private readonly fadeAfterKeystrokes = 5;
  private isHidden = false;

  constructor() {
    this.element = document.getElementById('controls-guide')!;

    // Cache key elements
    const keys = this.element.querySelectorAll('.key[data-key]');
    keys.forEach((key) => {
      const keyName = key.getAttribute('data-key');
      if (keyName) {
        this.keyElements.set(keyName, key as HTMLElement);
      }
    });

    // Listen for key events
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (this.isHidden) return;

    const key = event.key.toLowerCase();
    const keyElement = this.keyElements.get(key);

    if (keyElement) {
      keyElement.style.background = 'rgba(255, 255, 255, 0.3)';
      keyElement.style.borderColor = 'rgba(255, 255, 255, 0.6)';
      keyElement.style.color = 'rgba(255, 255, 255, 1)';
    }

    // Also handle arrow keys by highlighting corresponding WASD
    const arrowMap: Record<string, string> = {
      arrowup: 'w',
      arrowdown: 's',
      arrowleft: 'a',
      arrowright: 'd',
    };

    const mappedKey = arrowMap[key];
    if (mappedKey) {
      const mappedElement = this.keyElements.get(mappedKey);
      if (mappedElement) {
        mappedElement.style.background = 'rgba(255, 255, 255, 0.3)';
        mappedElement.style.borderColor = 'rgba(255, 255, 255, 0.6)';
        mappedElement.style.color = 'rgba(255, 255, 255, 1)';
      }
    }

    // Count keystrokes for movement keys
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      this.keystrokeCount++;

      if (this.keystrokeCount >= this.fadeAfterKeystrokes) {
        this.hide();
      }
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    if (this.isHidden) return;

    const key = event.key.toLowerCase();
    const keyElement = this.keyElements.get(key);

    if (keyElement) {
      keyElement.style.background = 'rgba(255, 255, 255, 0.1)';
      keyElement.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      keyElement.style.color = 'rgba(255, 255, 255, 0.7)';
    }

    // Handle arrow keys
    const arrowMap: Record<string, string> = {
      arrowup: 'w',
      arrowdown: 's',
      arrowleft: 'a',
      arrowright: 'd',
    };

    const mappedKey = arrowMap[key];
    if (mappedKey) {
      const mappedElement = this.keyElements.get(mappedKey);
      if (mappedElement) {
        mappedElement.style.background = 'rgba(255, 255, 255, 0.1)';
        mappedElement.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        mappedElement.style.color = 'rgba(255, 255, 255, 0.7)';
      }
    }
  }

  private hide(): void {
    if (this.isHidden) return;
    this.isHidden = true;
    this.element.classList.add('hidden');

    // Remove from DOM after fade
    setTimeout(() => {
      this.element.remove();
    }, 1000);
  }
}
