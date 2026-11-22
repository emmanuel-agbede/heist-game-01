// main.js — The Gilded Vault: one night, three floors, three jewels.
// The state machine is title -> playing -> (caught | levelclear) -> won.
// While playing, every guard and camera that can see the thief pushes the
// alarm up; hidden, it drains. At 100 the night ends in the caught screen.
// Lifting the jewel lights the green exit; reaching it clears the floor.
import { TILE, VIEW_W, VIEW_H, ALARM_MAX, ALARM_RISE_RUN, ALARM_RISE_WALK, ALARM_RISE_SNEAK, ALARM_FALL, ALARM_WARN_AT, COIN_INVESTIGATE_RADIUS, LOCKPICK_SECONDS } from './config.js';
import { LEVELS } from './levels.js';
import { solidRects } from './vision.js';
import { makeGuard, makeCamera, updateGuard, updateCamera, distractGuards, empCameras } from './guard.js';
import { makePlayer, updatePlayer, coinTarget, makeSmoke } from './player.js';
import { makeInput, consumePress, endFrame } from './input.js';
import { unlockAudio, toggleMute, sfx } from './audio.js';
import { draw } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

function buildLevel(index) {
  const level = LEVELS[index];
  return {
    level,
    levelIndex: index,
    phase: 'title',
    time: 0,
    elapsed: 0,
    alarm: 0,
    hasLoot: false,
    totalValue: LEVELS.slice(0, index).reduce((sum, l) => sum + l.value, 0),
    tools: { ...level.tools },
    toolsUsed: 0,
    maxAlarm: 0, // seconds the alarm has sat pinned at its peak
    player: makePlayer(level.start),
    guards: level.guards.map(makeGuard),
    cameras: level.cameras.map(makeCamera),
    rects: solidRects(level),
    loot: { x: (level.loot[0] + 0.5) * TILE, y: (level.loot[1] + 0.5) * TILE },
    exit: { x: (level.exit[0] + 0.5) * TILE, y: (level.exit[1] + 0.5) * TILE },
    smokes: [],
    coins: [],
    warned: false,
  };
}

let state = buildLevel(0);
const input = makeInput(canvas);

function setStatus(text) {
  if (status) status.textContent = text;
}

function startLevel(index) {
  state = buildLevel(index);
  state.phase = 'playing';
  setStatus(`${state.level.name}. Steal ${state.level.jewel} and reach the exit.`);
}

function startGame() {
  startLevel(0);
  sfx.pickup();
}

function useCoin(click) {
  if (state.tools.coins <= 0) return;
  const target = coinTarget(state.player, click.x, click.y);
  state.tools.coins -= 1;
  state.toolsUsed += 1;
  state.coins.push({ x: target.x, y: target.y, left: 1.2 });
  distractGuards(state.guards, target.x, target.y, COIN_INVESTIGATE_RADIUS);
  sfx.coin();
}

function useSmoke() {
  if (state.tools.smoke <= 0) return;
  state.tools.smoke -= 1;
  state.toolsUsed += 1;
  state.smokes.push(makeSmoke(state.player));
  sfx.smoke();
}

function useEmp() {
  if (state.tools.emp <= 0) return;
  state.tools.emp -= 1;
  state.toolsUsed += 1;
  empCameras(state.cameras);
  sfx.emp();
}

