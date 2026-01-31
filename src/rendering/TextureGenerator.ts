import * as THREE from 'three';

// Simple 2D noise implementation for procedural textures
class SimplexNoise {
  private perm: number[] = [];

  constructor(seed: number = Math.random() * 10000) {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }

    // Shuffle based on seed
    let n = seed;
    for (let i = 255; i > 0; i--) {
      n = (n * 16807) % 2147483647;
      const j = n % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }

    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
    }
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v);
  }

  noise2D(x: number, y: number): number {
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;

    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);

    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = x - X0;
    const y0 = y - Y0;

    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;

    const ii = i & 255;
    const jj = j & 255;

    let n0 = 0, n1 = 0, n2 = 0;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      t0 *= t0;
      n0 = t0 * t0 * this.grad(this.perm[ii + this.perm[jj]], x0, y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      t1 *= t1;
      n1 = t1 * t1 * this.grad(this.perm[ii + i1 + this.perm[jj + j1]], x1, y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      t2 *= t2;
      n2 = t2 * t2 * this.grad(this.perm[ii + 1 + this.perm[jj + 1]], x2, y2);
    }

    return 70 * (n0 + n1 + n2);
  }

  // Fractal Brownian Motion for more detail
  fbm(x: number, y: number, octaves: number = 4): number {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise2D(x * frequency, y * frequency);
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return value / maxValue;
  }
}

// Texture cache to avoid regeneration
const textureCache = new Map<string, THREE.CanvasTexture>();
const normalMapCache = new Map<string, THREE.CanvasTexture>();

export type TextureType =
  | 'rocky'
  | 'planet_earth'
  | 'planet_desert'
  | 'planet_ice'
  | 'gas_giant'
  | 'star';

export class TextureGenerator {
  private static readonly DEFAULT_SIZE = 128;  // Reduced for performance
  private static readonly PLAYER_SIZE = 256;

  static generateTexture(
    type: TextureType,
    seed: number = Math.random() * 10000,
    isPlayer: boolean = false
  ): THREE.CanvasTexture {
    const cacheKey = `${type}_${Math.floor(seed)}_${isPlayer}`;

    if (textureCache.has(cacheKey)) {
      return textureCache.get(cacheKey)!;
    }

    const size = isPlayer ? this.PLAYER_SIZE : this.DEFAULT_SIZE;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const noise = new SimplexNoise(seed);

    switch (type) {
      case 'rocky':
        this.generateRockyTexture(ctx, size, noise);
        break;
      case 'planet_earth':
        this.generateEarthTexture(ctx, size, noise);
        break;
      case 'planet_desert':
        this.generateDesertTexture(ctx, size, noise);
        break;
      case 'planet_ice':
        this.generateIceTexture(ctx, size, noise);
        break;
      case 'gas_giant':
        this.generateGasGiantTexture(ctx, size, noise);
        break;
      case 'star':
        this.generateStarTexture(ctx, size, noise);
        break;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    textureCache.set(cacheKey, texture);

    return texture;
  }

  static generateNormalMap(
    type: TextureType,
    seed: number = Math.random() * 10000,
    isPlayer: boolean = false
  ): THREE.CanvasTexture {
    const cacheKey = `normal_${type}_${Math.floor(seed)}_${isPlayer}`;

    if (normalMapCache.has(cacheKey)) {
      return normalMapCache.get(cacheKey)!;
    }

    const size = isPlayer ? this.PLAYER_SIZE : this.DEFAULT_SIZE;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const noise = new SimplexNoise(seed);
    const heightData = new Float32Array(size * size);

    // Generate heightmap
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = x / size * 4;
        const ny = y / size * 4;
        heightData[y * size + x] = noise.fbm(nx, ny, 3) * 0.5 + 0.5;
      }
    }

    // Convert heightmap to normal map
    const imageData = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;

        const left = heightData[y * size + ((x - 1 + size) % size)];
        const right = heightData[y * size + ((x + 1) % size)];
        const up = heightData[((y - 1 + size) % size) * size + x];
        const down = heightData[((y + 1) % size) * size + x];

        const dx = (left - right) * 2;
        const dy = (up - down) * 2;
        const dz = 1;

        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

        imageData.data[idx] = ((dx / len) * 0.5 + 0.5) * 255;
        imageData.data[idx + 1] = ((dy / len) * 0.5 + 0.5) * 255;
        imageData.data[idx + 2] = ((dz / len) * 0.5 + 0.5) * 255;
        imageData.data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    normalMapCache.set(cacheKey, texture);

