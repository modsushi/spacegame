import * as THREE from 'three';

export const BlackHoleShader = {
  uniforms: {
    time: { value: 0 },
    innerRadius: { value: 0.3 },
    diskInnerRadius: { value: 0.35 },
    diskOuterRadius: { value: 1.0 },
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
    uniform float innerRadius;
    uniform float diskInnerRadius;
    uniform float diskOuterRadius;

    varying vec2 vUv;
    varying vec3 vPosition;

    void main() {
      vec2 center = vec2(0.5);
      vec2 uv = vUv - center;
      float dist = length(uv);
      float angle = atan(uv.y, uv.x);

      // Event horizon (pure black)
      if (dist < innerRadius) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }

      // Accretion disk
      if (dist >= diskInnerRadius && dist <= diskOuterRadius) {
        // Disk position in normalized space
        float diskPos = (dist - diskInnerRadius) / (diskOuterRadius - diskInnerRadius);

        // Spiral rotation
        float spiralAngle = angle + time * 2.0 + dist * 10.0;

        // Spiral arms
        float spiral = sin(spiralAngle * 3.0) * 0.5 + 0.5;
        spiral = pow(spiral, 2.0);

        // Brightness falls off with distance
        float brightness = (1.0 - diskPos) * 0.8 + 0.2;
        brightness *= spiral * 0.5 + 0.5;

        // Hot inner disk (white/yellow) to cooler outer (orange/red)
        vec3 innerColor = vec3(1.0, 0.95, 0.8);
        vec3 outerColor = vec3(1.0, 0.4, 0.1);
        vec3 color = mix(innerColor, outerColor, diskPos);

        // Add some noise variation
        float noise = fract(sin(dot(uv + time * 0.1, vec2(12.9898, 78.233))) * 43758.5453);
        brightness += noise * 0.1;

        // Doppler beaming effect (brighter on approaching side)
        float doppler = sin(angle - time * 0.5) * 0.3 + 1.0;
        brightness *= doppler;

        gl_FragColor = vec4(color * brightness, 1.0);
        return;
      }

      // Outside disk - transparent
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
  `,
};

// Create the event horizon (core black sphere)
export function createBlackHoleCoreMaterial(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: 0x000000,
  });
}

// Create the accretion disk
export const AccretionDiskShader = {
  uniforms: {
    time: { value: 0 },
  },

  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float time;

    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5);
      vec2 uv = vUv - center;
      float dist = length(uv) * 2.0;
      float angle = atan(uv.y, uv.x);

      // Ring shape
      float ringWidth = 0.3;
      float ringCenter = 0.7;
      float ring = 1.0 - smoothstep(0.0, ringWidth, abs(dist - ringCenter));

      if (ring < 0.01) {
        discard;
      }

      // Spiral rotation
      float spiralAngle = angle + time * 1.0 + (1.0 - dist) * 7.0;
      float spiral = sin(spiralAngle * 4.0) * 0.5 + 0.5;
      spiral = pow(spiral, 1.5);

      // Hot inner to cool outer
      float heatGradient = 1.0 - (dist - 0.4) / 0.6;
      heatGradient = clamp(heatGradient, 0.0, 1.0);

      vec3 innerColor = vec3(1.0, 0.9, 0.7);
      vec3 outerColor = vec3(1.0, 0.3, 0.05);
      vec3 color = mix(outerColor, innerColor, heatGradient);

      // Brightness modulation
      float brightness = (spiral * 0.6 + 0.4) * ring;
      brightness *= heatGradient * 0.5 + 0.5;

      // Doppler beaming
      float doppler = sin(angle - time) * 0.2 + 1.0;
      brightness *= doppler;

      gl_FragColor = vec4(color * brightness, brightness * ring);
    }
  `,
};

export function createAccretionDiskMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
    },
    vertexShader: AccretionDiskShader.vertexShader,
    fragmentShader: AccretionDiskShader.fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

export function createBlackHoleMesh(radius: number): THREE.Group {
  const group = new THREE.Group();

  // Core black sphere - larger relative to disk
  const coreGeometry = new THREE.SphereGeometry(radius * 0.6, 32, 32);
  const coreMaterial = createBlackHoleCoreMaterial();
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  group.add(core);

  // Accretion disk - smaller and tighter
  const diskGeometry = new THREE.RingGeometry(radius * 0.7, radius * 1.1, 48, 1);
  const diskMaterial = createAccretionDiskMaterial();
  const disk = new THREE.Mesh(diskGeometry, diskMaterial);
  disk.rotation.x = Math.PI / 2 * 0.85; // Slight tilt
  group.add(disk);

  return group;
}
