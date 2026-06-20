import { test } from "node:test";
import assert from "node:assert/strict";
import { createArgument, createEmptyProfile, generateId } from "../js/model.js";

test("createArgument는 기본값을 채운다", () => {
  const a = createArgument();
  assert.equal(a.claim, "");
  assert.deepEqual(a.grounds, []);
  assert.equal(a.warrant, "");
  assert.equal(a.qualifier, "");
  assert.equal(a.rebuttal, "");
  assert.deepEqual(a.fallacies, []);
  assert.deepEqual(a.badges, []);
  assert.equal(typeof a.id, "string");
  assert.ok(a.id.length > 0);
});

test("createArgument는 전달된 데이터를 덮어쓴다", () => {
  const a = createArgument({ claim: "사형제 폐지", grounds: ["근거1"] });
  assert.equal(a.claim, "사형제 폐지");
  assert.deepEqual(a.grounds, ["근거1"]);
});

test("createEmptyProfile 기본값", () => {
  const p = createEmptyProfile();
  assert.deepEqual(p, { unlockedBadges: [], bestScore: 0, totalAttempts: 0 });
});

test("generateId는 매번 다른 값을 반환한다", () => {
  assert.notEqual(generateId(), generateId());
});
