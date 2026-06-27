import { test } from "node:test";
import assert from "node:assert/strict";
import { makeRng } from "../js/rng.js";
import { simulateOnce, simulate, buildHistogram } from "../js/simulate.js";
import { expectedWithPity } from "../js/prob.js";

test("makeRng: 같은 시드는 같은 수열, [0,1) 범위", () => {
  const a = makeRng(42), b = makeRng(42);
  for (let i = 0; i < 5; i += 1) {
    const x = a();
    assert.equal(x, b());
    assert.ok(x >= 0 && x < 1);
  }
  assert.notEqual(makeRng(1)(), makeRng(2)());
});

test("simulateOnce: 천장을 넘지 않는다", () => {
  const rng = makeRng(7);
  for (let i = 0; i < 100; i += 1) {
    const draws = simulateOnce(rng, 0.006, 90);
    assert.ok(draws >= 1 && draws <= 90);
  }
});

test("simulate: 통계와 히스토그램 구조", () => {
  const res = simulate(makeRng(123), 0.1, 0, 2000);
  assert.equal(res.trials.length, 2000);
  assert.ok(res.min >= 1);
  assert.ok(res.std > 0);
  const total = res.histogram.reduce((s, h) => s + h.count, 0);
  assert.equal(total, 2000);
});

test("큰 수의 법칙: 시뮬 평균이 이론 기댓값에 근접", () => {
  const p = 0.05, pity = 0;
  const res = simulate(makeRng(2024), p, pity, 20000);
  const theory = expectedWithPity(p, pity); // = 20
  assert.ok(Math.abs(res.mean - theory) < theory * 0.1);
});

test("buildHistogram: 모든 값이 동일하면 단일 구간", () => {
  const h = buildHistogram([5, 5, 5], 12);
  assert.equal(h.length, 1);
  assert.equal(h[0].count, 3);
});
