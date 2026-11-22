// levels.js — the three floors of the Meridian Museum, each its own heist.
// A level is walls and cover (rects in tile units), guard patrol routes,
// sweeping cameras, one jewel, one exit and the thief's starting tile.
// Every floor offers more than one way through: open floor is fast and
// exposed, the cover route winds behind cases, and a narrow service lane
// stays out of every cone at the cost of speed.
export const LEVELS = [
  {
    name: 'Floor I — The Gallery',
    jewel: 'The Aurora Opal',
    value: 1200,
    start: [2, 13],
    exit: [1, 1],
    loot: [23, 2],
    locked: false,
    tools: { coins: 3, smoke: 1, emp: 1 },
    // Walls: tile rects [x, y, w, h]. The gallery's spine wall splits the
    // room; the gaps at its ends are the two routes past it.
    walls: [
      [8, 2, 1, 5],
      [10, 7, 6, 1],
      [17, 9, 1, 5],
      [4, 4, 3, 1],
      [20, 12, 3, 1],
    ],
    // Display cases and crates: solid cover that blocks movement and sight.
    cover: [
      [5, 9, 2, 1], [12, 3, 2, 1], [14, 11, 2, 1],
      [21, 6, 1, 2], [6, 13, 1, 1], [18, 4, 1, 1],
    ],
    guards: [
      { path: [[10, 5], [16, 5]], speed: 1.0 },
      { path: [[20, 4], [20, 12]], speed: 1.0 },
    ],
    cameras: [
      { x: 13, y: 0, base: Math.PI / 2, sweep: 0.9 },
    ],
  },
  {
    name: 'Floor II — The Vault Hall',
    jewel: 'The Duchess Emerald',
    value: 3400,
    start: [2, 13],
    exit: [24, 14],
    loot: [13, 2],
    locked: false,
    tools: { coins: 3, smoke: 2, emp: 1 },
    walls: [
      [6, 2, 1, 6],
      [11, 9, 1, 5],
      [16, 2, 1, 5],
      [19, 10, 4, 1],
      [8, 12, 4, 1],
    ],
    cover: [
      [3, 6, 2, 1], [9, 4, 1, 2], [14, 7, 2, 1],
      [21, 5, 1, 2], [5, 10, 1, 1], [23, 9, 1, 1], [17, 13, 2, 1],
    ],
    guards: [
      { path: [[3, 3], [9, 3], [9, 10]], speed: 1.05 },
      { path: [[14, 12], [22, 12]], speed: 1.0 },
      { path: [[18, 3], [18, 8]], speed: 1.1 },
    ],
    cameras: [
      { x: 8, y: 0, base: Math.PI / 2, sweep: 1.0 },
      { x: 25, y: 7, base: Math.PI, sweep: 0.8 },
    ],
  },
  {
    name: 'Floor III — The Strongroom',
    jewel: 'The Sun Diamond',
    value: 8000,
    start: [13, 14],
    exit: [13, 1],
    loot: [13, 7],
    locked: true, // the case needs a held lockpick, channelled with E
    tools: { coins: 4, smoke: 2, emp: 2 },
    // The strongroom is a vault in the middle of the floor: one jewel, one
    // door in, and patrols circling it on every side.
    walls: [
      [10, 4, 1, 7],
      [16, 4, 1, 7],
      [10, 4, 7, 1],
      [10, 10, 3, 1], // vault's bottom wall, door gap at tile x=13
      [14, 10, 3, 1],
      [4, 7, 3, 1],
      [19, 7, 3, 1],
    ],
    cover: [
      [3, 3, 2, 1], [21, 3, 2, 1], [3, 12, 2, 1], [21, 12, 2, 1],
      [12, 12, 1, 1], [14, 12, 1, 1],
    ],
    guards: [
      { path: [[8, 2], [18, 2]], speed: 1.1 },
      { path: [[8, 13], [18, 13]], speed: 1.1 },
      { path: [[2, 5], [2, 11]], speed: 1.0 },
      { path: [[23, 5], [23, 11]], speed: 1.0 },
    ],
    cameras: [
      { x: 13, y: 3, base: Math.PI / 2, sweep: 0.7 },
      { x: 0, y: 8, base: 0, sweep: 0.9 },
      { x: 25, y: 8, base: Math.PI, sweep: 0.9 },
    ],
  },
];

/** Total value of the night's three jewels, for the win screen. */
export const TOTAL_VALUE = LEVELS.reduce((sum, level) => sum + level.value, 0);
