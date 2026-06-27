import { test } from "node:test";
import assert from "node:assert/strict";
import { computeStars, starGoals } from "../js/scoring.js";

test("미명중이면 0별", () => {
  assert.equal(computeStars({ attempts: 1, par: 3, coinsTotal: 0, coinsGot: 0, allHit: false }), 0);
});

test("명중 기본 1별", () => {
  assert.equal(computeStars({ attempts: 5, par: 3, coinsTotal: 2, coinsGot: 1, allHit: true }), 1);
});

test("코인 전부 +1, par 이내 +1 → 최대 3", () => {
  assert.equal(computeStars({ attempts: 1, par: 3, coinsTotal: 2, coinsGot: 2, allHit: true }), 3);
  // 코인 없음(0) → 코인 조건 자동 충족
  assert.equal(computeStars({ attempts: 1, par: 3, coinsTotal: 0, coinsGot: 0, allHit: true }), 3);
});

test("par 초과면 별 1개 감점", () => {
  assert.equal(computeStars({ attempts: 9, par: 2, coinsTotal: 1, coinsGot: 1, allHit: true }), 2);
});

test("starGoals: 코인 유무에 따라 목표 문구", () => {
  assert.equal(starGoals({ coins: [], par: 3 }).length, 2);
  assert.equal(starGoals({ coins: [{}, {}], par: 2 }).length, 3);
});
