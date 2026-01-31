import * as THREE from 'three';

export const GasGiantShader = {
  uniforms: {
    time: { value: 0 },
    bandColors: { value: [
      new THREE.Color(0xdcb478), // Tan
      new THREE.Color(0xc88c64), // Orange-brown
      new THREE.Color(0xb4a08c), // Light brown
      new THREE.Color(0xf0c8a0), // Cream
      new THREE.Color(0xa07864), // Dark brown
    ]},
    bandCount: { value: 8.0 },
    turbulenceStrength: { value: 0.15 },
    bandSpeed: { value: 0.02 },
  },

  vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;

    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float time;
    uniform vec3 bandColors[5];
    uniform float bandCount;
    uniform float turbulenceStrength;
    uniform float bandSpeed;

    varying vec2 vUv;
    varying vec3 vPosition;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
        + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
        dot(x12.zw, x12.zw)), 0.0);
      m = m * m * m * m;
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
      for (int i = 0; i < 3; i++) {
        value += amplitude * snoise(uv);
        uv *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      // Spherical UV
      vec2 sphereUV = vec2(
        atan(vPosition.z, vPosition.x) / (2.0 * 3.14159) + 0.5,
        asin(clamp(vPosition.y / length(vPosition), -1.0, 1.0)) / 3.14159 + 0.5
      );

      // Animate bands horizontally at different speeds per latitude
      float latitude = sphereUV.y;
      float latOffset = sin(latitude * 3.14159 * 4.0) * 0.3; // Different speeds at different latitudes
      float animatedX = sphereUV.x + time * bandSpeed * (1.0 + latOffset);

      // Turbulence at band boundaries
      float turbulence = fbm(vec2(animatedX * 8.0, latitude * 4.0) + time * 0.1);
      turbulence *= turbulenceStrength;

      // Band position with turbulence
      float bandPos = (latitude + turbulence) * bandCount;
      int bandIndex = int(mod(floor(bandPos), 5.0));
      int nextBandIndex = int(mod(floor(bandPos) + 1.0, 5.0));
      float blend = fract(bandPos);

      // Smooth blend between bands
      blend = blend * blend * (3.0 - 2.0 * blend);

      // Get colors
      vec3 color1 = bandColors[bandIndex];
      vec3 color2 = bandColors[nextBandIndex];
      vec3 color = mix(color1, color2, blend);

      // Storm/vortex spots (like Great Red Spot)
      vec2 stormUV = vec2(animatedX * 4.0, latitude * 2.0);
      float storm = snoise(stormUV);
      if (storm > 0.65) {
        float stormIntensity = (storm - 0.65) * 2.857;
        color = mix(color, vec3(0.7, 0.3, 0.25), stormIntensity * 0.5);
      }

      // Fine detail noise
      float detail = snoise(vec2(animatedX * 30.0, latitude * 15.0)) * 0.05;
      color += detail;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

export function createGasGiantMaterial(
  colors?: THREE.Color[]
): THREE.ShaderMaterial {
  const defaultColors = [
    new THREE.Color(0xdcb478),
    new THREE.Color(0xc88c64),
    new THREE.Color(0xb4a08c),
    new THREE.Color(0xf0c8a0),
    new THREE.Color(0xa07864),
  ];

  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      bandColors: { value: colors ?? defaultColors },
      bandCount: { value: 8.0 },
      turbulenceStrength: { value: 0.15 },
      bandSpeed: { value: 0.02 },
    },
    vertexShader: GasGiantShader.vertexShader,
    fragmentShader: GasGiantShader.fragmentShader,
  });
}
