import * as THREE from 'three';

export const WormholeShader = {
  uniforms: {
    time: { value: 0 },
    innerColor: { value: new THREE.Color(0x4400ff) },
    outerColor: { value: new THREE.Color(0x8844dd) },
    ringColor: { value: new THREE.Color(0xaa66ff) },
  },

  vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,

  fragmentShader: `
    uniform float time;
    uniform vec3 innerColor;
    uniform vec3 outerColor;
    uniform vec3 ringColor;

    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      // Spherical coords for spiral effect
      float theta = atan(vPosition.z, vPosition.x);
      float phi = acos(clamp(vPosition.y / length(vPosition), -1.0, 1.0));

      // Spiral pattern
      float spiral = sin(theta * 5.0 + phi * 3.0 - time * 3.0);
      spiral = spiral * 0.5 + 0.5;
      spiral = pow(spiral, 2.0);

      // Pulsing energy rings
      float rings = sin(phi * 20.0 - time * 4.0);
      rings = smoothstep(0.6, 1.0, rings);

      // Vortex effect - brighten towards poles
      float vortex = 1.0 - abs(vPosition.y / length(vPosition));
      vortex = pow(vortex, 0.5);

      // Fresnel for edge glow (using view position)
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);

      // Combine effects
      vec3 baseColor = mix(innerColor, outerColor, vortex);
      baseColor = mix(baseColor, ringColor, rings * 0.5);
      baseColor += ringColor * spiral * 0.3;

      // Pulsing overall brightness
      float pulse = sin(time * 2.0) * 0.15 + 1.0;

      float brightness = (spiral * 0.3 + vortex * 0.4 + rings * 0.3 + fresnel * 0.5) * pulse;

      gl_FragColor = vec4(baseColor * brightness, 0.9);
    }
  `,
};

export function createWormholeMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      innerColor: { value: new THREE.Color(0x4400ff) },
      outerColor: { value: new THREE.Color(0x8844dd) },
      ringColor: { value: new THREE.Color(0xaa66ff) },
    },
    vertexShader: WormholeShader.vertexShader,
    fragmentShader: WormholeShader.fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
  });
}

// Energy ring around wormhole
export const WormholeRingShader = {
  uniforms: {
    time: { value: 0 },
    color: { value: new THREE.Color(0xaa66ff) },
  },

  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float time;
    uniform vec3 color;

    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5);
      vec2 uv = vUv - center;
      float dist = length(uv) * 2.0;
      float angle = atan(uv.y, uv.x);

      // Ring shape
      float ring = 1.0 - smoothstep(0.0, 0.3, abs(dist - 0.7));

      // Rotating energy pulses
      float pulses = sin(angle * 8.0 - time * 5.0);
      pulses = smoothstep(0.3, 1.0, pulses);

      float brightness = ring * (0.5 + pulses * 0.5);

      // Pulsing
      brightness *= sin(time * 3.0) * 0.2 + 1.0;

      gl_FragColor = vec4(color * brightness * 1.5, brightness * ring);
    }
  `,
};

export function createWormholeRingMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color(0xaa66ff) },
    },
    vertexShader: WormholeRingShader.vertexShader,
    fragmentShader: WormholeRingShader.fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

export function createWormholeMesh(radius: number): THREE.Group {
  const group = new THREE.Group();

  // Main wormhole sphere
  const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
  const sphereMaterial = createWormholeMaterial();
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  group.add(sphere);

  // Energy ring
  const ringGeometry = new THREE.RingGeometry(radius * 1.2, radius * 1.6, 64, 1);
  const ringMaterial = createWormholeRingMaterial();
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  // Second ring at different angle
  const ring2 = new THREE.Mesh(ringGeometry.clone(), ringMaterial.clone());
  ring2.rotation.x = Math.PI / 2;
  ring2.rotation.y = Math.PI / 3;
  group.add(ring2);

  return group;
}
