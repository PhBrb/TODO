(() => {
  "use strict";

  // Realistic confetti: quadratic air resistance (a = g - k * v * |v|),
  // semi-implicit Euler with real frame time, pieces spawned across the
  // full width of the completed task row.
  const COLORS = ["#6c5ce7", "#00b894", "#fdcb6e", "#e17055", "#74b9ff", "#a29bfe", "#ff7675"];
  const GRAVITY = 130;
  const DRAG_COEFFICIENT = 0.009;
  const SIZE_PX = 8;
  const LAUNCH_VY_MIN = -70;
  const LAUNCH_VY_MAX = -115;
  const LAUNCH_VX = 6;
  const SPIN_MAX_DEG_S = 90;
  const FADE_START = 0.75;
  const LIFETIME_MS = 22000;
  const MAX_DT_S = 0.05;

  let layer = null;
  let behindLayer = null;

  // Pieces spawn inside the scrollable sheet content, before the task list
  // in paint order, so the completed task row covers them (thrown from
  // behind). Once a piece rises above the row it is promoted to the
  // viewport-level front layer, converting coordinates back, so the fall
  // happens in front of the sheet.
  function ensureLayer() {
    if (layer && layer.isConnected) return layer;
    layer = document.createElement("div");
    layer.className = "confetti-layer";
    document.body.appendChild(layer);
    return layer;
  }

  function ensureBehindLayer() {
    if (behindLayer && behindLayer.isConnected) return behindLayer;
    behindLayer = document.createElement("div");
    behindLayer.className = "confetti-behind-layer";
    const scroller = document.querySelector(".sheet-content");
    if (!scroller) return ensureLayer();
    scroller.insertBefore(behindLayer, scroller.firstChild);
    return behindLayer;
  }

  function scrollOffset() {
    const scroller = document.querySelector(".sheet-content");
    return scroller ? scroller.scrollTop : 0;
  }

  function spawnPiece(parent, origin, spreadFraction) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.backgroundColor = COLORS[(Math.random() * COLORS.length) | 0];
    piece.style.width = SIZE_PX + "px";
    piece.style.height = (SIZE_PX * (0.4 + Math.random() * 0.8)) + "px";
    const state = {
      el: piece,
      x: origin.x + spreadFraction * origin.width,
      y: origin.y + (Math.random() - 0.5) * origin.height,
      vx: (Math.random() - 0.5) * 2 * LAUNCH_VX,
      vy: LAUNCH_VY_MIN - Math.random() * (LAUNCH_VY_MAX - LAUNCH_VY_MIN),
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 2 * SPIN_MAX_DEG_S,
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

  function step(states, dt, now) {
    let alive = false;
    for (const s of states) {
      if (!s) continue;
      const speed = Math.hypot(s.vx, s.vy);
      const drag = DRAG_COEFFICIENT * speed;
      s.vx -= s.vx * drag * dt;
      s.vy += (GRAVITY - s.vy * drag) * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rot += s.vr * dt;
      const progress = (now - s.born) / LIFETIME_MS;
      if (progress >= 1) {
        s.el.remove();
      } else {
        alive = true;
        paint(s, progress);
      }
    }
    return alive;
  }

  function burstAt(origin, count) {
    if (
      !origin ||
      !Number.isFinite(origin.x) ||
      !Number.isFinite(origin.y) ||
      count <= 0
    ) {
      return;
    }
    const parent = ensureBehindLayer();
    const front = ensureLayer();
    const top = scrollOffset();
    const promoteY = origin.y - origin.height / 2;
    const states = [];
    for (let i = 0; i < count; i++) {
      const spreadFraction = count === 1 ? 0 : (i / (count - 1)) * 2 - 1;
      const state = spawnPiece(parent, origin, spreadFraction);
      state.promoted = false;
      state.y += top; // into behind-layer (sheet-content) local space
      states.push(state);
    }

    let last = performance.now();
    function tick(now) {
      const dt = Math.min(MAX_DT_S, (now - last) / 1000);
      last = now;
      for (const s of states) {
        if (!s.promoted && s.y <= promoteY + top) {
          s.promoted = true;
          s.y -= top; // back to viewport space for the front layer
          if (s.el.parentNode !== front) front.appendChild(s.el);
        }
      }
      if (!step(states, dt, now)) return;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function originOf(el) {
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top + rect.height / 2,
      width: rect.width,
      height: rect.height,
    };
  }

  function burst(originEl, count) {
    burstAt(originOf(originEl), count);
  }

  window.Confetti = { burst, burstAt, originOf };
})();
