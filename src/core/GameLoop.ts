export type UpdateCallback = (deltaTime: number) => void;
export type RenderCallback = () => void;

export class GameLoop {
  private lastTime = 0;
  private isRunning = false;
  private animationFrameId: number | null = null;
  private updateCallback: UpdateCallback | null = null;
  private renderCallback: RenderCallback | null = null;

  private readonly fixedTimeStep = 1 / 60;
  private accumulator = 0;

  start(update: UpdateCallback, render: RenderCallback): void {
    this.updateCallback = update;
    this.renderCallback = render;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.accumulator += deltaTime;

    while (this.accumulator >= this.fixedTimeStep) {
      this.updateCallback?.(this.fixedTimeStep);
      this.accumulator -= this.fixedTimeStep;
    }

    this.renderCallback?.();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}
