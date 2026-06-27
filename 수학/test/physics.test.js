import { test } from "node:test";
import assert from "node:assert/strict";
import {
  trajectoryY, vertex, landingX, samplePath, hitsTarget, hitsObstacle, evaluateShot,
} from "../js/physics.js";

const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

test("trajectoryY: 원점에서 출발(상수항 0)", () => {
  assert.equal(trajectoryY(-1, 2, 0), 0);
  assert.equal(trajectoryY(-1, 2, 1), 1); // -1+2
  assert.equal(trajectoryY(-0.5, 3, 2), 4); // -2+6
});

test("vertex: 꼭짓점 x=-b/2a", () => {
  const v = vertex(-1, 2);
  assert.ok(close(v.x, 1));
  assert.ok(close(v.y, 1));
  assert.equal(vertex(0, 2), null);
});

test("landingX: 아치일 때만 착지점 -b/a", () => {
  assert.ok(close(landingX(-1, 2), 2));
  assert.equal(landingX(1, 2), null); // 위로 열린 포물선
  assert.equal(landingX(-1, 0), null); // b<=0
});

test("samplePath: 원점에서 시작, 착지점에서 끝", () => {
  const pts = samplePath(-1, 2, 100, 0.5);
  assert.equal(pts[0].x, 0);
  assert.ok(close(pts[0].y, 0));
  const last = pts[pts.length - 1];
  assert.ok(close(last.x, 2));
  assert.ok(close(last.y, 0, 1e-6));
});

test("hitsTarget: 궤적이 표적을 지나면 명중", () => {
  const pts = samplePath(-1, 2, 100, 0.1);
  // 꼭짓점 (1,1) 근처 표적
  assert.ok(hitsTarget(pts, { x: 1, y: 1, r: 0.3 }));
  assert.ok(!hitsTarget(pts, { x: 5, y: 5, r: 0.3 }));
});

test("hitsObstacle: 사각형 내부 통과 판정", () => {
  const pts = samplePath(-1, 2, 100, 0.1);
  // 꼭짓점(1,1)을 가리는 벽
  assert.ok(hitsObstacle(pts, { x: 0.8, w: 0.4, bottom: 0, top: 1.2 }));
  // 궤적 위쪽(높이 5) — 닿지 않음
  assert.ok(!hitsObstacle(pts, { x: 0.8, w: 0.4, bottom: 4, top: 5 }));
});

test("evaluateShot: 명중/차단 종합 판정", () => {
  const level = { target: { x: 1, y: 1, r: 0.3 }, obstacles: [] };
  assert.ok(evaluateShot(-1, 2, level, 100, 0.1).win);

  const blockedLevel = {
    target: { x: 1, y: 1, r: 0.3 },
    obstacles: [{ x: 0.4, w: 0.2, bottom: 0, top: 1 }],
  };
  const r = evaluateShot(-1, 2, blockedLevel, 100, 0.1);
  assert.ok(r.blocked);
  assert.ok(!r.win);
});
