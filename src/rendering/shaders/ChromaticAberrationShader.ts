import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

export const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 0.003 },
    angle: { value: 0.0 },
  },

  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    uniform float angle;

    varying vec2 vUv;

    void main() {
      vec2 offset = amount * vec2(cos(angle), sin(angle));

      // Chromatic aberration: offset R and B channels
      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;

      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
};

// Radial chromatic aberration (more realistic, stronger at edges)
export const RadialChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 0.002 },
    centerX: { value: 0.5 },
    centerY: { value: 0.5 },
  },

  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    uniform float centerX;
    uniform float centerY;

    varying vec2 vUv;

    void main() {
      vec2 center = vec2(centerX, centerY);
      vec2 direction = vUv - center;
      float dist = length(direction);

      // Aberration increases with distance from center (quadratic falloff)
      float aberration = amount * dist * dist;
      vec2 offset = normalize(direction) * aberration;

      // Sample channels at different positions
      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;

      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
};

export function createChromaticAberrationPass(amount: number = 0.003): ShaderPass {
  const pass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      amount: { value: amount },
      centerX: { value: 0.5 },
      centerY: { value: 0.5 },
    },
    vertexShader: RadialChromaticAberrationShader.vertexShader,
    fragmentShader: RadialChromaticAberrationShader.fragmentShader,
  });

  return pass;
}

// Helper to update chromatic aberration intensity (for black hole proximity)
export function setChromaticAberrationAmount(pass: ShaderPass, amount: number): void {
  if (pass.uniforms && pass.uniforms['amount']) {
    pass.uniforms['amount'].value = amount;
  }
}
