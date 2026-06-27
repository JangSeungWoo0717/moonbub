import { test } from "node:test";
import assert from "node:assert/strict";
import { loadProgress, saveProgress, recordClear, clearProgress } from "../js/storage.js";

function makeStore() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

test("빈 저장소는 cleared 빈 객체", () => {
  assert.deepEqual(loadProgress(makeStore()), { cleared: {} });
});

test("recordClear: 별점 저장 및 조회", () => {
  const s = makeStore();
  recordClear(1, 2, s);
  assert.equal(loadProgress(s).cleared[1], 2);
});

test("recordClear: 더 낮은 별점은 무시(최고 유지)", () => {
  const s = makeStore();
  recordClear(1, 3, s);
  recordClear(1, 1, s);
  assert.equal(loadProgress(s).cleared[1], 3);
});

test("손상된 JSON은 기본값으로 복구", () => {
  const s = makeStore();
  s.setItem("parabola_progress", "{broken");
  assert.deepEqual(loadProgress(s), { cleared: {} });
});

test("clearProgress 후 초기화", () => {
  const s = makeStore();
  recordClear(2, 3, s);
  clearProgress(s);
  assert.deepEqual(loadProgress(s), { cleared: {} });
});
