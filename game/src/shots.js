// shots.js — deterministic posed scenes for the maker's screenshots.
// Opening the game with ?shot=<name> freezes play in a composed moment of
// the real game (same code, same rendering), so the screenshots in
// screenshots/ are honest renders of The Gilded Vault itself, taken in a
// browser:
//   start  — the title over Floor I, thief at the door, a cone sweeping
//   play   — mid-heist on Floor I: the thief crossing open floor between
//            two cones, a camera sweeping, the jewel glowing, alarm rising
//   caught — the alarm full, a guard closing in on the thief
//   end    — the getaway: jewel in hand, the thief at the green exit
import { TILE } from './config.js';

function place(entity, tx, ty, angle) {
  entity.x = (tx + 0.5) * TILE;
  entity.y = (ty + 0.5) * TILE;
  if (angle !== undefined) entity.angle = angle;
}

export function applyShot(state, name) {
  state.time = 1.25; // one frozen moment, jewel glow and exit pulse mid-beat
  if (name === 'play') {
    state.phase = 'playing';
    place(state.player, 12, 8, 0);
    state.player.moving = true;
    place(state.guards[0], 13, 5, Math.PI / 2);
    state.guards[0].mode = 'investigate';
    place(state.guards[1], 20, 9, Math.PI);
    state.cameras[0].angle = Math.PI / 2 + 0.5;
    state.alarm = 42;
    return;
  }
  if (name === 'caught') {
    state.phase = 'caught';
    place(state.player, 14, 6, Math.PI / 2);
    place(state.guards[0], 14, 4, Math.PI / 2);
    state.guards[0].mode = 'chase';
    place(state.guards[1], 18, 8, Math.PI);
    state.alarm = 100;
    return;
  }
  if (name === 'end') {
    state.phase = 'won';
    state.hasLoot = true;
    state.totalValue = 12600;
    state.elapsed = 214;
    state.toolsUsed = 5;
    place(state.player, 2, 1, -Math.PI / 2);
    place(state.guards[0], 12, 5, 0);
    place(state.guards[1], 19, 11, -Math.PI / 2);
    state.alarm = 8;
    return;
  }
  // Any other name, including 'start', is the title screen.
  state.phase = 'title';
}
