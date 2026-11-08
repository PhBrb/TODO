const SWEEP_BURSTS = 25;
const SWEEP_STAGGER_MS = 60;
const SWEEP_PIECES = 2;
const FULL_PIECES = 24;
const TOTAL_MS = 3000;
const PIECE_OPTS = { vyMin: -30, vyMax: -90, vx: 25, gravity: 450, lifetimeMs: TOTAL_MS };

function barOrigin(barEl) {
  const rect = barEl.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top + rect.height / 2,
    width: rect.width,
    height: rect.height,
  };
}

function celebrateGoal(barEl, onDone) {
  const confetti = window.Confetti;
  const origin = barOrigin(barEl);
  if (!confetti || !barEl || origin.width <= 0) {
    onDone();
    return;
  }
  for (let i = 0; i < SWEEP_BURSTS; i++) {
    setTimeout(() => {
      confetti.burstAt({
        x: origin.x + (origin.width * i) / (SWEEP_BURSTS - 1),
        y: origin.y,
        width: 0,
        height: origin.height,
      }, SWEEP_PIECES, PIECE_OPTS);
    }, i * SWEEP_STAGGER_MS);
  }
  const sweepMs = (SWEEP_BURSTS - 1) * SWEEP_STAGGER_MS;
  setTimeout(() => {
    confetti.burstAt(origin, FULL_PIECES, PIECE_OPTS);
  }, sweepMs);
  setTimeout(onDone, TOTAL_MS);
}

export { celebrateGoal };
