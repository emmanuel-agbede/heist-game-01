// vision.js — what a guard or a camera can actually see.
// Sight is blocked by walls and cover, and by smoke; a cone test then
// decides whether the thief stands inside it. Nothing here knows about the
// game rules — it only answers geometry questions.
import { TILE } from './config.js';

/** Turn a level's tile rects into pixel rects a sight line can hit. */
export function solidRects(level) {
  const rects = [];
  for (const [x, y, w, h] of [...level.walls, ...level.cover]) {
    rects.push({ x: x * TILE, y: y * TILE, w: w * TILE, h: h * TILE });
  }
  return rects;
}

/** Does the segment (ax,ay)-(bx,by) cross the rectangle? */
function segmentHitsRect(ax, ay, bx, by, r) {
  // A segment whose start is inside the rect is blocked outright.
  if (ax >= r.x && ax <= r.x + r.w && ay >= r.y && ay <= r.y + r.h) return true;
  const dx = bx - ax;
  const dy = by - ay;
  // Slab test: find the overlap of the segment with the rect's x and y spans.
  let tMin = 0;
  let tMax = 1;
  for (const [p, q, lo, hi] of [[-dx, ax - r.x, 0, 1], [dx, r.x + r.w - ax, 0, 1], [-dy, ay - r.y, 0, 1], [dy, r.y + r.h - ay, 0, 1]]) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) { if (t > tMax) return false; if (t > tMin) tMin = t; }
      else { if (t < tMin) return false; if (t < tMax) tMax = t; }
    }
  }
  return true;
}

/** True when no wall, cover block or smoke cloud stands between the two points. */
export function hasLineOfSight(ax, ay, bx, by, rects, smokes) {
  for (const rect of rects) {
    if (segmentHitsRect(ax, ay, bx, by, rect)) return false;
  }
  for (const smoke of smokes) {
    if (segmentHitsRect(ax, ay, bx, by, {
      x: smoke.x - smoke.r, y: smoke.y - smoke.r, w: smoke.r * 2, h: smoke.r * 2,
    })) return false;
  }
  return true;
}

/** Normalise an angle difference into (-PI, PI]. */
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * Can `eye` (x, y, facing angle, cone half-angle, range) see `target`?
 * Distance first, then the cone, then the line of sight.
 */
export function canSee(eye, target, rects, smokes) {
  const dx = target.x - eye.x;
  const dy = target.y - eye.y;
  const dist = Math.hypot(dx, dy);
  if (dist > eye.range) return false;
  if (dist > 4 && Math.abs(angleDiff(Math.atan2(dy, dx), eye.angle)) > eye.halfAngle) return false;
  return hasLineOfSight(eye.x, eye.y, target.x, target.y, rects, smokes);
}
