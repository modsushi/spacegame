import { EvolutionStageType } from '../config/GameConfig';
import { AudioManager } from '../audio/AudioManager';

export class HUD {
  private massElement: HTMLElement;
  private stageElement: HTMLElement;
  private notificationElement: HTMLElement;
  private notificationTimeout: number | null = null;
  private audioManager: AudioManager;
  private gameOverScreen: HTMLElement;
  private hasShownOrbitMessage: boolean = false;
  private onReplayCallback: (() => void) | null = null;

  constructor() {
    this.massElement = document.getElementById('mass-value')!;
    this.stageElement = document.getElementById('stage-value')!;
    this.notificationElement = document.getElementById('evolution-notification')!;

    this.audioManager = new AudioManager();
    this.audioManager.startBackgroundMusic();

    this.createMuteButton();
    this.gameOverScreen = this.createGameOverScreen();
  }

  private createMuteButton(): void {
    const button = document.createElement('div');
    button.id = 'mute-button';
    button.innerHTML = this.audioManager.getMuted() ? '🔇' : '🔊';
    button.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      cursor: pointer;
      font-size: 20px;
      z-index: 100;
      transition: background 0.2s, transform 0.1s;
      user-select: none;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(255, 255, 255, 0.2)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(255, 255, 255, 0.1)';
    });

    button.addEventListener('mousedown', () => {
      button.style.transform = 'scale(0.95)';
    });

    button.addEventListener('mouseup', () => {
      button.style.transform = 'scale(1)';
    });

    button.addEventListener('click', () => {
      const muted = this.audioManager.toggleMute();
      button.innerHTML = muted ? '🔇' : '🔊';
    });

    document.body.appendChild(button);
  }

  private createGameOverScreen(): HTMLElement {
    const screen = document.createElement('div');
    screen.id = 'game-over-screen';
    screen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 300;
      transition: background 1s ease;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      text-align: center;
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 1s ease 0.5s, transform 1s ease 0.5s;
    `;

    const message = document.createElement('div');
    message.id = 'game-over-message';
    message.style.cssText = `
      color: #fff;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 32px;
      font-weight: 300;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-bottom: 20px;
      text-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
    `;
    message.textContent = 'The universe reclaims your mass';

    const subMessage = document.createElement('div');
    subMessage.style.cssText = `
      color: rgba(255, 255, 255, 0.5);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
      letter-spacing: 2px;
      margin-bottom: 40px;
    `;
    subMessage.textContent = 'All matter returns to the cosmos';

    const replayButton = document.createElement('button');
    replayButton.id = 'replay-button';
    replayButton.textContent = 'REBIRTH';
    replayButton.style.cssText = `
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.4);
      color: rgba(255, 255, 255, 0.8);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
      letter-spacing: 3px;
      padding: 15px 50px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
    `;

    replayButton.addEventListener('mouseenter', () => {
      replayButton.style.background = 'rgba(255, 255, 255, 0.1)';
      replayButton.style.borderColor = 'rgba(255, 255, 255, 0.7)';
      replayButton.style.color = '#fff';
    });

    replayButton.addEventListener('mouseleave', () => {
      replayButton.style.background = 'transparent';
      replayButton.style.borderColor = 'rgba(255, 255, 255, 0.4)';
      replayButton.style.color = 'rgba(255, 255, 255, 0.8)';
    });

    replayButton.addEventListener('click', () => {
      if (this.onReplayCallback) {
        this.hideGameOver();
        this.onReplayCallback();
      }
    });

    content.appendChild(message);
    content.appendChild(subMessage);
    content.appendChild(replayButton);
    screen.appendChild(content);
    document.body.appendChild(screen);

    return screen;
  }

  update(mass: number, stage: EvolutionStageType): void {
    this.massElement.textContent = Math.floor(mass).toString();
    this.stageElement.textContent = this.formatStageName(stage);
  }

  private formatStageName(stage: EvolutionStageType): string {
    return stage
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  showEvolutionNotification(stage: EvolutionStageType): void {
    if (this.notificationTimeout !== null) {
      clearTimeout(this.notificationTimeout);
    }

    const stageName = this.formatStageName(stage);
    this.notificationElement.textContent = `Evolved to ${stageName}!`;
    this.notificationElement.style.color = this.getStageColor(stage);
    this.notificationElement.style.opacity = '1';
    this.notificationElement.style.transform = 'translate(-50%, -50%) scale(1.2)';

    setTimeout(() => {
      this.notificationElement.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 100);

    this.notificationTimeout = window.setTimeout(() => {
      this.notificationElement.style.opacity = '0';
      this.notificationTimeout = null;

      // Show orbit message after planet evolution notification fades
      if (stage === 'planet' && !this.hasShownOrbitMessage) {
        setTimeout(() => this.showOrbitMessage(), 500);
      }
    }, 2000);
  }

  private showOrbitMessage(): void {
    if (this.hasShownOrbitMessage) return;
    this.hasShownOrbitMessage = true;

    this.notificationElement.innerHTML = `
      <div style="font-size: 28px; margin-bottom: 10px;">Gravitational Influence</div>
      <div style="font-size: 16px; font-weight: 300; opacity: 0.7;">You can now capture smaller bodies into orbit</div>
    `;
    this.notificationElement.style.color = '#4169E1';
    this.notificationElement.style.opacity = '1';
    this.notificationElement.style.transform = 'translate(-50%, -50%) scale(1)';

    this.notificationTimeout = window.setTimeout(() => {
      this.notificationElement.style.opacity = '0';
      this.notificationTimeout = null;
    }, 3500);
  }

  showGameOver(): void {
    this.gameOverScreen.style.display = 'flex';

    // Trigger animations after display is set
    requestAnimationFrame(() => {
      this.gameOverScreen.style.background = 'rgba(0, 0, 0, 0.85)';
      const content = this.gameOverScreen.firstElementChild as HTMLElement;
      if (content) {
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
      }
    });
  }

  hideGameOver(): void {
    this.gameOverScreen.style.background = 'rgba(0, 0, 0, 0)';
    const content = this.gameOverScreen.firstElementChild as HTMLElement;
    if (content) {
      content.style.opacity = '0';
      content.style.transform = 'translateY(20px)';
    }

    setTimeout(() => {
      this.gameOverScreen.style.display = 'none';
    }, 500);
  }

  setOnReplay(callback: () => void): void {
    this.onReplayCallback = callback;
  }

  reset(): void {
    this.hasShownOrbitMessage = false;
    this.hideGameOver();
    if (this.notificationTimeout !== null) {
      clearTimeout(this.notificationTimeout);
      this.notificationTimeout = null;
    }
    this.notificationElement.style.opacity = '0';
  }

  private getStageColor(stage: EvolutionStageType): string {
    const colors: Record<EvolutionStageType, string> = {
      meteorite: '#888888',
      asteroid: '#654321',
      dwarf_planet: '#8B7355',
      planet: '#4169E1',
      gas_giant: '#FFD700',
      star: '#FFFF00',
      blue_star: '#00BFFF',
      neutron_star: '#FF00FF',
      black_hole: '#FFFFFF',
      wormhole: '#9400D3'
    };
    return colors[stage];
  }
}
