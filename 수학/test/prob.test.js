import { test } from "node:test";
import assert from "node:assert/strict";
import {
  atLeastOnce, expectedTrials, drawsForProbability, cumulativeCurve, expectedWithPity,
} from "../js/prob.js";

const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

test("atLeastOnce: 여사건 공식", () => {
  assert.ok(close(atLeastOnce(0.5, 1), 0.5));
  assert.ok(close(atLeastOnce(0.5, 2), 0.75));
  assert.equal(atLeastOnce(0.5, 0), 0);
  assert.equal(atLeastOnce(0, 10), 0);
  assert.equal(atLeastOnce(1, 3), 1);
});

test("expectedTrials: 1/p", () => {
  assert.ok(close(expectedTrials(0.5), 2));
  assert.ok(close(expectedTrials(0.01), 100));
  assert.equal(expectedTrials(0), Infinity);
});

test("drawsForProbability: 누적확률 q 달성 최소 시도", () => {
  assert.equal(drawsForProbability(0.5, 0.75), 2);
  assert.equal(drawsForProbability(0.5, 0.9), 4); // 1-0.5^4=0.9375>=0.9, 0.5^3=0.875<0.9
  assert.equal(drawsForProbability(1, 0.5), 1);
  assert.equal(drawsForProbability(0.5, 0), 0);
});

test("cumulativeCurve: 길이와 단조증가", () => {
  const curve = cumulativeCurve(0.1, 20);
  assert.equal(curve.length, 20);
  assert.equal(curve[0].n, 1);
  for (let i = 1; i < curve.length; i += 1) {
    assert.ok(curve[i].prob >= curve[i - 1].prob);
  }
});

test("expectedWithPity: 천장 경계 동작", () => {
  // pity 없음 → 1/p
  assert.ok(close(expectedWithPity(0.5, 0), 2));
  // pity=1 → 무조건 1번에 보장
  assert.ok(close(expectedWithPity(0.006, 1), 1));
  // 천장 적용 기댓값 < 1/p (천장이 최악을 잘라내므로)
  assert.ok(expectedWithPity(0.006, 90) < expectedTrials(0.006));
  // 매우 큰 천장 → 1/p에 근접
  assert.ok(close(expectedWithPity(0.5, 1000), 2, 1e-6));
});
