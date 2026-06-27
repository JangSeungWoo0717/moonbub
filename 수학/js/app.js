import { createConfig, defaultConfig, targetProbability } from "./model.js";
import {
  atLeastOnce, expectedTrials, drawsForProbability, cumulativeCurve, expectedWithPity,
} from "./prob.js";
import { makeRng } from "./rng.js";
import { simulate, simulateOnce } from "./simulate.js";
import { loadConfig, saveConfig, clearConfig } from "./storage.js";
import { renderCumulative, renderHistogram } from "./charts.js";

let config = loadConfig();

/* ---------- 탭 ---------- */
function initTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".tab-panel");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      buttons.forEach((b) => b.classList.toggle("active", b === btn));
      panels.forEach((p) => p.classList.toggle("active", p.id === target));
    });
  });
}

/* ---------- 설정 탭 ---------- */
function renderRarityRows() {
  const box = document.getElementById("rarity-list");
  box.innerHTML = "";
  config.rarities.forEach((r, i) => {
    const row = document.createElement("div");
    row.className = "rarity-row";
    row.innerHTML = `
      <input class="r-name" type="text" value="${escapeAttr(r.name)}" placeholder="이름" />
      <input class="r-prob" type="number" min="0" max="100" step="0.001" value="${+(r.p * 100).toFixed(3)}" placeholder="확률(%)" />
      <span style="display:flex;align-items:center;gap:6px">
        <span class="swatch" style="background:${escapeAttr(r.color)}"></span>
        <button type="button" class="del" data-i="${i}" aria-label="삭제">✕</button>
      </span>`;
    box.appendChild(row);
  });
  box.querySelectorAll(".del").forEach((b) =>
    b.addEventListener("click", () => {
      if (config.rarities.length <= 1) return;
      config.rarities.splice(Number(b.dataset.i), 1);
      syncFromForm(); renderSetup();
    })
  );
}

function renderTargetSelect() {
  const sel = document.getElementById("f-target");
  sel.innerHTML = config.rarities
    .map((r, i) => `<option value="${i}" ${i === config.targetIndex ? "selected" : ""}>${escapeHtml(r.name)} (${+(r.p * 100).toFixed(3)}%)</option>`)
    .join("");
}

function renderSetup() {
  renderRarityRows();
  renderTargetSelect();
  document.getElementById("f-pity").value = config.pity;
  document.getElementById("f-cost").value = config.costPerDraw;
}

function syncFromForm() {
  const names = [...document.querySelectorAll(".r-name")].map((i) => i.value);
  const probs = [...document.querySelectorAll(".r-prob")].map((i) => Number(i.value) / 100);
  const colors = config.rarities.map((r) => r.color);
  const rarities = names.map((name, i) => ({ name, p: probs[i] ?? 0, color: colors[i] ?? "#5b8cff" }));
  config = createConfig({
    rarities: rarities.length ? rarities : undefined,
    targetIndex: Number(document.getElementById("f-target").value),
    pity: Number(document.getElementById("f-pity").value),
    costPerDraw: Number(document.getElementById("f-cost").value),
  });
  saveConfig(config);
}

/* ---------- 분석 탭 ---------- */
function statCard(label, value, cls = "") {
  return `<div class="stat-card"><span class="label">${label}</span><span class="value ${cls}">${value}</span></div>`;
}

function renderAnalysis() {
  const p = targetProbability(config);
  const evNoPity = expectedTrials(p);
  const evPity = expectedWithPity(p, config.pity);
  const cards = [
    statCard("목표 1회 확률", `${(p * 100).toFixed(3)}%`),
    statCard("기대 뽑기 수", isFinite(evNoPity) ? `${evNoPity.toFixed(1)}회` : "∞", "gold"),
    statCard(`천장(${config.pity || "없음"}) 기댓값`, config.pity ? `${evPity.toFixed(1)}회` : "—", "green"),
  ];
  if (config.costPerDraw > 0 && isFinite(evPity)) {
    cards.push(statCard("기대 비용", `${Math.round(evPity * config.costPerDraw).toLocaleString()}`));
  }
  document.getElementById("stat-cards").innerHTML = cards.join("");

  const maxN = config.pity ? config.pity : Math.min(Math.ceil(evNoPity * 4) || 100, 1000);
  renderCumulative(cumulativeCurve(p, Math.max(maxN, 10)), document.getElementById("cumulative-canvas"));

  const body = document.getElementById("quant-body");
  body.innerHTML = [0.5, 0.9, 0.99].map((q) => {
    const n = drawsForProbability(p, q);
    return `<tr><td>${q * 100}% 이상</td><td>${isFinite(n) ? n + "회" : "불가"}</td></tr>`;
  }).join("");
}

