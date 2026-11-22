// guard.js — the people (and lenses) watching the floor.
// A guard patrols its route, investigates a tossed coin or a glimpse of the
// thief, and gives chase once the alarm runs hot. A camera sweeps its arc
// and freezes while an EMP lasts. Both only ever report what they see;
// the alarm meter in main.js decides what that means.
import { TILE, GUARD_PATROL_SPEED, GUARD_CHASE_SPEED, GUARD_CONE_RANGE, GUARD_CONE_HALF_ANGLE, GUARD_SNEAK_RANGE, CAMERA_RANGE, CAMERA_CONE_HALF_ANGLE, CAMERA_SWEEP_SPEED, EMP_DURATION } from './config.js';
import { canSee, angleDiff } from './vision.js';

export function makeGuard(def) {
  const [sx, sy] = def.path[0];
  return {
    x: (sx + 0.5) * TILE,
    y: (sy + 0.5) * TILE,
    path: def.path.map(([tx, ty]) => ({ x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE })),
    waypoint: 1 % def.path.length,
    speed: def.speed,
    angle: 0,
    mode: 'patrol', // patrol | investigate | chase
    investigateX: 0,
    investigateY: 0,
    wait: 0,
    seen: false, // seen this frame
  };
}

export function makeCamera(def) {
  return {
    x: (def.x + 0.5) * TILE,
    y: (def.y + 0.5) * TILE,
    base: def.base,
    sweep: def.sweep,
    angle: def.base,
    phase: 0,
    emp: 0,
    seen: false,
  };
}

function moveToward(entity, tx, ty, speed, dt) {
  const dx = tx - entity.x;
  const dy = ty - entity.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  entity.x += (dx / dist) * step;
  entity.y += (dy / dist) * step;
  entity.angle = Math.atan2(dy, dx);
  return step >= dist;
}

/**
 * Step one guard. Returns nothing; writes guard.seen and guard.mode.
 * `player` carries x, y and sneaking; `rects` blocks sight; `smokes` too.
 */
export function updateGuard(guard, dt, player, rects, smokes, alarm) {
  const range = player.sneaking ? GUARD_SNEAK_RANGE : GUARD_CONE_RANGE;
  guard.seen = canSee(
    { x: guard.x, y: guard.y, angle: guard.angle, halfAngle: GUARD_CONE_HALF_ANGLE, range },
    player, rects, smokes,
  );

  if (guard.mode === 'chase') {
    if (alarm < 40 && !guard.seen) {
      guard.mode = 'investigate';
      guard.investigateX = player.x;
      guard.investigateY = player.y;
      guard.wait = 0;
    } else {
      moveToward(guard, player.x, player.y, GUARD_CHASE_SPEED, dt);
    }
    return;
  }

  if (guard.mode === 'investigate') {
    if (guard.seen) { guard.mode = 'chase'; return; }
    if (moveToward(guard, guard.investigateX, guard.investigateY, GUARD_PATROL_SPEED * 1.4, dt)) {
      guard.wait += dt;
      guard.angle += dt * 1.8; // look around the spot before giving up
      if (guard.wait > 2.5) guard.mode = 'patrol';
    }
    return;
  }

  // Patrol: walk the route, pausing a beat at each waypoint to look around.
  if (guard.seen) { guard.mode = 'chase'; return; }
  if (guard.wait > 0) {
    guard.wait -= dt;
    guard.angle += dt * 0.9;
    return;
  }
  const target = guard.path[guard.waypoint];
  if (moveToward(guard, target.x, target.y, GUARD_PATROL_SPEED * guard.speed, dt)) {
    guard.waypoint = (guard.waypoint + 1) % guard.path.length;
    guard.wait = 0.8;
  }
}

/** A tossed coin pulls every guard near the landing spot over to look. */
export function distractGuards(guards, x, y, radius) {
  for (const guard of guards) {
    if (guard.mode === 'chase') continue;
    if (Math.hypot(guard.x - x, guard.y - y) < radius) {
      guard.mode = 'investigate';
      guard.investigateX = x;
      guard.investigateY = y;
      guard.wait = 0;
    }
  }
}

/** Step one camera: sweep its arc, frozen while the EMP holds. */
export function updateCamera(camera, dt, player, rects, smokes) {
  if (camera.emp > 0) {
    camera.emp -= dt;
    camera.seen = false;
    return;
  }
  camera.phase += dt * CAMERA_SWEEP_SPEED;
  camera.angle = camera.base + Math.sin(camera.phase) * camera.sweep;
  camera.seen = canSee(
    { x: camera.x, y: camera.y, angle: camera.angle, halfAngle: CAMERA_CONE_HALF_ANGLE, range: CAMERA_RANGE },
    player, rects, smokes,
  );
}

/** Cut every camera's power for EMP_DURATION seconds. */
export function empCameras(cameras) {
  for (const camera of cameras) camera.emp = EMP_DURATION;
}