function update(dt) {
  if (state.phase !== 'playing') return;
  state.time += dt;
  state.elapsed += dt;

  // Tools, one press each.
  if (consumePress(input, 'q')) useSmoke();
  if (consumePress(input, 'f')) useEmp();
  if (consumePress(input, 'm')) toggleMute();
  for (const click of input.clicks) {
    unlockAudio();
    useCoin(click);
  }

  // The thief moves; the lockpick only channels while E is held still.
  const moved = updatePlayer(state.player, dt, input.keys, state.rects, { w: VIEW_W, h: VIEW_H });
  const nearLoot = Math.hypot(state.player.x - state.loot.x, state.player.y - state.loot.y) < TILE * 0.9;
  if (state.level.locked && !state.hasLoot && nearLoot && input.keys.has('e') && !moved) {
    state.player.lockpick += dt;
    if (Math.floor(state.player.lockpick * 8) !== Math.floor((state.player.lockpick - dt) * 8)) sfx.lockpick();
    if (state.player.lockpick >= LOCKPICK_SECONDS) {
      state.hasLoot = true;
      state.totalValue += state.level.value;
      setStatus(`${state.level.jewel} lifted. Get to the green exit.`);
      sfx.pickup();
    }
  } else {
    state.player.lockpick = 0;
    if (!state.level.locked && !state.hasLoot && nearLoot) {
      state.hasLoot = true;
      state.totalValue += state.level.value;
      setStatus(`${state.level.jewel} lifted. Get to the green exit.`);
      sfx.pickup();
    }
  }

  // Guards and cameras watch; the alarm answers what they see.
  let seen = false;
  for (const guard of state.guards) {
    updateGuard(guard, dt, state.player, state.rects, state.smokes, state.alarm);
    if (guard.seen) seen = true;
  }
  for (const camera of state.cameras) {
    updateCamera(camera, dt, state.player, state.rects, state.smokes);
    if (camera.seen) seen = true;
  }
  if (seen) {
    const rate = state.player.sneaking ? ALARM_RISE_SNEAK : state.player.running ? ALARM_RISE_RUN : ALARM_RISE_WALK;
    state.alarm = Math.min(ALARM_MAX, state.alarm + rate * dt);
  } else {
    state.alarm = Math.max(0, state.alarm - ALARM_FALL * dt);
  }
  if (state.alarm >= ALARM_WARN_AT && !state.warned) {
    state.warned = true;
    setStatus('The alarm is climbing — break line of sight!');
    sfx.warn();
  }
  if (state.alarm < ALARM_WARN_AT) state.warned = false;

  // Smoke and tossed coins fade.
  for (const smoke of state.smokes) smoke.left -= dt;
  state.smokes = state.smokes.filter((s) => s.left > 0);
  for (const coin of state.coins) coin.left -= dt;
  state.coins = state.coins.filter((c) => c.left > 0);

  // Caught: the alarm pinned at its peak means lockdown. A guard closing
  // in ends it at once; otherwise the thief gets five seconds at the peak
  // to break sight and let the meter drain — the caught moment is a
  // chase the player can see coming, never a silent timer.
  if (state.alarm >= ALARM_MAX) {
    state.maxAlarm += dt;
    const closedIn = state.guards.some((g) => Math.hypot(g.x - state.player.x, g.y - state.player.y) < TILE * 1.6);
    if (closedIn || state.maxAlarm > 5) {
      state.phase = 'caught';
      setStatus('Caught! Press R to try this floor again.');
      sfx.caught();
      return;
    }
  } else {
    state.maxAlarm = 0;
  }

  // The getaway: jewel in hand, standing on the green exit.
  if (state.hasLoot && Math.hypot(state.player.x - state.exit.x, state.player.y - state.exit.y) < TILE * 0.7) {
    if (state.levelIndex + 1 >= LEVELS.length) {
      state.phase = 'won';
      setStatus(`Clean getaway. Total take $${state.totalValue.toLocaleString('en-US')}.`);
      sfx.win();
    } else {
      state.phase = 'levelclear';
      setStatus(`${state.level.jewel} secured. Press Enter for the next floor.`);
      sfx.win();
    }
  }
}

// Deterministic screenshot states: ?shot=start|play|caught|end freezes the
// game in one composed frame of the real game, drawn by the same code.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  applyShot(state, shot);
  draw(ctx, state);
  setStatus(`Screenshot scene: ${shot}.`);
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    unlockAudio();
    if (state.phase === 'title' && (consumePress(input, 'enter') || input.clicks.length > 0)) {
      startGame();
    } else if (state.phase === 'caught' && consumePress(input, 'r')) {
      startLevel(state.levelIndex);
    } else if (state.phase === 'levelclear' && consumePress(input, 'enter')) {
      startLevel(state.levelIndex + 1);
    } else if (state.phase === 'won' && consumePress(input, 'r')) {
      startGame();
    } else {
      update(dt);
    }
    draw(ctx, state);
    endFrame(input);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
