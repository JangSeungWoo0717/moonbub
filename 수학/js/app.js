import { createGame, currentLevel, fire, hasNext, nextLevel, goToLevel } from "./game.js";
import { vertex, landingX } from "./physics.js";
import { WORLD } from "./levels.js";
import { drawScene, animateShot } from "./render.js";
import { loadProgress, recordClear } from "./storage.js";

const canvas = document.getElementById("game-canvas");
const aSlider = document.getElementById("a-slider");
const bSlider = document.getElementById("b-slider");

const game = createGame();
let busy = false; // 발사 애니메이션 중 입력 잠금

// 저장된 진행도를 게임 상태에 반영
const saved = loadProgress();
game.stars = { ...saved.cleared };

function curA() { return parseFloat(aSlider.value); }
function curB() { return parseFloat(bSlider.value); }

function setupLevel() {
  const lv = currentLevel(game);
  const c = lv.controls;
  aSlider.min = c.aMin; aSlider.max = c.aMax; aSlider.step = c.aStep;
  bSlider.min = c.bMin; bSlider.max = c.bMax; bSlider.step = c.bStep;
  aSlider.value = ((c.aMin + c.aMax) / 2).toFixed(3);
  bSlider.value = ((c.bMin + c.bMax) / 2).toFixed(2);
  document.getElementById("hint").textContent = lv.hint;
  hideOverlay();
  updateHud();
  redraw();
}

function updateHud() {
  const lv = currentLevel(game);
  document.getElementById("hud-level").textContent = `레벨 ${lv.id}`;
  document.getElementById("hud-attempts").textContent = `시도 ${game.attempts}`;
  const s = game.stars[lv.id] ?? 0;
  document.getElementById("hud-stars").textContent = s ? "⭐".repeat(s) : "☆☆☆";
}

function redraw() {
  const a = curA(), b = curB();
  document.getElementById("a-val").textContent = a.toFixed(2);
  document.getElementById("b-val").textContent = b.toFixed(2);
  drawScene(canvas, currentLevel(game), a, b);
  const v = vertex(a, b);
  const land = landingX(a, b);
  const parts = [];
  if (v) parts.push(`꼭짓점 (${v.x.toFixed(1)}, ${v.y.toFixed(1)})`);
  if (v) parts.push(`대칭축 x=${v.x.toFixed(1)}`);
  if (land != null) parts.push(`착지 x=${land.toFixed(1)}`);
  document.getElementById("math-info").textContent = parts.join("  ·  ");
}

function firstHitIndex(points, target) {
  for (let i = 0; i < points.length; i += 1) {
    const dx = points[i].x - target.x;
    const dy = points[i].y - target.y;
    if (Math.hypot(dx, dy) <= target.r) return i;
  }
  return -1;
}

function onFire() {
  if (busy) return;
  busy = true;
  const lv = currentLevel(game);
  const result = fire(game, curA(), curB());
  updateHud();
  const hitIndex = result.win ? firstHitIndex(result.points, lv.target) : -1;
  animateShot(canvas, lv, result.points, hitIndex, () => {
    busy = false;
    if (result.win) {
      const stars = game.stars[lv.id] ?? 1;
      recordClear(lv.id, stars);
      showWin(stars);
    } else {
      showMiss(result.blocked);
    }
  });
}

/* ---------- 오버레이 ---------- */
function showWin(stars) {
  const ov = document.getElementById("overlay");
  const last = !hasNext(game);
  ov.innerHTML = `
    <h2>🎉 명중!</h2>
    <div class="stars">${"⭐".repeat(stars)}${"☆".repeat(3 - stars)}</div>
    <p class="msg">${game.attempts}번 시도</p>
    <button type="button" class="btn-primary" id="ov-next">${last ? "처음으로 🔁" : "다음 레벨 ▶"}</button>`;
  ov.hidden = false;
  document.getElementById("ov-next").addEventListener("click", () => {
    if (last) goToLevel(game, 0); else nextLevel(game);
    setupLevel();
  });
}

function showMiss(blocked) {
  const ov = document.getElementById("overlay");
  ov.innerHTML = `
    <h2>${blocked ? "🧱 막혔어요" : "💨 빗나감"}</h2>
    <p class="msg">${blocked ? "장애물에 부딪혔어요. 더 높이 넘겨보세요." : "표적을 빗나갔어요. a·b를 조절해 다시!"}</p>
    <button type="button" class="btn-primary" id="ov-retry">다시 조준</button>`;
  ov.hidden = false;
  document.getElementById("ov-retry").addEventListener("click", () => { hideOverlay(); redraw(); });
}

function hideOverlay() {
  const ov = document.getElementById("overlay");
  ov.hidden = true; ov.innerHTML = "";
}

/* ---------- 레벨 선택 ---------- */
function toggleLevelPicker() {
  const picker = document.getElementById("level-picker");
  if (!picker.hidden) { picker.hidden = true; return; }
  picker.innerHTML = game.levels
    .map((lv, i) => {
      const s = game.stars[lv.id] ?? 0;
      return `<button type="button" class="level-chip ${i === game.index ? "current" : ""}" data-i="${i}">
        ${lv.id}<span class="chip-stars">${s ? "⭐".repeat(s) : "·"}</span></button>`;
    })
    .join("");
  picker.querySelectorAll(".level-chip").forEach((b) =>
    b.addEventListener("click", () => {
      goToLevel(game, Number(b.dataset.i));
      picker.hidden = true;
      setupLevel();
    })
  );
  picker.hidden = false;
}

/* ---------- 초기화 ---------- */
aSlider.addEventListener("input", redraw);
bSlider.addEventListener("input", redraw);
document.getElementById("fire-btn").addEventListener("click", onFire);
document.getElementById("levels-btn").addEventListener("click", toggleLevelPicker);

setupLevel();
