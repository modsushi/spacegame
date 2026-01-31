# Space Evolution Game - Implementation Plan

## Project Overview
A web-based space evolution game where players start as a tiny asteroid and grow by consuming cosmic matter, evolving through 10 celestial forms: meteorites → asteroids → dwarf planets → planets → gas giants → stars → blue stars → neutron stars → black holes → wormholes.

**Tech Stack**: Three.js + TypeScript + Vite
**Current State**: Empty project with only package.json
**Approach**: MVP first (playable core in 1-2 weeks) → visual polish → full features

---

## Project Structure

```
spacegame/
├── public/
│   ├── index.html
│   └── assets/
│       ├── textures/        # Planet textures, space backgrounds
│       └── particles/       # Particle sprite textures
├── src/
│   ├── main.ts             # Entry point
│   ├── core/
│   │   ├── Game.ts         # Central orchestrator
│   │   ├── GameLoop.ts     # Frame loop with delta time
│   │   ├── SceneManager.ts # Three.js scene setup
│   │   ├── InputManager.ts # Keyboard/mouse input
│   │   └── CameraController.ts  # Smooth camera follow
│   ├── entities/
│   │   ├── BaseEntity.ts   # Abstract base class
│   │   ├── Player.ts       # Player-controlled entity
│   │   ├── CelestialBody.ts
│   │   └── [10 entity types]
│   ├── systems/
│   │   ├── EntityManager.ts    # Entity lifecycle
│   │   ├── PhysicsSystem.ts    # Movement, velocity
│   │   ├── CollisionSystem.ts  # Spatial hash collision detection
│   │   ├── EvolutionSystem.ts  # Progression logic
│   │   └── SpawnSystem.ts      # Procedural entity spawning
│   ├── rendering/
│   │   ├── MaterialFactory.ts  # Materials for each entity type
│   │   ├── GeometryFactory.ts  # Procedural geometry generation
│   │   ├── ParticleSystem.ts   # Trails, explosions, effects
│   │   └── PostProcessing.ts   # Bloom, glow effects
│   ├── ui/
│   │   ├── HUD.ts              # Mass counter, current form
│   │   └── EvolutionNotification.ts
│   ├── utils/
│   │   ├── SpatialHash.ts      # Collision optimization
│   │   ├── Constants.ts        # Game config
│   │   └── AssetLoader.ts      # Texture loading
│   └── config/
│       └── GameConfig.ts       # Central configuration
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Development Phases

### Phase 1: MVP Core Gameplay (1-2 weeks)

**Goal**: Playable game with basic visuals - you can move, collide with, and consume other entities to grow.

#### Step 1: Project Setup
- Install dependencies: `npm install three @types/three vite typescript`
- Create `tsconfig.json` with ES2020 target
- Create `vite.config.ts` with base configuration
- Create `public/index.html` with canvas element
- Setup basic `src/main.ts` entry point

#### Step 2: Core Engine (Critical Files)
1. **src/core/GameLoop.ts**
   - RequestAnimationFrame loop
   - Delta time calculation for frame-independent updates
   - Fixed timestep accumulator for physics

2. **src/core/SceneManager.ts**
   - Initialize Three.js scene, camera, renderer
   - Setup basic lighting (ambient + directional)
   - Handle window resize
   - Simple starfield background (THREE.Points with 5000+ stars)

3. **src/core/Game.ts**
   - Central orchestrator that initializes all systems
   - Coordinate update/render loop
   - Manage game state (playing, paused)

4. **src/core/InputManager.ts**
   - WASD/Arrow key movement
   - Track key states in object for smooth movement
   - Mouse controls optional for Phase 2

5. **src/core/CameraController.ts**
   - Smooth follow player using lerp
   - Maintain fixed distance from player
   - Dynamic zoom based on player size

#### Step 3: Entity System
1. **src/entities/BaseEntity.ts**
   ```typescript
   abstract class BaseEntity {
     id: string
     position: Vector3
     velocity: Vector3
     mass: number
     radius: number
     mesh: THREE.Mesh

     abstract update(deltaTime: number): void
     abstract onCollision(other: BaseEntity): void
     destroy(): void
   }
   ```

2. **src/entities/Player.ts**
   - Extends BaseEntity
   - Apply input acceleration (acceleration-based movement for smooth feel)
   - Track mass and current evolution stage
   - `consumeEntity(entity)` method: add mass, check for evolution
   - Scale radius based on cube root of mass: `radius = BASE * pow(mass, 1/3)`

3. **src/entities/CelestialBody.ts**
   - Extends BaseEntity
   - Simple AI: drift with velocity, no special behavior yet
   - Random spawn positions around player

4. **src/systems/EntityManager.ts**
   - Maintain array of active entities
   - `spawn()`, `remove()`, `update()` methods
   - Entity lifecycle management
   - Store entities in Map by ID for fast lookup

#### Step 4: Collision & Growth System
1. **src/utils/SpatialHash.ts**
   - Grid-based spatial partitioning
   - Cell size = 2x largest entity radius
   - `insert()`, `getNearby()`, `clear()` methods
   - Entities only check collisions within same/adjacent cells (O(n) vs O(n²))

2. **src/systems/CollisionSystem.ts**
   - Rebuild spatial hash each frame
   - Broad phase: spatial hash for candidates
   - Narrow phase: sphere-sphere distance check
   - Collision rules:
     - Larger entity consumes smaller (mass comparison)
     - Equal mass: both bounce
     - Player gains mass from consumed entities
   - Trigger `onCollision()` callbacks

3. **src/systems/PhysicsSystem.ts**
   - Simple Newtonian: `position += velocity * deltaTime`
   - Apply friction/damping: `velocity *= 0.98`
   - Max velocity cap for controllability
   - NO gravity simulation (simple arcade physics)

#### Step 5: Basic Rendering
1. **src/rendering/MaterialFactory.ts**
   - Create simple materials for each entity type:
     - Meteorite: Gray `MeshStandardMaterial`
     - Asteroid: Brown/gray with roughness
     - Planet: Blue/green `MeshStandardMaterial`
     - Star: Emissive yellow `MeshBasicMaterial`
   - No textures yet, just solid colors

2. **src/rendering/GeometryFactory.ts**
   - Use `THREE.IcosahedronGeometry` for rocky bodies
   - Use `THREE.SphereGeometry` for smooth bodies
   - Detail level based on entity size
   - All procedural, no external models

#### Step 6: Basic Evolution & UI
1. **src/systems/EvolutionSystem.ts**
   ```typescript
   const EVOLUTION_STAGES = [
     { type: 'meteorite', minMass: 0, maxMass: 10, radius: 2, color: 0x888888 },
     { type: 'asteroid', minMass: 10, maxMass: 50, radius: 5, color: 0x654321 },
     { type: 'dwarf_planet', minMass: 50, maxMass: 200, radius: 10, color: 0x8B7355 },
     { type: 'planet', minMass: 200, maxMass: 1000, radius: 20, color: 0x4169E1 },
     { type: 'gas_giant', minMass: 1000, maxMass: 5000, radius: 40, color: 0xFFD700 },
     { type: 'star', minMass: 5000, maxMass: 20000, radius: 60, color: 0xFFFF00 },
     { type: 'blue_star', minMass: 20000, maxMass: 80000, radius: 80, color: 0x00BFFF },
     { type: 'neutron_star', minMass: 80000, maxMass: 300000, radius: 30, color: 0xFF00FF },
     { type: 'black_hole', minMass: 300000, maxMass: 1000000, radius: 50, color: 0x000000 },
     { type: 'wormhole', minMass: 1000000, maxMass: Infinity, radius: 70, color: 0x9400D3 }
   ]
   ```
   - Check player mass each frame
   - When threshold crossed, replace player mesh
   - Show simple text notification

2. **src/ui/HUD.ts**
   - HTML overlay with CSS positioning
   - Display: Current mass, current evolution stage
   - Simple div elements, no complex UI framework needed

#### Step 7: Entity Spawning
1. **src/systems/SpawnSystem.ts**
   - Maintain entity count (target: 200-500 entities)
   - Spawn entities outside camera frustum (spawn distance: 500 units)
   - Despawn entities beyond 1000 units from player
   - Spawn distribution:
     - 60% smaller than player (consumable)
     - 30% similar size (neutral)
     - 10% larger (threats)

**Phase 1 Deliverable**: Playable game where you control a sphere, eat smaller objects, grow in size, and evolve through stages. Basic but functional.

---

### Phase 2: Visual Polish (1 week)

**Goal**: Beautiful graphics with atmosphere, particles, and effects

#### Step 1: Textures & Materials
1. **Add texture assets** to `public/assets/textures/`
   - See "High-Quality Asset Sources" section below for where to get these
   - Planet diffuse/normal maps
   - Asteroid surface textures
   - Particle sprites

2. **Enhance MaterialFactory.ts**
   - Use `TextureLoader` to load textures
   - Apply normal maps for surface detail
   - Add emissive maps for glowing areas
   - PBR materials with metalness/roughness

3. **Improve GeometryFactory.ts**
   - Add vertex displacement for asteroids (procedural irregularity)
   - Higher detail spheres (32x32 segments)
   - Custom shaders for gas giants (swirling bands)

#### Step 2: Particle Effects
1. **src/rendering/ParticleSystem.ts**
   - Player movement trail (fading particles behind)
   - Consumption burst (explosion effect when eating)
   - Star corona particles (ring around stars)
   - Use `THREE.Points` with sprite textures

2. **Entity-specific effects**
   - Black hole: Accretion disk particles (swirling ring)
   - Wormhole: Vortex spiral particles
   - Stars: Glow/flare particles

#### Step 3: Enhanced Lighting
1. **src/rendering/LightingManager.ts**
   - Ambient light (low intensity for space)
   - Hemisphere light (space ambiance)
   - Point lights from star entities (dynamic)
   - Light intensity scales with star size

2. **Starfield Enhancement**
   - 10,000+ star points with varying sizes
   - Color variation (blue, white, yellow stars)
   - Subtle parallax scrolling
   - Optional: Nebula billboards with noise texture

#### Step 4: Post-Processing
1. **src/rendering/PostProcessing.ts**
   - Use `EffectComposer` from three/examples
   - `UnrealBloomPass` for star glow and bright objects
   - Subtle vignette effect
   - Adjustable bloom intensity

**Phase 2 Deliverable**: Visually impressive game with particle trails, glowing stars, textured planets, and atmospheric space environment

---

### Phase 3: Full Evolution System & Polish (1 week)

#### Step 1: Complete Entity Types
- Implement all 10 entity classes (Meteorite.ts through Wormhole.ts)
- Each with unique:
  - Visual appearance (material, shader)
  - Behavior (drift patterns, special effects)
  - Spawn weights (more common for smaller types)

#### Step 2: Advanced Evolution
1. **Smooth transitions**
   - Scale animation when evolving (grow effect)
   - Particle burst on evolution
   - Screen shake effect

2. **src/ui/EvolutionNotification.ts**
   - Full-screen overlay showing new form
   - Fade in/out animation
   - Display new abilities/info

#### Step 3: Enhanced Spawning
- Balance entity distribution based on player stage
- Spawn larger entities as player grows
- Create "zones" with different entity densities
- Procedural spawn patterns (clusters, rings)

#### Step 4: Special Mechanics
- **Black Hole**: Weak gravitational pull on nearby entities
- **Wormhole**: Teleport player across map
- **Neutron Star**: High density, small but massive
- **Gas Giant**: Larger radius but lower density

**Phase 3 Deliverable**: Complete game with all 10 evolution stages and polished mechanics

---

### Phase 4: Advanced Features (Optional)

- Sound effects and music
- Menu system (start, pause, restart)
- Local high score tracking
- Camera effects (black hole distortion)
- Performance optimizations (LOD, instancing)
- Mobile touch controls

---

## High-Quality Asset Sources

### 3D Models (If Needed Later)
While the plan uses procedural geometry, here are sources for custom 3D models:

**Free:**
- **Sketchfab** (sketchfab.com) - Filter by "Free Download" + "CC License"
  - Search: "asteroid", "planet", "space"
- **Poly Pizza** (poly.pizza) - Free low-poly models, great for space objects
- **NASA 3D Resources** (nasa3d.arc.nasa.gov) - Authentic planetary models
- **Quaternius** (quaternius.com) - Stylized space assets

**Paid (High Quality):**
- **TurboSquid** - Professional models
- **CGTrader** - Wide variety
- **Unity Asset Store** - Export to .glb format

### Textures (Critical for Phase 2)

**Free High-Quality:**
1. **Solar System Scope** (solarsystemscope.com/textures)
   - 2K/4K planet textures (Earth, Mars, Jupiter, etc.)
   - Free for non-commercial use
   - Realistic planetary surfaces

2. **NASA Image Gallery** (nasa.gov/multimedia/imagegallery)
   - Authentic space textures
   - Planet surfaces, nebulae, stars
   - Public domain

3. **Poly Haven** (polyhaven.com)
   - PBR textures (physically based)
   - HDRI environments for skybox
   - High quality, CC0 license

4. **TextureFun** (texturefun.com)
   - Space textures category
   - Seamless, tileable
   - Free for personal/commercial

5. **AmbientCG** (ambientcg.com)
   - PBR rock/asteroid textures
   - Free CC0 license
   - 2K/4K resolution

**Procedural Textures:**
- Generate in code using simplex/perlin noise (no files needed)
- Use Three.js `DataTexture` for runtime generation
- Good for gas giants, nebulae, abstract surfaces

**Recommended Texture Setup:**
```
public/assets/textures/
├── planets/
│   ├── earth_diffuse_4k.jpg      (Solar System Scope)
│   ├── earth_normal_4k.jpg
│   ├── mars_diffuse_2k.jpg
│   └── jupiter_diffuse_4k.jpg
├── asteroids/
│   ├── rocky_surface_2k.jpg      (AmbientCG)
│   └── rocky_normal_2k.jpg
├── space/
│   ├── starfield_hdr.hdr         (Poly Haven)
│   └── nebula_cloud.png
└── particles/
    ├── particle_glow.png         (Create in Photoshop/GIMP)
    └── trail_sprite.png
