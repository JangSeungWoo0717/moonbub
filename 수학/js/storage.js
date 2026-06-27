const KEY = "parabola_progress";
const defaultStore = () => globalThis.localStorage;

export function loadProgress(store = defaultStore()) {
  try {
    const raw = store.getItem(KEY);
    if (!raw) return { cleared: {} };
    const parsed = JSON.parse(raw);
    return parsed && parsed.cleared ? parsed : { cleared: {} };
  } catch {
    return { cleared: {} };
  }
}

export function saveProgress(progress, store = defaultStore()) {
  store.setItem(KEY, JSON.stringify(progress));
  return progress;
}

// 레벨 클리어 기록 — 별점은 최고값 유지
export function recordClear(levelId, stars, store = defaultStore()) {
  const progress = loadProgress(store);
  progress.cleared[levelId] = Math.max(progress.cleared[levelId] ?? 0, stars);
  saveProgress(progress, store);
  return progress;
}

export function clearProgress(store = defaultStore()) {
  store.removeItem(KEY);
}
