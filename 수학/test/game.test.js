import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createGame, currentLevel, fire, nextLevel, hasNext, goToLevel, totalStars,
} from "../js/game.js";

test("createGame: 초기 상태", () => {
  const g = createGame();
  assert.equal(g.index, 0);
  assert.equal(g.attempts, 0);
  assert.equal(g.status, "aiming");
});

test("fire: 레벨1 명중 시 won + 별점 기록", () => {
  const g = createGame();
  // 레벨1 설계 곡선 a=-0.10,b=1.20
  const r = fire(g, -0.10, 1.20);
  assert.equal(g.attempts, 1);
  assert.ok(r.allHit);
  assert.equal(g.status, "won");
  assert.ok(g.stars[1] >= 1);
});

test("fire: 빗나가면 aiming 유지", () => {
  const g = createGame();
  const r = fire(g, -0.5, 0.1); // 거의 날아가지 못함 → 빗나감
  assert.equal(g.attempts, 1);
  assert.ok(!r.allHit);
  assert.equal(g.status, "aiming");
});

test("코인 포함 레벨: 코인 전부 수집 시 더 높은 별점", () => {
  const g = createGame();
  goToLevel(g, 2); // 레벨3 (코인 3개), 설계곡선 a=-0.08,b=1.20
  const r = fire(g, -0.08, 1.20);
  assert.ok(r.allHit);
  assert.equal(r.coinsCount, 3);
  assert.equal(g.stars[3], 3); // 1발 + 코인전부 + par이내
});

test("nextLevel / hasNext / goToLevel / totalStars", () => {
  const g = createGame();
  assert.ok(hasNext(g));
  assert.ok(nextLevel(g));
  assert.equal(g.index, 1);
  assert.ok(goToLevel(g, 11));
  assert.ok(!hasNext(g));
  g.stars = { 1: 3, 2: 2 };
  assert.equal(totalStars(g), 5);
});
