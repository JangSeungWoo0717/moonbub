import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, currentLevel, fire, nextLevel, hasNext, goToLevel } from "../js/game.js";

test("createGame: 초기 상태", () => {
  const g = createGame();
  assert.equal(g.index, 0);
  assert.equal(g.attempts, 0);
  assert.equal(g.status, "aiming");
});

test("fire: 시도 증가, 명중 시 won + 별점", () => {
  const g = createGame();
  // 레벨1 표적 (8,0,r1.2). a=-0.125,b=1 → 착지 8
  const r = fire(g, -0.125, 1);
  assert.equal(g.attempts, 1);
  assert.ok(r.win);
  assert.equal(g.status, "won");
  assert.equal(g.stars[currentLevel(g).id], 3);
});

test("fire: 빗나가면 aiming 유지, 시도만 증가", () => {
  const g = createGame();
  const r = fire(g, -0.4, 4); // 너무 높이 솟아 표적 위로 — 빗나감
  assert.equal(g.attempts, 1);
  assert.ok(!r.win);
  assert.equal(g.status, "aiming");
});

test("별점은 최고 기록을 유지", () => {
  const g = createGame();
  fire(g, -0.4, 4);   // 실패 (시도1)
  fire(g, -0.125, 1); // 성공 (시도2 → 2별)
  assert.equal(g.stars[1], 2);
});

test("nextLevel / hasNext / goToLevel", () => {
  const g = createGame();
  assert.ok(hasNext(g));
  assert.ok(nextLevel(g));
  assert.equal(g.index, 1);
  assert.equal(g.attempts, 0);
  assert.ok(goToLevel(g, 4));
  assert.equal(g.index, 4);
  assert.ok(!hasNext(g));
  assert.ok(!nextLevel(g));
  assert.ok(!goToLevel(g, 99));
});
