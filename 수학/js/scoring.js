// 별점 계산 (순수). 클리어 기본 1점 + 코인 전부 +1 + par 이내 +1 = 최대 3.

export function computeStars({ attempts, par, coinsTotal, coinsGot, allHit }) {
  if (!allHit) return 0;
  let stars = 1;
  if (coinsTotal === 0 || coinsGot >= coinsTotal) stars += 1;
  if (attempts <= par) stars += 1;
  return Math.min(stars, 3);
}

// 별점 조건 설명(HUD 안내용)
export function starGoals(level) {
  const goals = ["표적 전부 명중"];
  if ((level.coins || []).length > 0) goals.push(`코인 ${level.coins.length}개 모두 수집`);
  goals.push(`${level.par}번 이내 성공`);
  return goals;
}
