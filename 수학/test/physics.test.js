import { test } from "node:test";
import assert from "node:assert/strict";
import {
  trajectoryY, vertex, landingX, velocityToCoeffs, samplePath,
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
