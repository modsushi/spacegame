import * as THREE from 'three';
import { GameConfig } from '../config/GameConfig';
import { PostProcessing } from '../rendering/PostProcessing';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private postProcessing: PostProcessing;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000008);

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      GameConfig.WORLD_SIZE * 2
    );
    this.camera.position.z = GameConfig.CAMERA_DISTANCE;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(this.renderer.domElement);

    this.postProcessing = new PostProcessing(this.renderer, this.scene, this.camera);

    this.setupLighting();
    this.createStarfield();
    this.setupResizeHandler();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    const hemisphereLight = new THREE.HemisphereLight(0x6688cc, 0x222244, 0.3);
    this.scene.add(hemisphereLight);
  }

  private createStarfield(): void {
    const starCount = GameConfig.STARFIELD_COUNT;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const starColors = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xaaccff),
      new THREE.Color(0xffffcc),
      new THREE.Color(0xffccaa)
    ];

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = GameConfig.WORLD_SIZE * 0.8 + Math.random() * GameConfig.WORLD_SIZE * 0.2;

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      const color = starColors[Math.floor(Math.random() * starColors.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: false
    });

    const starfield = new THREE.Points(geometry, material);
    this.scene.add(starfield);
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.postProcessing.resize(window.innerWidth, window.innerHeight);
    });
  }

  render(): void {
    this.postProcessing.render();
  }
}
