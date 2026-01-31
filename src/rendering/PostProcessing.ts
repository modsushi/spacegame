import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { createVignettePass } from './shaders/VignetteShader';
import { createChromaticAberrationPass, setChromaticAberrationAmount } from './shaders/ChromaticAberrationShader';

export class PostProcessing {
  public composer: EffectComposer;
  private chromaticAberrationPass: ShaderPass;
  private baseChromaticAmount = 0.002;
  private blackHoleProximity = 0;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    this.composer = new EffectComposer(renderer);

    // 1. Render pass
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    // 2. Bloom pass - increased strength and lower threshold for better star/glow effects
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.7,   // strength (increased from 0.5)
      0.3,   // radius
      0.5    // threshold (lowered from 0.6)
    );
    this.composer.addPass(bloomPass);

    // 3. Chromatic aberration - subtle base effect, intensifies near black holes
    this.chromaticAberrationPass = createChromaticAberrationPass(this.baseChromaticAmount);
    this.composer.addPass(this.chromaticAberrationPass);

    // 4. Vignette - subtle edge darkening for cinematic effect
    const vignettePass = createVignettePass(1.0, 0.4);
    this.composer.addPass(vignettePass);
  }

  render(): void {
    this.composer.render();
  }

  resize(width: number, height: number): void {
    this.composer.setSize(width, height);
  }

  /**
   * Set black hole proximity to intensify chromatic aberration
   * @param distance - Distance to nearest black hole (0 = touching, Infinity = far away)
   * @param maxRange - Maximum range at which black hole affects visuals
   */
  setBlackHoleProximity(distance: number, maxRange: number = 200): void {
    // Calculate proximity factor (0 = far, 1 = very close)
    const proximity = Math.max(0, 1 - distance / maxRange);
    this.blackHoleProximity = proximity;

    // Chromatic aberration increases dramatically near black holes
    // Base: 0.002, Max near black hole: 0.02
    const chromaticAmount = this.baseChromaticAmount + proximity * proximity * 0.018;
    setChromaticAberrationAmount(this.chromaticAberrationPass, chromaticAmount);
  }

  getBlackHoleProximity(): number {
    return this.blackHoleProximity;
  }
}
