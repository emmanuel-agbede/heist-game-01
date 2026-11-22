// render.js — everything the player sees, drawn on one canvas.
// The floor is a checker of dark tiles; walls are blocks with a gold cap,
// cover is glass cases and crates, and every eye in the room draws its
// vision cone so the danger is readable at a glance. The HUD carries the
// alarm meter, the tools, the loot and the clock; the title, caught and
// win screens are drawn over the frozen floor.
import { TILE, COLS, ROWS, VIEW_W, VIEW_H, COLOURS, GUARD_CONE_RANGE, GUARD_CONE_HALF_ANGLE, CAMERA_RANGE, CAMERA_CONE_HALF_ANGLE, ALARM_MAX, ALARM_WARN_AT, LOCKPICK_SECONDS } from './config.js';
import { angleDiff } from './vision.js';

function drawCone(ctx, x, y, angle, halfAngle, range, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawFloor(ctx) {
  for (let ty = 0; ty < ROWS; ty += 1) {
    for (let tx = 0; tx < COLS; tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLOURS.floor : COLOURS.floorAlt;
      ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
    }
  }
  // Faint carpet runner down the middle of the open floor, for orientation.
  ctx.fillStyle = 'rgba(232, 182, 76, 0.05)';
  ctx.fillRect(0, ROWS * TILE * 0.5 - TILE, VIEW_W, TILE * 2);
}

function drawWalls(ctx, level) {
  for (const [x, y, w, h] of level.walls) {
    ctx.fillStyle = COLOURS.wall;
    ctx.fillRect(x * TILE, y * TILE, w * TILE, h * TILE);
    ctx.fillStyle = COLOURS.wallTop;
    ctx.fillRect(x * TILE, y * TILE, w * TILE, 5);
    ctx.strokeStyle = COLOURS.goldDim;
    ctx.lineWidth = 1;
    ctx.strokeRect(x * TILE + 0.5, y * TILE + 0.5, w * TILE - 1, h * TILE - 1);
  }
  for (const [x, y, w, h] of level.cover) {
    const px = x * TILE;
    const py = y * TILE;
    // A glass display case: pale frame, blue glint, gold base.
    ctx.fillStyle = COLOURS.goldDim;
    ctx.fillRect(px + 2, py + 2, w * TILE - 4, h * TILE - 4);
    ctx.fillStyle = 'rgba(127, 212, 255, 0.28)';
    ctx.fillRect(px + 6, py + 6, w * TILE - 12, h * TILE - 12);
    ctx.strokeStyle = 'rgba(127, 212, 255, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 8, py + h * TILE - 8);
    ctx.lineTo(px + w * TILE - 8, py + 8);
    ctx.stroke();
  }
}

function drawExit(ctx, state) {
  const { x, y } = state.exit;
  const pulse = 0.6 + 0.4 * Math.sin(state.time * 3);
  ctx.fillStyle = state.hasLoot ? `rgba(61, 220, 132, ${0.25 + 0.35 * pulse})` : 'rgba(61, 220, 132, 0.18)';
  ctx.fillRect(x - TILE / 2, y - TILE / 2, TILE, TILE);
  ctx.strokeStyle = COLOURS.exit;
  ctx.lineWidth = 2;
  ctx.strokeRect(x - TILE / 2 + 1, y - TILE / 2 + 1, TILE - 2, TILE - 2);
  ctx.fillStyle = COLOURS.exit;
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', x, y + 4);
}

function drawLoot(ctx, state) {
  if (state.hasLoot) return;
  const { x, y } = state.loot;
  const bob = Math.sin(state.time * 2.5) * 3;
  const glow = 0.5 + 0.3 * Math.sin(state.time * 2.5);
  ctx.fillStyle = `rgba(255, 217, 77, ${0.12 * glow + 0.08})`;
  ctx.beginPath();
  ctx.arc(x, y + bob, 26, 0, Math.PI * 2);
  ctx.fill();
  // The jewel: a cut diamond, drawn as two triangles.
  ctx.fillStyle = COLOURS.loot;
  ctx.beginPath();
  ctx.moveTo(x, y - 12 + bob);
  ctx.lineTo(x + 10, y + bob);
  ctx.lineTo(x, y + 11 + bob);
  ctx.lineTo(x - 10, y + bob);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff6c9';
  ctx.beginPath();
  ctx.moveTo(x, y - 12 + bob);
  ctx.lineTo(x + 10, y + bob);
  ctx.lineTo(x - 10, y + bob);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLOURS.text;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(state.level.jewel, x, y + 30 + bob);
}

function drawCameras(ctx, state) {
  for (const camera of state.cameras) {
    if (camera.emp > 0) {
      ctx.fillStyle = 'rgba(120, 120, 130, 0.5)';
    } else {
      drawCone(ctx, camera.x, camera.y, camera.angle, CAMERA_CONE_HALF_ANGLE, CAMERA_RANGE, camera.seen ? 'rgba(255, 80, 60, 0.30)' : COLOURS.cameraCone);
      ctx.fillStyle = camera.seen ? '#ff453a' : '#e8b64c';
    }
    ctx.beginPath();
    ctx.arc(camera.x, camera.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#171a26';
    ctx.beginPath();
    ctx.arc(camera.x, camera.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGuards(ctx, state) {
  for (const guard of state.guards) {
    const hot = guard.seen || guard.mode === 'chase';
    drawCone(ctx, guard.x, guard.y, guard.angle, GUARD_CONE_HALF_ANGLE, GUARD_CONE_RANGE, hot ? COLOURS.coneHot : COLOURS.cone);
    // The guard: a dark-red figure with a pale cap, facing its angle.
    ctx.save();
    ctx.translate(guard.x, guard.y);
    ctx.rotate(guard.angle);
    ctx.fillStyle = guard.mode === 'chase' ? '#ff453a' : COLOURS.guard;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLOURS.guardDark;
    ctx.fillRect(8, -6, 8, 12); // shoulders, pointing the way they face
    ctx.fillStyle = '#f2ead8';
    ctx.beginPath();
    ctx.arc(4, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (guard.mode === 'investigate') {
      ctx.fillStyle = COLOURS.gold;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', guard.x, guard.y - 20);
    }
    if (guard.mode === 'chase') {
      ctx.fillStyle = '#ff453a';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, guard.y - 20);
    }
  }
}

function drawCoins(ctx, state) {
  for (const coin of state.coins) {
    ctx.fillStyle = COLOURS.gold;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff6c9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawSmoke(ctx, state) {
  for (const smoke of state.smokes) {
    const fade = Math.min(1, smoke.left / 1.2);
    ctx.fillStyle = `rgba(200, 205, 220, ${0.5 * fade})`;
    ctx.beginPath();
    ctx.arc(smoke.x, smoke.y, smoke.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(230, 235, 245, ${0.35 * fade})`;
    ctx.beginPath();
    ctx.arc(smoke.x - 18, smoke.y + 10, smoke.r * 0.55, 0, Math.PI * 2);
    ctx.arc(smoke.x + 20, smoke.y - 12, smoke.r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer(ctx, state) {
  const p = state.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  // A hooded figure in cream and violet, facing the way they move.
  ctx.fillStyle = COLOURS.playerHood;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLOURS.player;
  ctx.beginPath();
  ctx.arc(3, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLOURS.playerHood;
  ctx.fillRect(9, -5, 7, 10); // the hood's point, showing the facing
  ctx.restore();
  if (p.sneaking) {
    ctx.strokeStyle = 'rgba(242, 234, 216, 0.5)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // Lockpick channel bar over the thief's head.
  if (p.lockpick > 0) {
    const w = 44;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(p.x - w / 2, p.y - 30, w, 7);
    ctx.fillStyle = COLOURS.gold;
    ctx.fillRect(p.x - w / 2, p.y - 30, (w * p.lockpick) / LOCKPICK_SECONDS, 7);
  }
}

function drawHud(ctx, state) {
  const pad = 12;
  // Top bar: level, alarm meter, loot, tools, clock.
  ctx.fillStyle = 'rgba(10, 12, 20, 0.82)';
  ctx.fillRect(0, 0, VIEW_W, 34);
  ctx.fillStyle = COLOURS.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(state.level.name, pad, 22);
  // Alarm meter.
  const meterX = 300;
  const meterW = 260;
  ctx.fillStyle = '#222';
  ctx.fillRect(meterX, 10, meterW, 14);
  const frac = state.alarm / ALARM_MAX;
  ctx.fillStyle = frac >= 1 ? COLOURS.alarmHot : frac >= ALARM_WARN_AT / ALARM_MAX ? COLOURS.alarmWarn : COLOURS.alarmCalm;
  ctx.fillRect(meterX, 10, meterW * frac, 14);
  ctx.strokeStyle = COLOURS.textDim;
  ctx.strokeRect(meterX + 0.5, 10.5, meterW, 14);
  ctx.fillStyle = COLOURS.text;
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('ALARM', meterX - 52, 22);
  // Tools and loot on the right.
  ctx.textAlign = 'right';
  const tools = state.tools;
  ctx.fillText(`Coins ${tools.coins}   Smoke ${tools.smoke}   EMP ${tools.emp}`, VIEW_W - 220, 22);
  ctx.fillStyle = state.hasLoot ? COLOURS.loot : COLOURS.textDim;
  ctx.fillText(state.hasLoot ? `◆ ${state.level.jewel}` : 'No loot yet', VIEW_W - pad, 22);
  // Bottom hint line.
  ctx.fillStyle = 'rgba(10, 12, 20, 0.82)';
  ctx.fillRect(0, VIEW_H - 26, VIEW_W, 26);
  ctx.fillStyle = COLOURS.textDim;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WASD / arrows move · Shift sneak · Click throws a coin · Q smoke · F EMP · E hold to pick the lock · M mute · R retry', VIEW_W / 2, VIEW_H - 9);
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(8, 9, 16, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText(title, VIEW_W / 2, VIEW_H / 2 - 70);
  ctx.fillStyle = COLOURS.text;
  ctx.font = '16px sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, VIEW_H / 2 - 24 + i * 26));
}

export function draw(ctx, state) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx);
  drawWalls(ctx, state.level);
  drawExit(ctx, state);
  drawLoot(ctx, state);
  drawCameras(ctx, state);
  drawGuards(ctx, state);
  drawCoins(ctx, state);
  drawSmoke(ctx, state);
  drawPlayer(ctx, state);
  drawHud(ctx, state);

  if (state.phase === 'title') {
    overlay(ctx, 'THE GILDED VAULT', [
      'One night. Three floors. Three jewels.',
      'Cross each room unseen, lift the jewel, and slip out the green exit.',
      'Guards patrol with lamplight cones; cameras sweep the halls.',
      'A coin distracts, smoke hides, an EMP blinds the cameras.',
      'Press Enter or click to begin the night.',
    ], COLOURS.gold);
  } else if (state.phase === 'caught') {
    overlay(ctx, 'CAUGHT', [
      'The alarm hit the roof and the guards closed in.',
      'A fair thief plans the cones before moving — watch, wait, then go.',
      'Press R to try this floor again.',
    ], COLOURS.alarmHot);
  } else if (state.phase === 'levelclear') {
    overlay(ctx, `${state.level.jewel} IS YOURS`, [
      `Take so far: $${state.totalValue.toLocaleString('en-US')} — the night goes on.`,
      'Press Enter for the next floor.',
    ], COLOURS.gold);
  } else if (state.phase === 'won') {
    overlay(ctx, 'CLEAN GETAWAY', [
      `All three jewels lifted. Total take: $${state.totalValue.toLocaleString('en-US')}.`,
      `Finished in ${Math.round(state.elapsed)} seconds, ${state.toolsUsed} tools spent.`,
      'The Meridian Museum never knew you were there. Press R to run it again.',
    ], COLOURS.exit);
  }
}
