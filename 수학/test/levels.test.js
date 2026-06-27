import { test } from "node:test";
import assert from "node:assert/strict";
import { LEVELS, WORLD, CONTROLS } from "../js/levels.js";
import { evaluateShot } from "../js/physics.js";

test("15개 레벨, 필수 필드 보유", () => {
  assert.equal(LEVELS.length, 15);
  for (const lv of LEVELS) {
    assert.equal(typeof lv.id, "number");
    assert.ok(Array.isArray(lv.targets) && lv.targets.length >= 1);
    assert.ok(Array.isArray(lv.coins));
    assert.ok(Array.isArray(lv.obstacles));
    assert.ok(typeof lv.par === "number" && lv.par >= 1);
    assert.equal(typeof lv.hint, "string");
  }
});

// 모든 레벨이 조작 범위 안에서 "표적 전부 명중 + 코인 전부 수집"으로 풀 수 있는지 전수 검증
test("모든 레벨은 슬라이더 범위 내에서 완벽 클리어(코인 포함) 가능", () => {
  const c = CONTROLS;
  for (const lv of LEVELS) {
    const totalCoins = lv.coins.length;
    let perfect = false;
    for (let a = c.aMin; a <= c.aMax + 1e-9 && !perfect; a += c.aStep) {
      for (let b = c.bMin; b <= c.bMax + 1e-9; b += c.bStep) {
        const r = evaluateShot(a, b, lv, WORLD.W, 0.2);
        if (r.allHit && r.coinsCount === totalCoins) { perfect = true; break; }
      }
    }
    assert.ok(perfect, `레벨 ${lv.id}: 표적+코인 전부를 만족하는 (a,b)가 범위에 없음`);
  }
});
