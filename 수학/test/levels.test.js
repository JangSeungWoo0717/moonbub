import { test } from "node:test";
import assert from "node:assert/strict";
import { LEVELS, WORLD, starRating } from "../js/levels.js";
import { evaluateShot } from "../js/physics.js";

test("starRating: 시도 적을수록 높은 별점", () => {
  assert.equal(starRating(1), 3);
  assert.equal(starRating(2), 2);
  assert.equal(starRating(3), 2);
  assert.equal(starRating(7), 1);
});

test("모든 레벨에 필수 필드가 있다", () => {
  for (const lv of LEVELS) {
    assert.equal(typeof lv.id, "number");
    assert.ok(lv.target && typeof lv.target.x === "number");
    assert.ok(Array.isArray(lv.obstacles));
    assert.ok(lv.controls && lv.controls.aMin < lv.controls.aMax);
    assert.equal(typeof lv.hint, "string");
  }
});

// 핵심: 각 레벨이 슬라이더 범위 안에서 실제로 풀 수 있는지 전수 탐색
test("모든 레벨은 슬라이더 범위 내에서 클리어 가능하다", () => {
  for (const lv of LEVELS) {
    const c = lv.controls;
    let solvable = false;
    for (let a = c.aMin; a <= c.aMax + 1e-9 && !solvable; a += c.aStep) {
      for (let b = c.bMin; b <= c.bMax + 1e-9; b += c.bStep) {
        if (evaluateShot(a, b, lv, WORLD.W, 0.25).win) { solvable = true; break; }
      }
    }
    assert.ok(solvable, `레벨 ${lv.id}을(를) 푸는 (a,b)가 슬라이더 범위에 없음`);
  }
});
