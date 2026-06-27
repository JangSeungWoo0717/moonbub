import { test } from "node:test";
import assert from "node:assert/strict";
import {
  scoreGroundsSufficiency, scoreLogicalConnection, scoreCounterHandling,
  scoreClaimClarity, scoreFallacyCleanliness, computeScores,
} from "../js/scoring.js";
import { createArgument } from "../js/model.js";

test("근거 충분성: 근거 없으면 낮고, 다수+구체적이면 높다", () => {
  assert.ok(scoreGroundsSufficiency(createArgument({ grounds: [] })) <= 5);
  const strong = createArgument({
    grounds: ["통계에 따르면 30% 감소했다", "2020년 연구 자료가 있다", "전문가 의견"],
  });
  assert.ok(scoreGroundsSufficiency(strong) >= 15);
});

test("논리 연결성: 전제가 있으면 점수가 오른다", () => {
  assert.ok(scoreLogicalConnection(createArgument({ warrant: "" })) <= 5);
  assert.ok(
    scoreLogicalConnection(createArgument({ warrant: "근거가 주장을 뒷받침하는 이유는 분명하다" })) >= 12
  );
});

test("반론 대응력: 반론+대응표현이 있으면 높다", () => {
  assert.ok(scoreCounterHandling(createArgument({ rebuttal: "" })) <= 3);
  assert.ok(
    scoreCounterHandling(createArgument({ rebuttal: "그러나 이 반론은 통계로 반박된다" })) >= 15
  );
});

test("주장 명료성: 모호어가 있으면 감점", () => {
  const clear = createArgument({ claim: "사형제는 폐지되어야 한다" });
  const vague = createArgument({ claim: "사형제는 뭔가 아마 안 좋은 것 같다 등등" });
  assert.ok(scoreClaimClarity(clear) > scoreClaimClarity(vague));
});

test("오류 청결도: 오류 1건당 감점", () => {
  assert.equal(scoreFallacyCleanliness([]), 20);
  assert.ok(scoreFallacyCleanliness(["hasty_generalization"]) < 20);
  assert.ok(scoreFallacyCleanliness(["a", "b", "c", "d", "e"]) >= 0);
});

test("computeScores total은 5개 합이고 0~100", () => {
  const arg = createArgument({
    claim: "사형제는 폐지되어야 한다",
    grounds: ["통계에 따르면 30% 감소", "연구 자료"],
    warrant: "근거가 주장을 뒷받침한다",
    rebuttal: "그러나 반론은 반박된다",
  });
  const s = computeScores(arg, []);
  const sum =
    s.groundsSufficiency + s.logicalConnection + s.counterHandling +
    s.claimClarity + s.fallacyCleanliness;
  assert.equal(s.total, sum);
  assert.ok(s.total >= 0 && s.total <= 100);
});
