(() => {
  "use strict";

  const COLORS = ["#6c5ce7", "#00b894", "#fdcb6e", "#e17055", "#74b9ff", "#a29bfe", "#ff7675"];
  const GRAVITY = 0.35;
  const DRAG = 0.99;
  const SIZE_PX = 8;
  const SPREAD_UP = -9;
  const SPREAD_X = 6;
  const SPIN_MAX = 720;
  const FADE_START = 0.7;
  const LIFETIME_MS = 1400;

  let layer = null;

  function ensureLayer() {
    if (layer && layer.isConnected) return layer;
    layer = document.createElement("div");
    layer.className = "confetti-layer";
    document.body.appendChild(layer);
    return layer;
  }

  function spawnPiece(parent, originX, originY) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.backgroundColor = COLORS[(Math.random() * COLORS.length) | 0];
    piece.style.width = SIZE_PX + "px";
    piece.style.height = (SIZE_PX * (0.4 + Math.random() * 0.8)) + "px";
    const state = {
      el: piece,
      x: originX,
      y: originY,
      vx: (Math.random() - 0.5) * 2 * SPREAD_X,
      vy: SPREAD_UP * (0.5 + Math.random()),
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * SPIN_MAX,
      born: performance.now(),
    };
    parent.appendChild(piece);
    return state;
  }

  function paint(state, progress) {
    state.el.style.transform =
      `translate(${state.x}px, ${state.y}px) rotate(${state.rot}deg)`;
    state.el.style.opacity = progress > FADE_START
      ? String(1 - (progress - FADE_START) / (1 - FADE_START))
      : "1";
  }

  function step(states, start, now) {
    const elapsed = now - start;
    let alive = false;
    for (const s of states) {
      if (!s) continue;
      s.vy += GRAVITY;
      s.vx *= DRAG;
      s.x += s.vx;
      s.y += s.vy;
      s.rot += s.vr / 60;
      const progress = (now - s.born) / LIFETIME_MS;
      if (progress >= 1) {
        s.el.remove();
        s = null;
      } else {
        alive = true;
        paint(s, progress);
      }
    }
    return alive;
  }

  function burst(originEl, count) {
    if (!originEl || count <= 0) return;
    const rect = originEl.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    const parent = ensureLayer();
    const states = [];
    for (let i = 0; i < count; i++) states.push(spawnPiece(parent, originX, originY));

    const start = performance.now();
    function tick(now) {
      if (!step(states, start, now)) return;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  window.Confetti = { burst };
})();
