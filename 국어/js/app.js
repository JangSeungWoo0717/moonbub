import { createArgument } from "./model.js";
import { computeScores } from "./scoring.js";
import { detectFallacies, FALLACY_RULES } from "./fallacy.js";
import { getRank, evaluateBadges, buildQuests, BADGE_DEFS } from "./game.js";
import { renderTree } from "./tree.js";
import { renderRadar, renderGrowthChart } from "./charts.js";
import {
  loadVersions, saveVersion, loadProfile, saveProfile, clearAll,
} from "./storage.js";

let currentArg = null;

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

/* ---------- 입력 폼 ---------- */
function addGroundRow(value = "") {
  const wrap = document.getElementById("grounds-wrap");
  const row = document.createElement("div");
  row.className = "ground-row";
  const ta = document.createElement("textarea");
  ta.className = "f-ground"; ta.rows = 2; ta.placeholder = "추가 근거";
  ta.value = value;
  row.appendChild(ta);
  wrap.appendChild(row);
}

function collectArgument() {
  const grounds = [...document.querySelectorAll(".f-ground")]
    .map((t) => t.value.trim()).filter(Boolean);
  return createArgument({
    title: document.getElementById("f-title").value.trim(),
    claim: document.getElementById("f-claim").value.trim(),
    grounds,
    warrant: document.getElementById("f-warrant").value.trim(),
    qualifier: document.getElementById("f-qualifier").value.trim(),
    rebuttal: document.getElementById("f-rebuttal").value.trim(),
  });
}

async function loadSample() {
  try {
    const res = await fetch("data/sample-arguments.json");
    const samples = await res.json();
    const s = samples[0];
    document.getElementById("f-title").value = s.title;
    document.getElementById("f-claim").value = s.claim;
    document.getElementById("f-warrant").value = s.warrant;
    document.getElementById("f-qualifier").value = s.qualifier;
    document.getElementById("f-rebuttal").value = s.rebuttal;
    document.querySelectorAll(".ground-row").forEach((r, i) => i > 0 && r.remove());
    document.querySelector(".f-ground").value = s.grounds[0] || "";
    s.grounds.slice(1).forEach((g) => addGroundRow(g));
  } catch {
    alert("예시를 불러오지 못했습니다. 로컬 서버로 열어 주세요.");
  }
}

function initForm() {
  document.getElementById("add-ground").addEventListener("click", () => addGroundRow());
  document.getElementById("load-sample").addEventListener("click", loadSample);
  document.getElementById("arg-form").addEventListener("submit", (e) => {
    e.preventDefault();
    analyzeAndRender(collectArgument());
  });
}

/* ---------- 분석 렌더 ---------- */
function renderQuests(scores, arg) {
  const panel = document.getElementById("quest-panel");
  const quests = buildQuests(scores, arg);
  panel.hidden = false;
  panel.innerHTML =
    `<h3>🎯 다음 퀘스트</h3><ul>${quests.map((q) => `<li>${escapeHtml(q.text)}</li>`).join("")}</ul>`;
}

function renderFallacies(fallacies) {
  const box = document.getElementById("fallacy-list");
  if (fallacies.length === 0) {
    box.innerHTML = `<div class="fallacy-item clean">✨ 감지된 논리 오류가 없습니다. 깔끔해요!</div>`;
    return;
  }
  box.innerHTML = fallacies
    .map((key) => {
      const rule = FALLACY_RULES.find((r) => r.key === key);
      return `<div class="fallacy-item">⚠️ <strong>${escapeHtml(rule.name)}</strong> 의심<br>
        <small>${escapeHtml(rule.hint)}</small></div>`;
    })
    .join("");
}

function renderBadges(badgeKeys) {
  const box = document.getElementById("badges");
  if (!badgeKeys.length) { box.innerHTML = `<span class="badge">아직 배지 없음 — 도전!</span>`; return; }
  box.innerHTML = badgeKeys
    .map((k) => {
      const def = BADGE_DEFS.find((b) => b.key === k);
      return `<span class="badge">${def.icon} ${escapeHtml(def.name)}</span>`;
    })
    .join("");
}

function analyzeAndRender(arg) {
  const fallacies = detectFallacies(arg);
  const scores = computeScores(arg, fallacies);
  const { rank, level, icon } = getRank(scores.total);

  const prev = loadVersions().find((v) => v.title && v.title === arg.title);
  const prevTotal = prev?.scores?.total ?? null;
  const badges = evaluateBadges(arg, scores, prevTotal);

  arg.scores = scores;
  arg.fallacies = fallacies;
  arg.rank = rank; arg.level = level; arg.badges = badges;
  currentArg = arg;

  document.getElementById("rank-banner").textContent = `${icon} ${rank} · Lv.${level}`;
  document.getElementById("gauge-fill").style.width = `${scores.total}%`;
  document.getElementById("gauge-text").textContent = `${scores.total} / 100`;
  renderBadges(badges);
  renderRadar(scores, document.getElementById("radar-canvas"));
  renderTree(arg, document.getElementById("tree-container"));
  renderFallacies(fallacies);
  renderQuests(scores, arg);

  document.querySelector('.tab-btn[data-tab="analysis"]').click();
}

/* ---------- 성장 / 저장 ---------- */
function saveCurrent() {
  if (!currentArg || !currentArg.scores) {
    alert("먼저 ‘분석하기’를 눌러 주세요."); return;
  }
  if (!currentArg.title) currentArg.title = `논증 ${new Date().toLocaleString("ko-KR")}`;
  saveVersion(currentArg);

  const profile = loadProfile();
  profile.totalAttempts += 1;
  profile.bestScore = Math.max(profile.bestScore, currentArg.scores.total);
  profile.unlockedBadges = [...new Set([...profile.unlockedBadges, ...currentArg.badges])];
  saveProfile(profile);

  renderGrowthTab();
  document.querySelector('.tab-btn[data-tab="growth"]').click();
}

function renderGrowthTab() {
  const versions = loadVersions();
  const profile = loadProfile();
  document.getElementById("profile-summary").textContent =
    `🏅 최고 ${profile.bestScore}점 · 도전 ${profile.totalAttempts}회 · 배지 ${profile.unlockedBadges.length}개`;

  const list = document.getElementById("version-list");
  list.innerHTML = versions.length
    ? versions
        .map(
          (v) => `<li><span>${escapeHtml(v.title)}</span>
            <span class="version-score">${v.scores?.total ?? 0}점 · ${escapeHtml(v.rank || "")}</span></li>`
        )
        .join("")
    : `<li>아직 저장된 버전이 없습니다.</li>`;

  if (versions.length)
    renderGrowthChart(versions, document.getElementById("growth-canvas"));
}

function initGrowth() {
  document.getElementById("save-btn").addEventListener("click", saveCurrent);
  document.getElementById("clear-btn").addEventListener("click", () => {
    if (confirm("모든 기록을 삭제할까요?")) { clearAll(); renderGrowthTab(); }
  });
  renderGrowthTab();
}

/* ---------- 공통 ---------- */
function escapeHtml(s) {
  return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initForm();
  initGrowth();
});
