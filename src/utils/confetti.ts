import confetti from "canvas-confetti";

const BRUT_PALETTE = ["#1FAE6E", "#FF3EA5", "#2B5FFF", "#FFE347", "#14110D"];

export function fireCompletionBurst(originX?: number, originY?: number) {
  const origin =
    originX !== undefined && originY !== undefined
      ? { x: originX / window.innerWidth, y: originY / window.innerHeight }
      : { x: 0.5, y: 0.4 };

  const shared = {
    colors: BRUT_PALETTE,
    disableForReducedMotion: true,
    ticks: 140,
  };

  confetti({ ...shared, particleCount: 40, spread: 55, startVelocity: 32, angle: 60, origin });
  confetti({ ...shared, particleCount: 40, spread: 55, startVelocity: 32, angle: 120, origin });
  setTimeout(() => {
    confetti({
      ...shared,
      particleCount: 60,
      spread: 100,
      startVelocity: 40,
      scalar: 0.9,
      origin,
    });
  }, 150);
}
