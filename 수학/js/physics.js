// 포물선 y = a·x² + b·x 의 수학과 충돌 판정 (DOM/Canvas 비의존)
// 바운스: 착지 때마다 수평속도 유지(=같은 a), 상승 기울기 b는 e배로 감쇠(등비수열).

export function trajectoryY(a, b, x) {
  return a * x * x + b * x;
}

export function vertex(a, b) {
  if (a === 0) return null;
  const x = -b / (2 * a);
  return { x, y: trajectoryY(a, b, x) };
}

export function landingX(a, b) {
  if (a >= 0 || b <= 0) return null;
  return -b / a;
}

// 발사 벡터(vx,vy)와 중력 g → 이차함수 계수
export function velocityToCoeffs(vx, vy, g) {
  const safeVx = Math.max(vx, 0.001);
  return { a: -g / (2 * safeVx * safeVx), b: vy / safeVx };
}

// 바운스 구간 목록 [{x0, bk, end}]. 각 구간 내 y = a·(x-x0)² + bk·(x-x0).
export function bounceSegments(a, b, xMax, bounces = 0, e = 0) {
  const segs = [];
  let x0 = 0;
  let bk = b;
  for (let k = 0; k <= bounces; k += 1) {
    if (a < 0 && bk > 0) {
      const L = -bk / a;
      const end = Math.min(x0 + L, xMax);
      segs.push({ x0, bk, end });
      if (x0 + L >= xMax || e <= 0) break;
      x0 += L;
      bk *= e;
    } else {
      segs.push({ x0, bk, end: xMax });
      break;
    }
  }
  return segs;
}

// 바운스를 포함한 전체 궤적 표본점
export function samplePathBounce(a, b, xMax, bounces = 0, e = 0, step = 0.4) {
  const segs = bounceSegments(a, b, xMax, bounces, e);
  const points = [];
  for (const s of segs) {
    for (let x = s.x0; x < s.end; x += step) {
      points.push({ x, y: a * (x - s.x0) * (x - s.x0) + s.bk * (x - s.x0) });
    }
    points.push({ x: s.end, y: a * (s.end - s.x0) * (s.end - s.x0) + s.bk * (s.end - s.x0) });
  }
  return points;
}

// 바운스 경로 위 특정 x의 높이 (레벨 설계용)
export function pointOnPathBounce(a, b, x, bounces = 0, e = 0) {
  const segs = bounceSegments(a, b, 1e9, bounces, e);
  for (const s of segs) {
    if (x >= s.x0 - 1e-9 && x <= s.end + 1e-9) {
      return a * (x - s.x0) * (x - s.x0) + s.bk * (x - s.x0);
    }
  }
  const last = segs[segs.length - 1];
  return a * (x - last.x0) * (x - last.x0) + last.bk * (x - last.x0);
}

// 단일 아치(바운스 없음) — 하위 호환
export function samplePath(a, b, xMax, step = 0.4) {
  return samplePathBounce(a, b, xMax, 0, 0, step);
}

export function firstHitIndex(points, c) {
  for (let i = 0; i < points.length; i += 1) {
    if (Math.hypot(points[i].x - c.x, points[i].y - c.y) <= c.r) return i;
  }
  return -1;
}

export function hitsCircle(points, c) {
  return firstHitIndex(points, c) !== -1;
}

export function hitsObstacle(points, o) {
  return points.some(
    (pt) => pt.x >= o.x && pt.x <= o.x + o.w && pt.y >= o.bottom && pt.y <= o.top
  );
}

// 한 발 종합 평가: 다중 표적 + 코인 + 장애물 (+ 바운스)
export function evaluateShot(a, b, level, xMax, step = 0.4) {
  const points = samplePathBounce(a, b, xMax, level.bounces || 0, level.restitution || 0, step);
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
