(() => {
  "use strict";

  // Reward flight: coins/gems pop in at the completed task, hold for a
  // moment, then get pulled to the balance indicator like a magnet. The
  // destination is clamped into the visible viewport, because the header
  // balance can be scrolled out of view.
  const POP_IN_MS = 200;
  const HOLD_MS = 1000;
  const MAGNET_ACCEL = 9000;
  const MAGNET_MAX_SPEED = 2600;
  const ARRIVAL_RADIUS = 6;
  const COIN_DIVISOR = 3;
  const MAX_SIMULTANEOUS = 8;

  let layer = null;

  function ensureLayer() {
    if (layer && layer.isConnected) return layer;
    layer = document.createElement("div");
    layer.className = "reward-flight-layer";
    document.body.appendChild(layer);
    return layer;
  }

  function centerOf(el) {
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function clampToViewport(point) {
    const margin = 16;
    return {
      x: Math.min(window.innerWidth - margin, Math.max(margin, point.x)),
      y: Math.min(window.innerHeight - margin, Math.max(margin, point.y)),
    };
  }

  function spawnFlyer(parent, emoji, from, to) {
    const flyer = document.createElement("div");
    flyer.className = "reward-flyer";
    flyer.textContent = emoji;
    flyer.style.transform = `translate(${from.x}px, ${from.y}px) translate(-50%, -50%) scale(0)`;
    parent.appendChild(flyer);
    const state = {
      el: flyer,
      x: from.x,
      y: from.y,
      vx: 0,
      vy: 0,
      phase: "pop",
      phaseStart: performance.now(),
      to,
    };

    function tick(now) {
      const phaseAge = now - state.phaseStart;
      if (state.phase === "pop") {
        const t = Math.min(1, phaseAge / POP_IN_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        const scale = eased;
        flyer.style.transform =
          `translate(${state.x}px, ${state.y}px) translate(-50%, -50%) scale(${scale})`;
        if (t >= 1) {
          state.phase = "hold";
          state.phaseStart = now;
        }
      } else if (state.phase === "hold") {
        if (phaseAge >= HOLD_MS) {
          state.phase = "magnet";
          state.phaseStart = now;
        }
      } else {
        const dt = Math.min(0.05, (now - (state.last ?? now)) / 1000);
        state.last = now;
        const dx = state.to.x - state.x;
        const dy = state.to.y - state.y;
        const dist = Math.hypot(dx, dy) || 1;
        state.vx += (dx / dist) * MAGNET_ACCEL * dt;
        state.vy += (dy / dist) * MAGNET_ACCEL * dt;
        const speed = Math.hypot(state.vx, state.vy);
        if (speed > MAGNET_MAX_SPEED) {
          state.vx = (state.vx / speed) * MAGNET_MAX_SPEED;
          state.vy = (state.vy / speed) * MAGNET_MAX_SPEED;
        }
        state.x += state.vx * dt;
        state.y += state.vy * dt;
        flyer.style.transform =
          `translate(${state.x}px, ${state.y}px) translate(-50%, -50%) scale(1)`;
        if (Math.hypot(state.to.x - state.x, state.to.y - state.y) < ARRIVAL_RADIUS) {
          flyer.remove();
          return;
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function flyRewards(from, coins, gems, coinTargetEl, gemTargetEl) {
    if (!from) return;
    const coinTarget = clampToViewport(centerOf(coinTargetEl) || from);
    const gemTarget = clampToViewport(centerOf(gemTargetEl) || from);
    const parent = ensureLayer();

    const coinCount = Math.min(MAX_SIMULTANEOUS, Math.floor(coins / COIN_DIVISOR));
    const gemCount = Math.min(MAX_SIMULTANEOUS, gems);
    for (let i = 0; i < coinCount; i++) {
      spawnFlyer(parent, "🪙", from, coinTarget);
    }
    for (let i = 0; i < gemCount; i++) {
      spawnFlyer(parent, "💎", from, gemTarget);
    }
  }

  window.RewardFlight = { flyRewards };
})();
