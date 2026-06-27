// 몬테카를로 시뮬레이션 (순수: rng 주입). 목표 획득까지 뽑은 횟수를 시행마다 기록.

// 한 시행: 목표 확률 p, 천장 pity. 목표를 얻을 때까지 뽑은 횟수 반환.
export function simulateOnce(rng, p, pity) {
  let draws = 0;
  while (true) {
    draws += 1;
    if (rng() < p) return draws;
    if (pity && draws >= pity) return draws; // 천장 보장
  }
}

// runs회 반복 → 통계와 히스토그램
export function simulate(rng, p, pity, runs) {
  const trials = [];
  for (let i = 0; i < runs; i += 1) {
    trials.push(simulateOnce(rng, p, pity));
  }
  const n = trials.length;
  const mean = trials.reduce((s, v) => s + v, 0) / n;
  const variance = trials.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  const min = Math.min(...trials);
  const max = Math.max(...trials);
  return { trials, mean, std, min, max, histogram: buildHistogram(trials, 12) };
}

// 균등 폭 구간 히스토그램
export function buildHistogram(trials, bins) {
  const min = Math.min(...trials);
  const max = Math.max(...trials);
  if (max === min) return [{ bucket: `${min}`, count: trials.length }];
  const width = (max - min) / bins;
  const counts = new Array(bins).fill(0);
  for (const v of trials) {
    let idx = Math.floor((v - min) / width);
    if (idx >= bins) idx = bins - 1;
    counts[idx] += 1;
  }
  return counts.map((count, i) => {
    const lo = Math.round(min + i * width);
    const hi = Math.round(min + (i + 1) * width);
    return { bucket: `${lo}-${hi}`, count };
  });
}
