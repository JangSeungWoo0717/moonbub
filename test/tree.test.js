// test/tree.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTreeData } from "../js/tree.js";
import { createArgument } from "../js/model.js";

test("buildTreeData는 주장과 분기를 구성한다", () => {
  const arg = createArgument({
    claim: "사형제 폐지", grounds: ["근거1", "근거2"],
    warrant: "전제", qualifier: "대체로", rebuttal: "반론",
  });
  const tree = buildTreeData(arg);
  assert.equal(tree.claim, "사형제 폐지");
  const labels = tree.branches.map((b) => b.label);
  assert.ok(labels.includes("근거"));
  assert.ok(labels.includes("전제·보강"));
  assert.ok(labels.includes("반례·반론"));
});

test("빈 항목은 분기에서 제외", () => {
  const arg = createArgument({ claim: "주장", grounds: [], warrant: "" });
  const tree = buildTreeData(arg);
  assert.ok(!tree.branches.some((b) => b.label === "전제·보강"));
});
