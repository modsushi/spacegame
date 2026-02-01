import * as THREE from 'three';

export const StarShader = {
  uniforms: {
    time: { value: 0 },
    baseColor: { value: new THREE.Color(0xffdd44) },
    emissiveColor: { value: new THREE.Color(0xffaa00) },
    noiseScale: { value: 4.0 },
    pulseSpeed: { value: 0.5 },
    pulseIntensity: { value: 0.2 },
  },

  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float time;
    uniform vec3 baseColor;
    uniform vec3 emissiveColor;
    uniform float noiseScale;
    uniform float pulseSpeed;
    uniform float pulseIntensity;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    // Simplex noise functions
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
        + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
        dot(x12.zw, x12.zw)), 0.0);
      m = m * m;
      m = m * m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    float fbm(vec2 uv) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 4; i++) {
        value += amplitude * snoise(uv);
        uv *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      // Spherical UV mapping
      vec2 sphereUV = vec2(
        atan(vPosition.z, vPosition.x) / (2.0 * 3.14159) + 0.5,
        asin(clamp(vPosition.y / length(vPosition), -1.0, 1.0)) / 3.14159 + 0.5
      );

      // Animated plasma cells
      vec2 uv1 = sphereUV * noiseScale + time * 0.08;
      vec2 uv2 = sphereUV * noiseScale * 1.4 - time * 0.1;

      float n1 = fbm(uv1);
      float n2 = fbm(uv2);
      float plasma = (n1 + n2) * 0.4 + 0.6;

      // Bright spots (convection cells)
      float spots = snoise(sphereUV * 7.0 + time * 0.12);
      spots = smoothstep(0.4, 0.85, spots) * 0.25;

      // Pulsing brightness
      float pulse = sin(time * pulseSpeed) * pulseIntensity + 1.0;

      // Combine effects
      float intensity = plasma + spots;
      intensity *= pulse;

      vec3 color = mix(baseColor, emissiveColor, intensity);
      color *= intensity * 1.1;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

export function createStarMaterial(
  baseColor: THREE.Color = new THREE.Color(0xffdd44),
  emissiveColor: THREE.Color = new THREE.Color(0xffaa00)
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      baseColor: { value: baseColor.clone() },
      emissiveColor: { value: emissiveColor.clone() },
      noiseScale: { value: 4.0 },
      pulseSpeed: { value: 0.5 },
      pulseIntensity: { value: 0.2 },
    },
    vertexShader: StarShader.vertexShader,
    fragmentShader: StarShader.fragmentShader,
  });
}
