import { test } from "node:test";
import assert from "node:assert/strict";
import { loadProgress, recordClear, setSound, clearProgress } from "../js/storage.js";

function makeStore() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

test("빈 저장소 기본값", () => {
  const p = loadProgress(makeStore());
  assert.deepEqual(p.cleared, {});
  assert.equal(p.soundOn, true);
});

test("recordClear: 별점 저장·최고 유지", () => {
  const s = makeStore();
  recordClear(1, 3, s);
  recordClear(1, 1, s);
  assert.equal(loadProgress(s).cleared[1], 3);
});

test("setSound: 사운드 토글 저장", () => {
  const s = makeStore();
  setSound(false, s);
  assert.equal(loadProgress(s).soundOn, false);
});

test("손상된 JSON 복구", () => {
  const s = makeStore();
  s.setItem("parabola_progress", "{broken");
  assert.deepEqual(loadProgress(s).cleared, {});
});

test("clearProgress 초기화", () => {
  const s = makeStore();
  recordClear(2, 3, s);
  clearProgress(s);
  assert.deepEqual(loadProgress(s).cleared, {});
});
