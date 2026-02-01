export class AudioManager {
  private bgMusic: HTMLAudioElement;
  private isMuted: boolean = false;
  private musicVolume: number = 0.3;

  constructor() {
    this.bgMusic = new Audio('/space-bg.mp3');
    this.bgMusic.loop = true;
    this.bgMusic.volume = this.musicVolume;

    // Try to restore mute state from localStorage
    const savedMute = localStorage.getItem('spacegame-muted');
    if (savedMute === 'true') {
      this.isMuted = true;
      this.bgMusic.volume = 0;
    }
  }

  startBackgroundMusic(): void {
    // Browsers require user interaction before playing audio
    const startMusic = () => {
      if (!this.isMuted) {
        this.bgMusic.play().catch(() => {
          // Autoplay blocked, will try again on next interaction
        });
      }
      document.removeEventListener('click', startMusic);
      document.removeEventListener('keydown', startMusic);
    };

    // Try to play immediately
    this.bgMusic.play().catch(() => {
      // If blocked, wait for user interaction
      document.addEventListener('click', startMusic, { once: true });
      document.addEventListener('keydown', startMusic, { once: true });
    });
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.bgMusic.volume = this.isMuted ? 0 : this.musicVolume;
    localStorage.setItem('spacegame-muted', String(this.isMuted));
    return this.isMuted;
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  stopMusic(): void {
    this.bgMusic.pause();
    this.bgMusic.currentTime = 0;
  }

  setVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (!this.isMuted) {
      this.bgMusic.volume = this.musicVolume;
    }
  }
}
