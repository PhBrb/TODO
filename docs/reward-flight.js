(() => {
  "use strict";

  // Flies coin/gem emojis from the completed task to the balance indicators
  // in the header, with a slight stagger and an eased path.
  const FLIGHT_MS = 700;
  const STAGGER_MS = 80;
  const ARC_OFFSET = -40;
  const MAX_SIMULTANEOUS = 8;

  let layer = null;

  function ensureLayer() {
    if (layer && layer.isConnected) return layer;
    layer = document.createElement("div");
    layer.className = "reward-flight-layer";
    document.body.appendChild(layer);
    return layer;
  }

  function targetOf(el) {
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function spawnFlyer(parent, emoji, from, to, delay) {
    const flyer = document.createElement("div");
    flyer.className = "reward-flyer";
    flyer.textContent = emoji;
    parent.appendChild(flyer);
    const start = performance.now() + delay;
    function tick(now) {
      const t = Math.min(1, Math.max(0, (now - start) / FLIGHT_MS));
      if (now < start) {
        requestAnimationFrame(tick);
        return;
      }
      const eased = t * t * (3 - 2 * t);
      const x = from.x + (to.x - from.x) * eased;
      const y = from.y + (to.y - from.y) * eased + Math.sin(Math.PI * t) * ARC_OFFSET;
      const scale = 1 + Math.sin(Math.PI * t) * 0.3;
      flyer.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;
      flyer.style.opacity = t < 1 ? "1" : "0";
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        flyer.remove();
      }
    }
    requestAnimationFrame(tick);
  }

  function flyRewards(from, coins, gems, coinTargetEl, gemTargetEl) {
    const coinTarget = targetOf(coinTargetEl);
    const gemTarget = targetOf(gemTargetEl);
    if (!from || !coinTarget || !gemTarget) return;
    const parent = ensureLayer();

    const coinCount = Math.min(MAX_SIMULTANEOUS, coins);
    const gemCount = Math.min(MAX_SIMULTANEOUS, gems);
    for (let i = 0; i < coinCount; i++) {
      spawnFlyer(parent, "🪙", from, coinTarget, i * STAGGER_MS);
    }
    for (let i = 0; i < gemCount; i++) {
      spawnFlyer(parent, "💎", from, gemTarget, (coinCount + i) * STAGGER_MS);
    }
  }

  window.RewardFlight = { flyRewards, targetOf };
})();
