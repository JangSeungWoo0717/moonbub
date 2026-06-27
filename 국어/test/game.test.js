// test/game.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { getRank, BADGE_DEFS, evaluateBadges, buildQuests } from "../js/game.js";
import { createArgument } from "../js/model.js";

test("getRank: 점수 구간별 랭크/레벨", () => {
  assert.equal(getRank(10).level, 1);
  assert.equal(getRank(50).level, 2);
  assert.equal(getRank(70).level, 3);
  assert.equal(getRank(95).level, 4);
  assert.equal(typeof getRank(95).rank, "string");
  assert.equal(typeof getRank(95).icon, "string");
});

test("evaluateBadges: 근거왕은 근거 3개 이상", () => {
  const arg = createArgument({ grounds: ["a", "b", "c"] });
  const scores = { total: 50 };
  assert.ok(evaluateBadges(arg, scores).includes("ground_king"));
});

test("evaluateBadges: 퍼펙트는 100점", () => {
  assert.ok(evaluateBadges(createArgument(), { total: 100 }).includes("perfect"));
  assert.ok(!evaluateBadges(createArgument(), { total: 99 }).includes("perfect"));
});

test("evaluateBadges: 성장러는 이전보다 점수 상승", () => {
  assert.ok(evaluateBadges(createArgument(), { total: 60 }, 40).includes("grower"));
  assert.ok(!evaluateBadges(createArgument(), { total: 40 }, 60).includes("grower"));
});

test("buildQuests: 약한 지표에 대한 미션을 제시한다", () => {
  const scores = {
    groundsSufficiency: 4, logicalConnection: 20, counterHandling: 0,
    claimClarity: 20, fallacyCleanliness: 20, total: 64,
  };
  const quests = buildQuests(scores, createArgument());
  assert.ok(quests.length > 0);
  assert.ok(quests.every((q) => typeof q.text === "string"));
});
