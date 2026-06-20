// test/fallacy.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { FALLACY_RULES, detectFallacies } from "../js/fallacy.js";
import { createArgument } from "../js/model.js";

test("FALLACY_RULES는 key/name/hint/test를 가진다", () => {
  assert.ok(FALLACY_RULES.length >= 4);
  for (const r of FALLACY_RULES) {
    assert.equal(typeof r.key, "string");
    assert.equal(typeof r.name, "string");
    assert.equal(typeof r.hint, "string");
    assert.equal(typeof r.test, "function");
  }
});

test("성급한 일반화 탐지", () => {
  const arg = createArgument({ claim: "모두가 항상 그렇게 행동한다", grounds: [] });
  assert.ok(detectFallacies(arg).includes("hasty_generalization"));
});

test("흑백논리 탐지", () => {
  const arg = createArgument({ claim: "찬성 아니면 반대 둘 중 하나다" });
  assert.ok(detectFallacies(arg).includes("false_dilemma"));
});

test("깨끗한 논증은 오류가 없다", () => {
  const arg = createArgument({
    claim: "사형제는 신중히 재검토되어야 한다",
    grounds: ["2020년 통계 자료에 따르면"],
  });
  assert.deepEqual(detectFallacies(arg), []);
});
