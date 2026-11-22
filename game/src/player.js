// player.js — the thief, Rook, and the tools in their pockets.
// Movement is WASD or arrows; Shift sneaks. The mouse throws a coin to a
// clicked tile, Q drops smoke, F fires the EMP, E holds the lockpick.
// Collision slides along walls: the x step resolves, then the y step.
import { TILE, PLAYER_RADIUS, PLAYER_WALK_SPEED, PLAYER_SNEAK_SPEED, COIN_RANGE, SMOKE_RADIUS, SMOKE_DURATION } from './config.js';

export function makePlayer(start) {
  return {
    x: (start[0] + 0.5) * TILE,
    y: (start[1] + 0.5) * TILE,
    angle: -Math.PI / 2,
    sneaking: false,
    moving: false,
    running: false,
    lockpick: 0, // seconds held on a locked case, 0 when not picking
  };
}

function hitsWall(x, y, rects) {
  for (const rect of rects) {
    const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
    const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
    if ((x - cx) ** 2 + (y - cy) ** 2 < PLAYER_RADIUS * PLAYER_RADIUS) return true;
  }
  return false;
}

/** Move the thief by the held keys; returns true when a step was taken. */
export function updatePlayer(player, dt, keys, rects, bounds) {
  let dx = 0;
  let dy = 0;
  if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d')) dx += 1;
  if (keys.has('arrowup') || keys.has('w')) dy -= 1;
  if (keys.has('arrowdown') || keys.has('s')) dy += 1;
  player.sneaking = keys.has('shift');
  player.moving = dx !== 0 || dy !== 0;
  if (!player.moving) return false;
  const len = Math.hypot(dx, dy);
  const speed = player.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_WALK_SPEED;
  dx = (dx / len) * speed * dt;
  dy = (dy / len) * speed * dt;
  player.angle = Math.atan2(dy, dx);
  player.running = !player.sneaking;
  // Slide: try x, then y, so a wall never stops a slide along it.
  const nx = Math.max(PLAYER_RADIUS, Math.min(bounds.w - PLAYER_RADIUS, player.x + dx));
  if (!hitsWall(nx, player.y, rects)) player.x = nx;
  const ny = Math.max(PLAYER_RADIUS, Math.min(bounds.h - PLAYER_RADIUS, player.y + dy));
  if (!hitsWall(player.x, ny, rects)) player.y = ny;
  return true;
}

/** A coin toss: the target tile, clamped to throwing range. */
export function coinTarget(player, clickX, clickY) {
  const dx = clickX - player.x;
  const dy = clickY - player.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= COIN_RANGE) return { x: clickX, y: clickY };
  return { x: player.x + (dx / dist) * COIN_RANGE, y: player.y + (dy / dist) * COIN_RANGE };
}

/** A fresh smoke cloud at the thief's feet. */
export function makeSmoke(player) {
  return { x: player.x, y: player.y, r: SMOKE_RADIUS, left: SMOKE_DURATION };
}
