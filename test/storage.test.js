// test/storage.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadVersions, saveVersion, loadProfile, saveProfile, clearAll } from "../js/storage.js";
import { createArgument, createEmptyProfile } from "../js/model.js";

function makeStore() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

test("빈 저장소는 빈 배열/기본 프로필을 반환", () => {
  const s = makeStore();
  assert.deepEqual(loadVersions(s), []);
  assert.deepEqual(loadProfile(s), createEmptyProfile());
});

test("saveVersion 후 loadVersions로 조회 가능", () => {
  const s = makeStore();
  const arg = createArgument({ title: "초안", claim: "주장" });
  const all = saveVersion(arg, s);
  assert.equal(all.length, 1);
  assert.equal(loadVersions(s)[0].title, "초안");
});

test("saveProfile/loadProfile 왕복", () => {
  const s = makeStore();
  saveProfile({ unlockedBadges: ["perfect"], bestScore: 100, totalAttempts: 3 }, s);
  assert.equal(loadProfile(s).bestScore, 100);
});

test("손상된 JSON은 기본값으로 복구", () => {
  const s = makeStore();
  s.setItem("argumap_versions", "{not json");
  assert.deepEqual(loadVersions(s), []);
});

test("clearAll은 모두 비운다", () => {
  const s = makeStore();
  saveVersion(createArgument(), s);
  clearAll(s);
  assert.deepEqual(loadVersions(s), []);
});
