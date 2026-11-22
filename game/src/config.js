// config.js — the numbers and colours that shape The Gilded Vault.
// One tile is 40 px; the floor is 26 by 16 tiles (1040 x 640), drawn to fit
// the browser window. All speeds are pixels per second, all vision in pixels.
export const TILE = 40;
export const COLS = 26;
export const ROWS = 16;
export const VIEW_W = COLS * TILE;
export const VIEW_H = ROWS * TILE;

// The thief: quick on open floor, slow and hard to spot while sneaking.
export const PLAYER_RADIUS = 12;
export const PLAYER_WALK_SPEED = 155;
export const PLAYER_SNEAK_SPEED = 88;
export const PLAYER_CHASE_SPEED = 175;

// Guards patrol slowly and sprint only when the alarm is high.
export const GUARD_RADIUS = 13;
export const GUARD_PATROL_SPEED = 72;
export const GUARD_CHASE_SPEED = 152;
export const GUARD_CONE_RANGE = 205;
export const GUARD_CONE_HALF_ANGLE = 0.62; // radians, about 35 degrees
export const GUARD_SNEAK_RANGE = 135; // a sneaking thief is spotted later

// Cameras sweep a fixed arc; an EMP freezes them for a few seconds.
export const CAMERA_RANGE = 245;
export const CAMERA_CONE_HALF_ANGLE = 0.5;
export const CAMERA_SWEEP_SPEED = 0.45; // radians per second
export const EMP_DURATION = 6;

// The alarm meter: 0 calm, 100 caught. Seen fast while running, slow while
// sneaking; it drains whenever nobody can see the thief.
export const ALARM_MAX = 100;
export const ALARM_RISE_RUN = 34;
export const ALARM_RISE_WALK = 22;
export const ALARM_RISE_SNEAK = 11;
export const ALARM_FALL = 9;
export const ALARM_CHASE_AT = 60; // guards give chase above this line
export const ALARM_WARN_AT = 35; // the meter turns amber and the music warns

// Tools: a tossed coin pulls a guard to investigate, smoke blocks every eye,
// a lockpick opens the strongroom case. Each level restocks them.
export const COIN_RANGE = 320;
export const COIN_INVESTIGATE_RADIUS = 270;
export const SMOKE_RADIUS = 78;
export const SMOKE_DURATION = 4;
export const LOCKPICK_SECONDS = 2.5;

export const COLOURS = {
  floor: '#171a26',
  floorAlt: '#1b1f2e',
  wall: '#2c3145',
  wallTop: '#3d4460',
  gold: '#e8b64c',
  goldDim: '#9a7a33',
  caseGlass: '#7fd4ff',
  crate: '#5a4632',
  crateTop: '#7a6248',
  exit: '#3ddc84',
  loot: '#ffd94d',
  player: '#e8e6df',
  playerHood: '#4a3f6b',
  guard: '#c94f4f',
  guardDark: '#7e2f2f',
  cone: 'rgba(255, 214, 90, 0.20)',
  coneHot: 'rgba(255, 80, 60, 0.30)',
  cameraCone: 'rgba(255, 90, 90, 0.16)',
  smoke: 'rgba(200, 205, 220, 0.55)',
  text: '#f2ead8',
  textDim: '#a9a48f',
  alarmCalm: '#3ddc84',
  alarmWarn: '#ffb020',
  alarmHot: '#ff453a',
};
