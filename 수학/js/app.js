import { createGame, currentLevel, fire, hasNext, nextLevel, goToLevel, totalStars } from "./game.js";
import { vertex, landingX, firstHitIndex, velocityToCoeffs } from "./physics.js";
import { WORLD, CONTROLS, GRAVITY, LEVELS } from "./levels.js";
import { starGoals } from "./scoring.js";
import { Renderer } from "./render.js";
import { loadProgress, recordClear, setSound } from "./storage.js";
import * as sfx from "./audio.js";

const canvas = document.getElementById("game-canvas");
const aSlider = document.getElementById("a-slider");
const bSlider = document.getElementById("b-slider");

const renderer = new Renderer(canvas);
renderer.start();

const game = createGame();
let a = -0.12, b = 1.5;
let busy = false;

// 저장된 진행도 반영
const saved = loadProgress();
game.stars = { ...saved.cleared };
sfx.setEnabled(saved.soundOn);

aSlider.min = CONTROLS.aMin; aSlider.max = CONTROLS.aMax; aSlider.step = CONTROLS.aStep;
bSlider.min = CONTROLS.bMin; bSlider.max = CONTROLS.bMax; bSlider.step = CONTROLS.bStep;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function setAB(na, nb) {
  a = clamp(na, CONTROLS.aMin, CONTROLS.aMax);
  b = clamp(nb, CONTROLS.bMin, CONTROLS.bMax);
  aSlider.value = a;
  bSlider.value = b;
  document.getElementById("a-val").textContent = a.toFixed(2);
  document.getElementById("b-val").textContent = b.toFixed(2);
  renderer.setAim(a, b);
  updateReadout();
}

function updateReadout() {
  const sign = b >= 0 ? "+" : "−";
  document.getElementById("equation").textContent =
    `y = ${a.toFixed(2)}x² ${sign} ${Math.abs(b).toFixed(2)}x`;
  const v = vertex(a, b);
  const land = landingX(a, b);
  const parts = [];
  if (v) parts.push(`꼭짓점 (${v.x.toFixed(1)}, ${v.y.toFixed(1)})`);
  if (v) parts.push(`대칭축 x=${v.x.toFixed(1)}`);
  if (land != null) parts.push(`착지 x=${land.toFixed(1)}`);
  document.getElementById("math-info").textContent = parts.join("  ·  ");
}

function resetObjectives(level) {
  level.targets.forEach((t) => { delete t._hit; });
  level.coins.forEach((c) => { delete c._got; });
}

function setupLevel() {
  const lv = currentLevel(game);
  resetObjectives(lv);
  renderer.setLevel(lv);
  setAB((CONTROLS.aMin + CONTROLS.aMax) / 2, 1.5);
  document.getElementById("hint").textContent = lv.hint;
  document.getElementById("goals").textContent = "⭐ " + starGoals(lv).join("  ·  ");
  hideOverlay();
  updateHud();
}

function updateHud() {
  const lv = currentLevel(game);
  document.getElementById("hud-level").textContent = `LV ${lv.id}/${LEVELS.length}`;
  document.getElementById("hud-attempts").textContent = `시도 ${game.attempts}`;
  const s = game.stars[lv.id] ?? 0;
  document.getElementById("hud-stars").textContent = s ? "⭐".repeat(s) + "☆".repeat(3 - s) : "☆☆☆";
  document.getElementById("hud-total").textContent = `총 ⭐${totalStars(game)}/${LEVELS.length * 3}`;
}

