// 게임 상태 머신 (DOM 비의존)
import { evaluateShot } from "./physics.js";
import { computeStars } from "./scoring.js";
import { LEVELS, WORLD } from "./levels.js";

export function createGame(levels = LEVELS) {
  return {
    levels,
    index: 0,
    attempts: 0,
    status: "aiming", // aiming | won
    stars: {}, // levelId -> stars
  };
}

export function currentLevel(state) {
  return state.levels[state.index];
}

// 한 발 발사: 시도 증가, 평가, 승리 시 별점 계산·기록
export function fire(state, a, b) {
  const level = currentLevel(state);
  state.attempts += 1;
  const result = evaluateShot(a, b, level, WORLD.W, 0.2);
  if (result.allHit) {
    state.status = "won";
    const stars = computeStars({
      attempts: state.attempts,
      par: level.par,
      coinsTotal: (level.coins || []).length,
      coinsGot: result.coinsCount,
      allHit: true,
    });
    state.stars[level.id] = Math.max(state.stars[level.id] ?? 0, stars);
    result.stars = stars;
  }
  return result;
}

export function hasNext(state) {
  return state.index < state.levels.length - 1;
}

export function nextLevel(state) {
  if (!hasNext(state)) return false;
  state.index += 1;
  state.attempts = 0;
  state.status = "aiming";
  return true;
}

export function goToLevel(state, index) {
  if (index < 0 || index >= state.levels.length) return false;
  state.index = index;
  state.attempts = 0;
  state.status = "aiming";
  return true;
}

export function totalStars(state) {
  return Object.values(state.stars).reduce((s, v) => s + v, 0);
}
