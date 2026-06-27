// 포물선 y = a·x² + b·x 의 수학과 충돌 판정 (DOM/Canvas 비의존)

export function trajectoryY(a, b, x) {
  return a * x * x + b * x;
}

// 꼭짓점: x = -b/(2a), y = 그 지점의 높이
export function vertex(a, b) {
  if (a === 0) return null; // 직선 — 꼭짓점 없음
  const x = -b / (2 * a);
  return { x, y: trajectoryY(a, b, x) };
}

// 착지점(두 번째 x절편): a·x²+b·x=0 → x=0 또는 x=-b/a. 아치(a<0,b>0)일 때만 유효.
export function landingX(a, b) {
  if (a >= 0 || b <= 0) return null;
  return -b / a;
}

// 궤적 표본점 [{x,y}] — x=0부터 착지점(또는 xMax)까지
export function samplePath(a, b, xMax, step = 0.5) {
  const land = landingX(a, b);
  const end = land != null ? Math.min(land, xMax) : xMax;
  const points = [];
  for (let x = 0; x < end; x += step) {
    points.push({ x, y: trajectoryY(a, b, x) });
  }
  points.push({ x: end, y: trajectoryY(a, b, end) });
  return points;
}

// 표적 명중: 표본점 중 하나라도 표적 중심에서 반경 r 이내
export function hitsTarget(points, target) {
  return points.some((pt) => {
    const dx = pt.x - target.x;
    const dy = pt.y - target.y;
    return Math.hypot(dx, dy) <= target.r;
  });
}

// 장애물 충돌: 표본점이 사각형 {x, w, bottom, top} 내부를 지나면 true
export function hitsObstacle(points, o) {
  return points.some(
    (pt) => pt.x >= o.x && pt.x <= o.x + o.w && pt.y >= o.bottom && pt.y <= o.top
  );
}

// 한 발 평가: 장애물에 막히지 않고 표적을 맞히면 승리
export function evaluateShot(a, b, level, xMax, step = 0.5) {
  const points = samplePath(a, b, xMax, step);
  const blocked = (level.obstacles || []).some((o) => hitsObstacle(points, o));
  const win = !blocked && hitsTarget(points, level.target);
  return { win, blocked, points };
}