```

### Creating Your Own Particle Textures
- Use GIMP/Photoshop to create simple circular gradients
- White center fading to transparent edges
- 128x128 or 256x256 PNG with alpha channel
- Takes 5 minutes to make

---

## Critical Files (Implementation Order)

### Foundation (Must Build First)
1. `src/core/Game.ts` - Central orchestrator, initializes everything
2. `src/core/GameLoop.ts` - Frame loop, enables all updates
3. `src/core/SceneManager.ts` - Three.js setup, rendering context
4. `src/entities/BaseEntity.ts` - Entity foundation
5. `src/entities/Player.ts` - Core gameplay experience

### Core Systems (Build Next)
6. `src/systems/EntityManager.ts` - Entity lifecycle
7. `src/systems/CollisionSystem.ts` - Eat-to-grow mechanic
8. `src/utils/SpatialHash.ts` - Collision performance
9. `src/systems/PhysicsSystem.ts` - Movement
10. `src/core/InputManager.ts` - Player control

### Essential Rendering (Makes It Visible)
11. `src/rendering/MaterialFactory.ts` - Entity visuals
12. `src/rendering/GeometryFactory.ts` - Entity shapes
13. `src/core/CameraController.ts` - Follow player

### Evolution & Progression
14. `src/systems/EvolutionSystem.ts` - Progression logic
15. `src/ui/HUD.ts` - Player feedback
16. `src/systems/SpawnSystem.ts` - Dynamic world

### Polish (Later Phases)
17. `src/rendering/ParticleSystem.ts`
18. `src/rendering/PostProcessing.ts`
19. `src/ui/EvolutionNotification.ts`

---

## Configuration

### package.json Dependencies
```json
{
  "dependencies": {
    "three": "^0.160.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "vite": "^5.0.0",
    "@types/three": "^0.160.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

### Game Configuration (src/config/GameConfig.ts)
```typescript
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
  MAX_ENTITIES: 500,
  SPAWN_INTERVAL: 2000, // ms

  // Camera
  CAMERA_DISTANCE: 150,
  CAMERA_LERP_SPEED: 0.1,
  CAMERA_MIN_DISTANCE: 50,
  CAMERA_MAX_DISTANCE: 500,

  // Physics
  COLLISION_CELL_SIZE: 100,
  MASS_TO_RADIUS_POWER: 1/3,

  // Visual
  STARFIELD_COUNT: 10000,
  PARTICLE_POOL_SIZE: 1000
};
```

---

## Performance Targets

- **60 FPS** on mid-range hardware (GTX 1060 / equivalent)
- **500+ active entities** without lag
- **Smooth camera** follow with no stuttering
- **Fast load time** (<3 seconds initial load)

### Optimization Techniques to Use
1. **Spatial hash** for collision (implemented in Phase 1)
2. **Object pooling** for particles (Phase 2)
3. **Frustum culling** (automatic with Three.js)
4. **Distance culling** (despawn far entities)
5. **Geometry/material reuse** (same sphere for multiple entities)
6. **LOD** (Level of Detail) - Phase 4

---

## Verification & Testing

### End-to-End Testing Steps

**Phase 1 Verification:**
1. Run `npm run dev`
2. Navigate to `localhost:5173`
3. Test movement with WASD keys - player should move smoothly
4. Verify collision - approach smaller entity, it should disappear and player should grow
5. Check mass counter updates in HUD
6. Test evolution - consume enough to reach 10+ mass, verify mesh changes
7. Test camera - camera should smoothly follow player
8. Check performance - open DevTools Performance tab, verify 60fps

**Phase 2 Verification:**
1. Verify textures loaded - planets should have surface detail
2. Check particle trails behind player
3. Test bloom effect - stars should glow
4. Verify starfield background is visible
5. Test consumption particles appear on collision

**Phase 3 Verification:**
1. Evolve through all 10 stages - each should have unique appearance
2. Test special mechanics (black hole pull, etc.)
3. Verify evolution notification displays
4. Check entity variety in spawning

### Manual Testing Checklist
- [ ] Player movement feels responsive
- [ ] Collision detection is accurate (no missed collisions or false positives)
- [ ] Evolution thresholds feel balanced (not too fast/slow)
- [ ] Camera doesn't clip through entities
- [ ] Frame rate stays above 50fps with 500+ entities
- [ ] No memory leaks after 5+ minutes of play
- [ ] Particle effects don't tank performance
- [ ] Textures are crisp and not pixelated
- [ ] Game is fun to play for 10+ minutes

### Performance Monitoring
```typescript
// Add to Game.ts during development
import Stats from 'three/examples/jsm/libs/stats.module'

const stats = Stats()
document.body.appendChild(stats.dom)

// In game loop:
stats.begin()
// ... update and render
stats.end()
```

---

## Next Steps After Plan Approval

1. Run `npm install three @types/three vite typescript`
2. Create project structure (folders in src/)
3. Setup TypeScript configuration
4. Create Vite config
5. Build public/index.html with canvas
6. Implement core files in order listed above

The first working prototype (Phase 1 MVP) can be achieved in 1-2 weeks of focused development. Then iteratively enhance with visual polish and features.

