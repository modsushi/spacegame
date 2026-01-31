export const GameConfig = {
  // World
  WORLD_SIZE: 10000,
  SPAWN_DISTANCE: 500,
  DESPAWN_DISTANCE: 1000,

  // Player
  PLAYER_START_MASS: 5,
  PLAYER_ACCELERATION: 100,
  PLAYER_MAX_SPEED: 200,
  PLAYER_FRICTION: 0.98,

  // Entities
  MAX_ENTITIES: 100,
  SPAWN_INTERVAL: 500,
  INITIAL_SPAWN_COUNT: 40,

  // Camera
  CAMERA_DISTANCE: 150,
  CAMERA_LERP_SPEED: 0.1,
  CAMERA_MIN_DISTANCE: 50,
  CAMERA_MAX_DISTANCE: 500,

  // Physics
  COLLISION_CELL_SIZE: 100,
  MASS_TO_RADIUS_POWER: 1 / 3,
  BASE_RADIUS: 2,

  // Gravity
  GRAVITY_CONSTANT: 50,
  GRAVITY_RANGE_MULTIPLIER: 8,
  CAPTURE_VELOCITY_THRESHOLD: 30,
  MIN_MASS_FOR_GRAVITY: 200,
  MAX_MOONS: 5,

  // Visual
  STARFIELD_COUNT: 2000,
  PARTICLE_POOL_SIZE: 1000
};

export const EVOLUTION_STAGES = [
  { type: 'meteorite', minMass: 0, maxMass: 10, color: 0x888888 },
  { type: 'asteroid', minMass: 10, maxMass: 50, color: 0x654321 },
  { type: 'dwarf_planet', minMass: 50, maxMass: 200, color: 0x8b7355 },
  { type: 'planet', minMass: 200, maxMass: 1000, color: 0x4169e1 },
  { type: 'gas_giant', minMass: 1000, maxMass: 5000, color: 0xffd700 },
  { type: 'star', minMass: 5000, maxMass: 20000, color: 0xffff00 },
  { type: 'blue_star', minMass: 20000, maxMass: 80000, color: 0x00bfff },
  { type: 'neutron_star', minMass: 80000, maxMass: 300000, color: 0xff00ff },
  { type: 'black_hole', minMass: 300000, maxMass: 1000000, color: 0x000000 },
  { type: 'wormhole', minMass: 1000000, maxMass: Infinity, color: 0x9400d3 }
] as const;

export type EvolutionStageType = (typeof EVOLUTION_STAGES)[number]['type'];

export function hasGravity(stage: EvolutionStageType): boolean {
  const gravityStages: EvolutionStageType[] = [
    'planet',
    'gas_giant',
    'star',
    'blue_star',
    'neutron_star',
    'black_hole',
    'wormhole'
  ];
  return gravityStages.includes(stage);
}

export function isGlowing(stage: EvolutionStageType): boolean {
  const glowingStages: EvolutionStageType[] = [
    'gas_giant',
    'star',
    'blue_star',
    'neutron_star',
    'wormhole'
  ];
  return glowingStages.includes(stage);
}
