import { EvolutionStageType } from '../config/GameConfig';

export class HUD {
  private massElement: HTMLElement;
  private stageElement: HTMLElement;
  private notificationElement: HTMLElement;
  private notificationTimeout: number | null = null;

  constructor() {
    this.massElement = document.getElementById('mass-value')!;
    this.stageElement = document.getElementById('stage-value')!;
    this.notificationElement = document.getElementById('evolution-notification')!;
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
    }, 2000);
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
