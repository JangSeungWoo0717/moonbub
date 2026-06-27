import { test } from "node:test";
import assert from "node:assert/strict";
import {
  trajectoryY, vertex, landingX, velocityToCoeffs, samplePath,
  samplePathBounce, pointOnPathBounce, bounceSegments,
  firstHitIndex, hitsCircle, hitsObstacle, evaluateShot,
} from "../js/physics.js";

const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

test("trajectoryY: 원점에서 출발(상수항 0)", () => {
  assert.equal(trajectoryY(-1, 2, 0), 0);
  assert.equal(trajectoryY(-1, 2, 1), 1);
});

test("vertex / landingX", () => {
  const v = vertex(-1, 2);
  assert.ok(close(v.x, 1) && close(v.y, 1));
  assert.ok(close(landingX(-1, 2), 2));
  assert.equal(landingX(1, 2), null);
});

test("velocityToCoeffs: 발사벡터→이차계수", () => {
  // vx=2, vy=4, g=8 → a=-8/(2*4)=-1, b=4/2=2
  const { a, b } = velocityToCoeffs(2, 4, 8);
  assert.ok(close(a, -1));
  assert.ok(close(b, 2));
});

test("samplePath: 원점 시작, 착지에서 끝", () => {
  const pts = samplePath(-1, 2, 100, 0.5);
  assert.ok(close(pts[0].x, 0) && close(pts[0].y, 0));
  assert.ok(close(pts[pts.length - 1].x, 2));
});

test("firstHitIndex / hitsCircle", () => {
  const pts = samplePath(-1, 2, 100, 0.1);
  assert.ok(hitsCircle(pts, { x: 1, y: 1, r: 0.3 }));
  assert.equal(firstHitIndex(pts, { x: 9, y: 9, r: 0.3 }), -1);
});

test("hitsObstacle: 사각형 통과 판정", () => {
  const pts = samplePath(-1, 2, 100, 0.1);
  assert.ok(hitsObstacle(pts, { x: 0.8, w: 0.4, bottom: 0, top: 1.2 }));
  assert.ok(!hitsObstacle(pts, { x: 0.8, w: 0.4, bottom: 4, top: 5 }));
});

test("bounceSegments: 바운스마다 길이가 e배(등비수열)", () => {
  const segs = bounceSegments(-0.2, 2, 100, 2, 0.5);
  assert.equal(segs.length, 3);
  const L0 = segs[0].end - segs[0].x0; // 첫 착지거리 = -b/a = 10
  const L1 = segs[1].end - segs[1].x0;
  assert.ok(close(L0, 10));
  assert.ok(close(L1, 5)); // 0.5배
});

test("samplePathBounce: 두 번째 아치 봉우리는 첫 봉우리의 e²배", () => {
  const a = -0.2, b = 2, e = 0.5;
  const pts = samplePathBounce(a, b, 100, 1, e, 0.05);
  const peak1 = Math.max(...pts.filter((p) => p.x < 10).map((p) => p.y));
  const peak2 = Math.max(...pts.filter((p) => p.x > 10).map((p) => p.y));
  assert.ok(close(peak2 / peak1, e * e, 0.02));
});

test("pointOnPathBounce: 바운스 경로 위 높이", () => {
  // 첫 착지 x=10 에서 y=0
  assert.ok(close(pointOnPathBounce(-0.2, 2, 10, 2, 0.5), 0, 1e-6));
});

test("evaluateShot: 다중 표적 + 코인 + 장애물", () => {
  // 곡선 y=-1x²+2x: 꼭짓점(1,1), 착지 2
  const level = {
    targets: [{ x: 1, y: 1, r: 0.3 }],
    coins: [{ x: 0.5, y: 0.75, r: 0.3 }],
    obstacles: [],
  };
  const r = evaluateShot(-1, 2, level, 100, 0.05);
  assert.ok(r.allHit);
  assert.equal(r.coinsCount, 1);

  const blocked = evaluateShot(-1, 2, {
    targets: [{ x: 1, y: 1, r: 0.3 }], coins: [],
    obstacles: [{ x: 0.4, w: 0.2, bottom: 0, top: 1 }],
  }, 100, 0.05);
  assert.ok(blocked.blocked && !blocked.allHit);
});
