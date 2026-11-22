// input.js — keyboard and mouse, in game coordinates.
// Keys are kept as a set of lowercase names; mouse clicks arrive as a
// queue of canvas points (the canvas is scaled to the window, so a click is
// mapped back into the 1040 x 640 floor). One-shot actions (coin, smoke,
// EMP, lockpick, restart) are consumed by main.js each frame.
import { VIEW_W, VIEW_H } from './config.js';

export function makeInput(canvas) {
  const input = {
    keys: new Set(),
    clicks: [], // {x, y} in floor coordinates, oldest first
    pressed: new Set(), // keys pressed since the last frame, then cleared
  };

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    if (!event.repeat) input.pressed.add(key);
    input.keys.add(key);
  });
  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.key.toLowerCase());
  });
  window.addEventListener('blur', () => input.keys.clear());

  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.clicks.push({
      x: ((event.clientX - rect.left) / rect.width) * VIEW_W,
      y: ((event.clientY - rect.top) / rect.height) * VIEW_H,
    });
  });

  return input;
}

/** Take one pressed key out of this frame's set, if it was pressed. */
export function consumePress(input, key) {
  if (!input.pressed.has(key)) return false;
  input.pressed.delete(key);
  return true;
}

/** Clear the per-frame presses and any unhandled clicks. */
export function endFrame(input) {
  input.pressed.clear();
  input.clicks.length = 0;
}
