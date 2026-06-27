// 포물선 y = a·x² + b·x 의 수학과 충돌 판정 (DOM/Canvas 비의존)

export function trajectoryY(a, b, x) {
  return a * x * x + b * x;
}

// 꼭짓점: x = -b/(2a)
export function vertex(a, b) {
  if (a === 0) return null;
  const x = -b / (2 * a);
  return { x, y: trajectoryY(a, b, x) };
}

// 착지점(두 번째 x절편): a<0,b>0 일 때 -b/a
export function landingX(a, b) {
  if (a >= 0 || b <= 0) return null;
  return -b / a;
}

// 발사 벡터(vx,vy)와 중력 g → 이차함수 계수. y = (vy/vx)x - (g/2vx²)x²
export function velocityToCoeffs(vx, vy, g) {
  const safeVx = Math.max(vx, 0.001);
  return { a: -g / (2 * safeVx * safeVx), b: vy / safeVx };
}

// 궤적 표본점 [{x,y}] — 원점부터 착지점(또는 xMax)까지
export function samplePath(a, b, xMax, step = 0.4) {
  const land = landingX(a, b);
  const end = land != null ? Math.min(land, xMax) : xMax;
  const points = [];
  for (let x = 0; x < end; x += step) {
    points.push({ x, y: trajectoryY(a, b, x) });
  }
  points.push({ x: end, y: trajectoryY(a, b, end) });
  return points;
}

// 표본점 중 하나라도 원 {x,y,r} 안을 지나는 첫 인덱스 (없으면 -1)
export function firstHitIndex(points, c) {
  for (let i = 0; i < points.length; i += 1) {
    if (Math.hypot(points[i].x - c.x, points[i].y - c.y) <= c.r) return i;
  }
  return -1;
}

export function hitsCircle(points, c) {
  return firstHitIndex(points, c) !== -1;
}

// 사각 장애물 {x,w,bottom,top} 내부를 지나면 true
export function hitsObstacle(points, o) {
  return points.some(
    (pt) => pt.x >= o.x && pt.x <= o.x + o.w && pt.y >= o.bottom && pt.y <= o.top
  );
}

// 한 발 종합 평가: 다중 표적 + 코인 + 장애물
export function evaluateShot(a, b, level, xMax, step = 0.4) {
  const points = samplePath(a, b, xMax, step);
  const blocked = (level.obstacles || []).some((o) => hitsObstacle(points, o));
  const targets = level.targets || [];
  const coins = level.coins || [];
  const hitTargets = targets.map((t) => !blocked && hitsCircle(points, t));
  const coinsGot = coins.map((c) => !blocked && hitsCircle(points, c));
  const allHit = !blocked && targets.length > 0 && hitTargets.every(Boolean);
  return {
    points, blocked, hitTargets, coinsGot, allHit,
    coinsCount: coinsGot.filter(Boolean).length,
  };
}
