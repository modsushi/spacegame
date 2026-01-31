import * as THREE from 'three';

export const AtmosphereShader = {
  uniforms: {
    glowColor: { value: new THREE.Color(0x88aaff) },
    intensity: { value: 0.6 },
    power: { value: 3.0 },
  },

  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPositionNormal;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform vec3 glowColor;
    uniform float intensity;
    uniform float power;

    varying vec3 vNormal;
    varying vec3 vPositionNormal;

    void main() {
      float fresnel = pow(1.0 - abs(dot(vNormal, vPositionNormal)), power);
      vec3 color = glowColor * fresnel * intensity;
      float alpha = fresnel * intensity;
      gl_FragColor = vec4(color, alpha);
    }
  `,
};

export function createAtmosphereMaterial(color: THREE.Color, intensity: number = 0.6): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: color.clone() },
      intensity: { value: intensity },
      power: { value: 3.0 },
    },
    vertexShader: AtmosphereShader.vertexShader,
    fragmentShader: AtmosphereShader.fragmentShader,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
}

export function createAtmosphereMesh(
  radius: number,
  color: THREE.Color,
  intensity: number = 0.6
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius * 1.15, 32, 32);
  const material = createAtmosphereMaterial(color, intensity);
  return new THREE.Mesh(geometry, material);
}
