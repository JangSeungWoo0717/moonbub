// 순수 확률 계산 모듈 (DOM/브라우저 전역 비의존)

// N번 시도 중 목표를 1개 이상 얻을 확률 (여사건)
export function atLeastOnce(p, n) {
  if (p <= 0 || n <= 0) return 0;
  if (p >= 1) return 1;
  return 1 - Math.pow(1 - p, n);
}

// 기대 뽑기 수 (천장 없음, 기하분포의 기댓값)
export function expectedTrials(p) {
  if (p <= 0) return Infinity;
  return 1 / p;
}

// 누적확률이 q 이상이 되는 최소 시도 수
export function drawsForProbability(p, q) {
  if (p <= 0) return Infinity;
  if (p >= 1) return 1;
  if (q <= 0) return 0;
  if (q >= 1) return Infinity;
  return Math.ceil(Math.log(1 - q) / Math.log(1 - p));
}

// 누적확률 곡선 [{n, prob}] (n = 1..maxN)
export function cumulativeCurve(p, maxN) {
  const points = [];
  for (let n = 1; n <= maxN; n += 1) {
    points.push({ n, prob: atLeastOnce(p, n) });
  }
  return points;
}

// 천장(H) 적용 기대 뽑기 수: H번째에는 목표가 보장됨
export function expectedWithPity(p, pity) {
  if (!pity || pity <= 0) return expectedTrials(p);
  if (p >= 1) return 1;
  let expected = 0;
  let reachProb = 1; // 직전 시도까지 실패로 이 시도에 도달할 확률 (1-p)^(k-1)
  for (let k = 1; k < pity; k += 1) {
    expected += k * reachProb * p; // k번째에서 첫 성공
    reachProb *= 1 - p;
  }
  // pity번째: 여기까지 실패로 도달하면 보장 획득
  expected += pity * reachProb;
  return expected;
}
