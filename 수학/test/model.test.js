import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultConfig, createConfig, targetProbability } from "../js/model.js";

test("defaultConfig: 기본 레어도와 천장", () => {
  const c = defaultConfig();
  assert.equal(c.rarities.length, 2);
  assert.equal(c.targetIndex, 0);
  assert.equal(c.pity, 90);
});

test("createConfig: 확률 범위 보정(0~1)", () => {
  const c = createConfig({ rarities: [{ name: "A", p: 5 }, { name: "B", p: -1 }] });
  assert.equal(c.rarities[0].p, 1);
  assert.equal(c.rarities[1].p, 0);
});

test("createConfig: 잘못된 targetIndex는 0으로", () => {
  const c = createConfig({ rarities: [{ name: "A", p: 0.1 }], targetIndex: 9 });
  assert.equal(c.targetIndex, 0);
});

test("createConfig: 음수 천장은 0으로", () => {
  assert.equal(createConfig({ pity: -5 }).pity, 0);
});

test("targetProbability: 선택된 레어도 확률 반환", () => {
  const c = createConfig({ rarities: [{ name: "A", p: 0.3 }, { name: "B", p: 0.7 }], targetIndex: 1 });
  assert.equal(targetProbability(c), 0.7);
});
