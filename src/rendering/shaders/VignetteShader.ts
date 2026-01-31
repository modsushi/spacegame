import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

export const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    offset: { value: 1.0 },
    darkness: { value: 1.0 },
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
    uniform float offset;
    uniform float darkness;

    varying vec2 vUv;

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);

      // Distance from center
      vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
      float dist = length(uv);

      // Smooth vignette falloff
      float vignette = smoothstep(0.8, 0.4, dist);
      vignette = mix(1.0, vignette, darkness);

      gl_FragColor = vec4(texel.rgb * vignette, texel.a);
    }
  `,
};

export function createVignettePass(offset: number = 1.0, darkness: number = 0.5): ShaderPass {
  const pass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      offset: { value: offset },
      darkness: { value: darkness },
    },
    vertexShader: VignetteShader.vertexShader,
    fragmentShader: VignetteShader.fragmentShader,
  });

  return pass;
}
