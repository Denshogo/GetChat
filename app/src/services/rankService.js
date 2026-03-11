import { RANK_THRESHOLDS } from "../constants.js";

export function getCurrentRank(points) {
  let current = RANK_THRESHOLDS[0];

  for (const threshold of RANK_THRESHOLDS) {
    if (points >= threshold.minPoints) {
      current = threshold;
    }
  }

  return current;
}

export function getProgressToNextRank(points) {
  const current = getCurrentRank(points);
  const currentIndex = RANK_THRESHOLDS.findIndex((rank) => rank.name === current.name);

  if (currentIndex === RANK_THRESHOLDS.length - 1) {
    return {
      current,
      next: null,
      rate: 1,
    };
  }

  const next = RANK_THRESHOLDS[currentIndex + 1];
  const span = next.minPoints - current.minPoints;
  const progressed = points - current.minPoints;

  return {
    current,
    next,
    rate: span === 0 ? 1 : Math.max(0, Math.min(1, progressed / span)),
  };
}
