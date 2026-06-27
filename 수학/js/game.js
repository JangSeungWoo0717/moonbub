// 게임 상태 머신 (DOM 비의존)
import { evaluateShot } from "./physics.js";
import { LEVELS, WORLD, starRating } from "./levels.js";

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

// 한 발 발사: 시도 증가, 평가, 승리 시 별점 기록
export function fire(state, a, b) {
  const level = currentLevel(state);
  state.attempts += 1;
  const result = evaluateShot(a, b, level, WORLD.W, 0.25);
  if (result.win) {
    state.status = "won";
    const stars = starRating(state.attempts);
    state.stars[level.id] = Math.max(state.stars[level.id] ?? 0, stars);
  }
  return result;
}

export function hasNext(state) {
  return state.index < state.levels.length - 1;
}

// 다음 레벨로. 성공 시 true, 마지막이면 false.
export function nextLevel(state) {
  if (!hasNext(state)) return false;
  state.index += 1;
  state.attempts = 0;
  state.status = "aiming";
  return true;
}

// 특정 레벨로 이동(레벨 선택)
export function goToLevel(state, index) {
  if (index < 0 || index >= state.levels.length) return false;
  state.index = index;
  state.attempts = 0;
  state.status = "aiming";
  return true;
}