/* ---------- 시뮬레이션 탭 ---------- */
function freshRng() {
  return makeRng(Math.floor(Math.random() * 0xffffffff));
}

function runSimulation() {
  syncFromForm();
  const p = targetProbability(config);
  if (p <= 0) { alert("목표 레어도의 확률이 0입니다. 설정을 확인하세요."); return; }
  const runs = Math.max(100, Number(document.getElementById("f-runs").value) || 5000);
  const res = simulate(freshRng(), p, config.pity, runs);
  const theory = expectedWithPity(p, config.pity);

  document.getElementById("sim-summary").innerHTML = [
    statCard("시뮬 평균", `${res.mean.toFixed(1)}회`, "green"),
    statCard("이론 기댓값", `${theory.toFixed(1)}회`, "gold"),
    statCard("표준편차", `${res.std.toFixed(1)}`),
    statCard("최댓값", `${res.max}회`),
  ].join("");

  renderHistogram(res.histogram, document.getElementById("hist-canvas"));

  const diff = Math.abs(res.mean - theory);
  const pct = theory ? (diff / theory) * 100 : 0;
  document.getElementById("lln-note").textContent =
    `🔍 큰 수의 법칙: ${runs.toLocaleString()}회 시뮬 평균(${res.mean.toFixed(1)})이 이론 기댓값(${theory.toFixed(1)})과 ${pct.toFixed(1)}% 차이입니다. 시행을 늘릴수록 더 가까워집니다.`;
}

function singleDraw() {
  syncFromForm();
  const p = targetProbability(config);
  const targetName = config.rarities[config.targetIndex]?.name ?? "목표";
  const draws = simulateOnce(freshRng(), p, config.pity);
  const box = document.getElementById("draw-result");
  box.innerHTML = "";
  // 마지막 칸이 목표 획득. 그 전은 미획득(·) 연출. 최대 10칸까지 표시.
  const show = Math.min(draws, 10);
  for (let i = 0; i < show; i += 1) {
    const isHit = i === show - 1;
    const pull = document.createElement("span");
    pull.className = "draw-pull" + (isHit ? " hit" : "");
    pull.textContent = isHit ? `🎉 ${targetName}` : "·";
    pull.style.animationDelay = `${i * 0.05}s`;
    box.appendChild(pull);
  }
  const note = document.createElement("span");
  note.className = "draw-pull";
  note.textContent = `${draws}번 만에 획득!`;
  box.appendChild(note);
}

/* ---------- 공통 ---------- */
function escapeHtml(s) {
  return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function escapeAttr(s) {
  return escapeHtml(s).replaceAll('"', "&quot;");
}

function initEvents() {
  document.getElementById("add-rarity").addEventListener("click", () => {
    syncFromForm();
    config.rarities.push({ name: `★${config.rarities.length + 1}`, p: 0.1, color: "#5b8cff" });
    config = createConfig(config); renderSetup();
  });
  document.getElementById("reset-btn").addEventListener("click", () => {
    clearConfig(); config = defaultConfig(); renderSetup();
  });
  document.getElementById("analyze-btn").addEventListener("click", () => {
    syncFromForm(); renderAnalysis();
    document.querySelector('.tab-btn[data-tab="analysis"]').click();
  });
  document.getElementById("run-sim").addEventListener("click", runSimulation);
  document.getElementById("draw-btn").addEventListener("click", singleDraw);
}

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  renderSetup();
  initEvents();
});
