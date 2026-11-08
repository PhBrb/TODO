const SWEEP_BURSTS = 5;
const SWEEP_STAGGER_MS = 130;
const SWEEP_PIECES = 8;
const FULL_PIECES = 24;
const FINISH_EXTRA_MS = 600;

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
      }, SWEEP_PIECES);
    }, i * SWEEP_STAGGER_MS);
  }
  const sweepMs = (SWEEP_BURSTS - 1) * SWEEP_STAGGER_MS;
  setTimeout(() => {
    confetti.burstAt(origin, FULL_PIECES);
  }, sweepMs);
  setTimeout(onDone, sweepMs + FINISH_EXTRA_MS);
}

export { celebrateGoal };