/* ---------- 발사 ---------- */
function onFire() {
  if (busy) return;
  sfx.initAudio();
  const lv = currentLevel(game);
  resetObjectives(lv);
  const result = fire(game, a, b);
  updateHud();

  // 애니메이션 이벤트(명중 순서대로)
  const events = [];
  lv.targets.forEach((t, i) => {
    if (result.hitTargets[i]) events.push({ index: firstHitIndex(result.points, t), type: "target", color: "#ff6b6b", x: t.x, y: t.y, ref: t });
  });
  lv.coins.forEach((c, i) => {
    if (result.coinsGot[i]) events.push({ index: firstHitIndex(result.points, c), type: "coin", color: "#ffcf3f", x: c.x, y: c.y, ref: c });
  });
  events.sort((p, q) => p.index - q.index);

  // 막혔으면 공이 장애물에서 멈추도록 궤적을 잘라냄
  let pathPoints = result.points;
  if (result.blocked) {
    const cut = firstObstacleIndex(result.points, lv.obstacles);
    if (cut > 0) pathPoints = result.points.slice(0, cut + 1);
  }

  busy = true;
  sfx.playLaunch(Math.min(b / CONTROLS.bMax, 1));
  let coinStep = 0;
  renderer.shoot(pathPoints, events, (ev) => {
    if (ev.type === "target") { ev.ref._hit = true; sfx.playHit(); }
    else { ev.ref._got = true; sfx.playCoin(coinStep++); }
  }, () => {
    busy = false;
    if (result.allHit) {
      const stars = result.stars ?? 1;
      recordClear(lv.id, stars);
      sfx.playWin(stars);
      showWin(stars);
    } else {
      sfx.playMiss();
      if (result.blocked) renderer.shake(10);
      showMiss(result.blocked);
    }
  });
}

function firstObstacleIndex(points, obstacles) {
  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    if ((obstacles || []).some((o) => p.x >= o.x && p.x <= o.x + o.w && p.y >= o.bottom && p.y <= o.top)) {
      return i;
    }
  }
  return -1;
}

/* ---------- 드래그 조준 ---------- */
function pointerToAB(e) {
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  const w = renderer.toWorld(px, py);
  const vx = Math.max(w.x, 0.6);
  const vy = Math.max(w.y, 0.1);
  return velocityToCoeffs(vx, vy, GRAVITY);
}

let dragging = false;
canvas.addEventListener("pointerdown", (e) => {
  if (busy) return;
  dragging = true;
  sfx.initAudio();
  canvas.setPointerCapture(e.pointerId);
  const { a: na, b: nb } = pointerToAB(e);
  setAB(na, nb);
});
canvas.addEventListener("pointermove", (e) => {
  if (!dragging || busy) return;
  const { a: na, b: nb } = pointerToAB(e);
  setAB(na, nb);
});
canvas.addEventListener("pointerup", () => { dragging = false; });
canvas.addEventListener("pointercancel", () => { dragging = false; });

aSlider.addEventListener("input", () => setAB(parseFloat(aSlider.value), b));
bSlider.addEventListener("input", () => setAB(a, parseFloat(bSlider.value)));

/* ---------- 오버레이 ---------- */
function showWin(stars) {
  const ov = document.getElementById("overlay");
  const last = !hasNext(game);
  ov.innerHTML = `
    <h2>🎉 클리어!</h2>
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
    <p class="msg">${blocked ? "장애물에 부딪혔어요. 곡선 높이를 바꿔보세요." : "표적을 모두 맞히지 못했어요. 다시 조준!"}</p>
    <button type="button" class="btn-primary" id="ov-retry">다시 조준</button>`;
  ov.hidden = false;
  document.getElementById("ov-retry").addEventListener("click", () => {
    resetObjectives(currentLevel(game));
    hideOverlay();
  });
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
  picker.querySelectorAll(".level-chip").forEach((btn) =>
    btn.addEventListener("click", () => {
      goToLevel(game, Number(btn.dataset.i));
      picker.hidden = true;
      setupLevel();
    })
  );
  picker.hidden = false;
}

/* ---------- 사운드 토글 ---------- */
function updateSoundBtn() {
  document.getElementById("sound-btn").textContent = sfx.isEnabled() ? "🔊" : "🔈";
}
document.getElementById("sound-btn").addEventListener("click", () => {
  sfx.setEnabled(!sfx.isEnabled());
  setSound(sfx.isEnabled());
  updateSoundBtn();
});

document.getElementById("fire-btn").addEventListener("click", onFire);
document.getElementById("levels-btn").addEventListener("click", toggleLevelPicker);

updateSoundBtn();
setupLevel();