    return texture;
  }

  private static generateRockyTexture(
    ctx: CanvasRenderingContext2D,
    size: number,
    noise: SimplexNoise
  ): void {
    const imageData = ctx.createImageData(size, size);

    // Pre-compute crater positions (outside pixel loop!)
    const craterSeed = Math.floor(noise.noise2D(0.1, 0.1) * 1000);
    const craterNoise = new SimplexNoise(craterSeed);
    const craters: Array<{ cx: number; cy: number; cr: number }> = [];
    for (let i = 0; i < 8; i++) {
      craters.push({
        cx: craterNoise.noise2D(i * 7.3, 0) * 0.5 + 0.5,
        cy: craterNoise.noise2D(0, i * 5.7) * 0.5 + 0.5,
        cr: 0.05 + craterNoise.noise2D(i, i) * 0.1,
      });
    }

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;

        // Base noise layers
        const nx = x / size;
        const ny = y / size;

        const large = noise.fbm(nx * 3, ny * 3, 2) * 0.5 + 0.5;
        const medium = noise.fbm(nx * 8, ny * 8, 2) * 0.5 + 0.5;
        const small = noise.noise2D(nx * 20, ny * 20) * 0.5 + 0.5;

        // Craters
        let craterDarkness = 0;
        for (const crater of craters) {
          const dx = nx - crater.cx;
          const dy = ny - crater.cy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < crater.cr) {
            const rim = Math.abs(dist - crater.cr * 0.8) < 0.02;
            if (rim) {
              craterDarkness = Math.max(craterDarkness, -0.2);
            } else if (dist < crater.cr * 0.8) {
              craterDarkness = Math.max(craterDarkness, 0.3 * (1 - dist / (crater.cr * 0.8)));
            }
          }
        }

        // Combine layers
        let value = large * 0.5 + medium * 0.3 + small * 0.2;
        value = value * 0.6 + 0.2; // Adjust range
        value -= craterDarkness;
        value = Math.max(0, Math.min(1, value));

        // Gray/brown rocky color - brighter base for visibility
        const baseR = 200;
        const baseG = 190;
        const baseB = 180;

        imageData.data[idx] = Math.floor(baseR * value);
        imageData.data[idx + 1] = Math.floor(baseG * value);
        imageData.data[idx + 2] = Math.floor(baseB * value);
        imageData.data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  private static generateEarthTexture(
    ctx: CanvasRenderingContext2D,
    size: number,
    noise: SimplexNoise
  ): void {
    const imageData = ctx.createImageData(size, size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const nx = x / size;
        const ny = y / size;

        // Continent noise
        const continent = noise.fbm(nx * 3, ny * 3, 2);
        const detail = noise.fbm(nx * 10, ny * 10, 2) * 0.3;
        const land = continent + detail;

        // Latitude for ice caps
        const lat = Math.abs(ny - 0.5) * 2;
        const iceCap = lat > 0.85;

        let r, g, b;

        if (iceCap) {
          // Ice caps
          r = 240;
          g = 250;
          b = 255;
        } else if (land > 0.1) {
          // Land
          const height = (land - 0.1) / 0.9;
          if (height > 0.7) {
            // Mountains
            r = 140 + height * 50;
            g = 130 + height * 50;
            b = 120 + height * 50;
          } else if (lat > 0.6) {
            // Tundra
            r = 150;
            g = 170;
            b = 140;
          } else {
            // Forest/grass
            r = 60 + height * 40;
            g = 120 + height * 30;
            b = 50 + height * 20;
          }
        } else {
          // Ocean
          const depth = (0.1 - land) / 0.6;
          r = 30 - depth * 20;
          g = 80 - depth * 30;
          b = 160 - depth * 40;
        }

        // Add some variation
        const variation = noise.noise2D(nx * 30, ny * 30) * 10;

        imageData.data[idx] = Math.max(0, Math.min(255, r + variation));
        imageData.data[idx + 1] = Math.max(0, Math.min(255, g + variation));
        imageData.data[idx + 2] = Math.max(0, Math.min(255, b + variation));
        imageData.data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  private static generateDesertTexture(
    ctx: CanvasRenderingContext2D,
    size: number,
    noise: SimplexNoise
  ): void {
    const imageData = ctx.createImageData(size, size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const nx = x / size;
        const ny = y / size;

        const base = noise.fbm(nx * 4, ny * 4, 2) * 0.5 + 0.5;
        const detail = noise.noise2D(nx * 15, ny * 15) * 0.2;
        const value = base + detail;

        // Desert/Mars-like colors
        const baseR = 180;
        const baseG = 120;
        const baseB = 80;

        const variation = noise.noise2D(nx * 20, ny * 20) * 20;

        imageData.data[idx] = Math.max(0, Math.min(255, baseR * value + variation));
        imageData.data[idx + 1] = Math.max(0, Math.min(255, baseG * value + variation * 0.5));
        imageData.data[idx + 2] = Math.max(0, Math.min(255, baseB * value));
        imageData.data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  private static generateIceTexture(
    ctx: CanvasRenderingContext2D,
    size: number,
    noise: SimplexNoise
  ): void {
    const imageData = ctx.createImageData(size, size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const nx = x / size;
        const ny = y / size;

        const base = noise.fbm(nx * 5, ny * 5, 2) * 0.5 + 0.5;
        const cracks = Math.abs(noise.noise2D(nx * 20, ny * 20));
        const detail = noise.noise2D(nx * 12, ny * 12) * 0.15;

        const value = base * 0.7 + cracks * 0.2 + detail + 0.3;

        // Ice blue-white colors
        imageData.data[idx] = Math.min(255, 180 + value * 75);
        imageData.data[idx + 1] = Math.min(255, 200 + value * 55);
        imageData.data[idx + 2] = Math.min(255, 220 + value * 35);
        imageData.data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  private static generateGasGiantTexture(
    ctx: CanvasRenderingContext2D,
    size: number,
    noise: SimplexNoise
  ): void {
    const imageData = ctx.createImageData(size, size);

    // Color bands for gas giant
    const bandColors = [
      { r: 220, g: 180, b: 120 }, // Tan
      { r: 200, g: 140, b: 100 }, // Orange-brown
      { r: 180, g: 160, b: 140 }, // Light brown
      { r: 240, g: 200, b: 160 }, // Cream
      { r: 160, g: 120, b: 100 }, // Dark brown
    ];

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const nx = x / size;
        const ny = y / size;

        // Horizontal bands with turbulence
        const turbulence = noise.fbm(nx * 8, ny * 2, 2) * 0.1;
        const bandPos = (ny + turbulence) * bandColors.length * 2;
        const bandIndex = Math.floor(Math.abs(bandPos)) % bandColors.length;
        const nextBandIndex = (bandIndex + 1) % bandColors.length;
        const blend = (Math.abs(bandPos) % 1);

        const color1 = bandColors[bandIndex];
        const color2 = bandColors[nextBandIndex];

        // Storm spots
        const stormNoise = noise.noise2D(nx * 6, ny * 6);
        const storm = stormNoise > 0.7 ? (stormNoise - 0.7) * 3 : 0;

        // Blend bands with smooth transition
        const smoothBlend = blend * blend * (3 - 2 * blend);
        let r = color1.r * (1 - smoothBlend) + color2.r * smoothBlend;
        let g = color1.g * (1 - smoothBlend) + color2.g * smoothBlend;
        let b = color1.b * (1 - smoothBlend) + color2.b * smoothBlend;

        // Add storm coloring (Great Red Spot style)
        if (storm > 0) {
          r = r * (1 - storm) + 180 * storm;
          g = g * (1 - storm) + 80 * storm;
          b = b * (1 - storm) + 60 * storm;
        }

        // Fine detail
        const detail = noise.noise2D(nx * 30, ny * 30) * 15;

        imageData.data[idx] = Math.max(0, Math.min(255, r + detail));
        imageData.data[idx + 1] = Math.max(0, Math.min(255, g + detail));
        imageData.data[idx + 2] = Math.max(0, Math.min(255, b + detail));
        imageData.data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  private static generateStarTexture(
    ctx: CanvasRenderingContext2D,
    size: number,
    noise: SimplexNoise
  ): void {
    const imageData = ctx.createImageData(size, size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const nx = x / size;
        const ny = y / size;

        // Plasma cell pattern
        const cells = noise.fbm(nx * 6, ny * 6, 2);
        const detail = noise.noise2D(nx * 15, ny * 15) * 0.3;

        // Bright spots (solar flares)
        const spots = noise.noise2D(nx * 4, ny * 4);
        const brightSpot = spots > 0.6 ? (spots - 0.6) * 2.5 : 0;

        const value = (cells * 0.5 + 0.5) + detail + brightSpot;
        const intensity = Math.min(1, Math.max(0.5, value));

        // Yellow-white star color
        imageData.data[idx] = Math.min(255, 255 * intensity);
        imageData.data[idx + 1] = Math.min(255, 220 * intensity);
        imageData.data[idx + 2] = Math.min(255, 150 * intensity);
        imageData.data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  // Clear cache if needed (e.g., memory management)
  static clearCache(): void {
    textureCache.forEach(texture => texture.dispose());
    normalMapCache.forEach(texture => texture.dispose());
    textureCache.clear();
    normalMapCache.clear();
  }
}
