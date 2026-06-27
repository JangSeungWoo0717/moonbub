import { test } from "node:test";
import assert from "node:assert/strict";
import { loadConfig, saveConfig, clearConfig } from "../js/storage.js";

function makeStore() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

test("빈 저장소는 기본 설정 반환", () => {
  const c = loadConfig(makeStore());
  assert.equal(c.rarities.length, 2);
});

test("saveConfig/loadConfig 왕복", () => {
  const s = makeStore();
  saveConfig({ rarities: [{ name: "A", p: 0.2, color: "#fff" }], targetIndex: 0, pity: 50, costPerDraw: 100 }, s);
  const c = loadConfig(s);
  assert.equal(c.pity, 50);
  assert.equal(c.rarities[0].p, 0.2);
});

test("손상된 JSON은 기본값으로 복구", () => {
  const s = makeStore();
  s.setItem("gachalab_config", "{broken");
  assert.equal(loadConfig(s).rarities.length, 2);
});

test("clearConfig 후 기본값", () => {
  const s = makeStore();
  saveConfig({ pity: 10 }, s);
  clearConfig(s);
  assert.equal(loadConfig(s).pity, 90);
});
