# 논리 퀘스트 (ArguQuest) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 논증을 분해·시각화·점수화하고 게이미피케이션(랭크·배지·퀘스트)으로 재포장한, 빌드 없는 정적 웹 "논리 트레이닝 게임"을 만들어 GitHub Pages에 배포한다.

**Architecture:** 단일 HTML 페이지 + ES Module로 분리된 순수 JS. 점수/오류/게임 로직은 DOM 비의존 순수 함수로 작성해 Node 내장 테스트 러너(`node --test`)로 검증한다. 시각화는 Chart.js(CDN)와 DOM 렌더로 처리하고 브라우저에서 수동 확인한다. 상태는 `localStorage`에 저장한다.

**Tech Stack:** HTML5, CSS3(모바일 우선), 순수 ES Modules, Chart.js(CDN), Node `node --test`(개발 시 단위 테스트용), GitHub Pages + Actions.

## Global Constraints

- 빌드 단계 없음. 정적 파일을 그대로 GitHub Pages에서 서빙한다.
- 외부 의존성은 Chart.js(CDN) 하나로 제한. 그 외 런타임 라이브러리 금지.
- AI/LLM·서버·API 키·로그인 없음. 모든 로직은 클라이언트 측 결정론적 계산.
- 저장은 `localStorage` 키 두 개: `argumap_versions`, `argumap_profile`.
- `js/scoring.js`, `js/fallacy.js`, `js/game.js`, `js/model.js`는 DOM/브라우저 전역(`document`, `window`, `localStorage`, `Chart`) 비의존 순수 함수만 export 한다.
- 점수 척도: 5개 지표 각 0–20, 합계 0–100.
- 모든 텍스트(UI 카피)는 한국어.
- 모바일 우선 반응형. 터치 타깃 최소 44px.

---

## File Structure

```
package.json                    # type:module, test 스크립트 (node --test)
index.html                      # 단일 페이지, 4개 탭 섹션
styles/
  main.css                      # 기본 레이아웃·테마·폼·탭
  game.css                      # 랭크/배지/퀘스트/게이지 연출
  responsive.css                # 모바일 우선 미디어쿼리
js/
  model.js                      # 데이터 모델, 기본값, id 생성       (순수)
  scoring.js                    # 5개 지표 점수 계산                 (순수)
  fallacy.js                    # 오류 탐지 규칙 + 검사              (순수)
  game.js                       # 랭크·레벨·배지·퀘스트              (순수)
  storage.js                    # localStorage 저장/불러오기         (주입형)
  tree.js                       # 논증 구조 트리 렌더 (+순수 헬퍼)
  charts.js                     # Chart.js 레이더/성장 차트
  app.js                        # 탭 제어, 폼 이벤트, 연출, 조립
test/
  model.test.js
  scoring.test.js
  fallacy.test.js
  game.test.js
  storage.test.js
  tree.test.js
data/
  sample-arguments.json         # 예시 논증
.github/workflows/deploy.yml    # GitHub Pages 자동 배포
README.md                       # 소개 + 세특 서사 + 사용법
```

---

### Task 1: 프로젝트 스캐폴드 + 탭 내비게이션

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `styles/main.css`
- Create: `js/app.js`

**Interfaces:**
- Produces: 4개 탭(`input`, `analysis`, `growth`, `method`) 섹션과 `data-tab` 버튼. `app.js`의 탭 전환 로직.

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "arguquest",
  "version": "1.0.0",
  "description": "논리 퀘스트 - 논증 트레이닝 게임",
  "type": "module",
  "scripts": {
    "test": "node --test"
  },
  "license": "MIT"
}
```

- [ ] **Step 2: index.html 셸 작성**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>논리 퀘스트 — 논증 트레이닝 게임</title>
  <link rel="stylesheet" href="styles/main.css" />
  <link rel="stylesheet" href="styles/game.css" />
  <link rel="stylesheet" href="styles/responsive.css" />
</head>
<body>
  <header class="app-header">
    <h1>🎯 논리 퀘스트</h1>
    <p class="tagline">논증을 설계하고 레벨업하라</p>
  </header>

  <nav class="tabbar" role="tablist">
    <button class="tab-btn active" data-tab="input" role="tab">✍️ 입력</button>
    <button class="tab-btn" data-tab="analysis" role="tab">📊 분석</button>
    <button class="tab-btn" data-tab="growth" role="tab">📈 성장</button>
    <button class="tab-btn" data-tab="method" role="tab">📖 방법론</button>
  </nav>

  <main>
    <section id="input" class="tab-panel active" role="tabpanel"><h2>논증 입력</h2></section>
    <section id="analysis" class="tab-panel" role="tabpanel"><h2>분석 결과</h2></section>
    <section id="growth" class="tab-panel" role="tabpanel"><h2>성장 기록</h2></section>
    <section id="method" class="tab-panel" role="tabpanel"><h2>방법론</h2></section>
  </main>

  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 3: styles/main.css 기본 스타일 작성**

```css
:root {
  --bg: #0f1226;
  --surface: #1a1f3d;
  --surface-2: #232a52;
  --text: #e8eaf6;
  --muted: #9aa0c3;
  --accent: #5b8cff;
  --accent-2: #00d4a0;
  --danger: #ff6b6b;
  --radius: 12px;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: "Pretendard", system-ui, -apple-system, "Malgun Gothic", sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
}
.app-header { text-align: center; padding: 20px 16px 8px; }
.app-header h1 { margin: 0; font-size: 1.6rem; }
.tagline { margin: 4px 0 0; color: var(--muted); font-size: 0.9rem; }
.tabbar {
  display: flex; gap: 6px; padding: 10px 12px;
  position: sticky; top: 0; background: var(--bg); z-index: 10;
  border-bottom: 1px solid var(--surface-2);
}
.tab-btn {
  flex: 1; min-height: 44px; border: none; border-radius: var(--radius);
  background: var(--surface); color: var(--muted);
  font-size: 0.9rem; cursor: pointer; transition: background .2s, color .2s;
}
.tab-btn.active { background: var(--accent); color: #fff; font-weight: 600; }
main { padding: 16px; max-width: 960px; margin: 0 auto; }
.tab-panel { display: none; }
.tab-panel.active { display: block; }
h2 { font-size: 1.2rem; margin-top: 0; }
button { font-family: inherit; }
```

- [ ] **Step 4: js/app.js 탭 전환 로직 작성**

```js
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

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
});
```

- [ ] **Step 5: 브라우저에서 확인**

`index.html`을 브라우저로 연다(또는 `python -m http.server`로 서빙). 4개 탭이 보이고, 클릭하면 해당 섹션만 표시되는지 확인.
Expected: 탭 클릭 시 활성 탭만 강조되고 패널이 전환됨.

- [ ] **Step 6: 커밋**

```bash
git add package.json index.html styles/main.css js/app.js
git commit -m "feat: 프로젝트 스캐폴드 및 탭 내비게이션"
```

---

### Task 2: 데이터 모델 (model.js)

**Files:**
- Create: `js/model.js`
- Test: `test/model.test.js`

**Interfaces:**
- Produces:
  - `createArgument(data = {})` → `{ id, title, createdAt, claim, grounds[], warrant, qualifier, rebuttal, scores, fallacies[], rank, level, badges[] }`
  - `createEmptyProfile()` → `{ unlockedBadges: [], bestScore: 0, totalAttempts: 0 }`
  - `generateId()` → string

- [ ] **Step 1: 실패하는 테스트 작성**

```js
// test/model.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { createArgument, createEmptyProfile, generateId } from "../js/model.js";

test("createArgument는 기본값을 채운다", () => {
  const a = createArgument();
  assert.equal(a.claim, "");
  assert.deepEqual(a.grounds, []);
  assert.equal(a.warrant, "");
  assert.equal(a.qualifier, "");
  assert.equal(a.rebuttal, "");
  assert.deepEqual(a.fallacies, []);
  assert.deepEqual(a.badges, []);
  assert.equal(typeof a.id, "string");
  assert.ok(a.id.length > 0);
});

test("createArgument는 전달된 데이터를 덮어쓴다", () => {
  const a = createArgument({ claim: "사형제 폐지", grounds: ["근거1"] });
  assert.equal(a.claim, "사형제 폐지");
  assert.deepEqual(a.grounds, ["근거1"]);
});

test("createEmptyProfile 기본값", () => {
  const p = createEmptyProfile();
  assert.deepEqual(p, { unlockedBadges: [], bestScore: 0, totalAttempts: 0 });
});

test("generateId는 매번 다른 값을 반환한다", () => {
  assert.notEqual(generateId(), generateId());
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test test/model.test.js`
Expected: FAIL — `Cannot find module '../js/model.js'`

- [ ] **Step 3: js/model.js 구현**

```js
let __counter = 0;
export function generateId() {
  __counter += 1;
  return `arg_${Date.now().toString(36)}_${__counter}`;
}

export function createArgument(data = {}) {
  return {
    id: data.id ?? generateId(),
    title: data.title ?? "",
    createdAt: data.createdAt ?? Date.now(),
    claim: data.claim ?? "",
    grounds: Array.isArray(data.grounds) ? data.grounds.slice() : [],
    warrant: data.warrant ?? "",
    qualifier: data.qualifier ?? "",
    rebuttal: data.rebuttal ?? "",
    scores: data.scores ?? null,
    fallacies: Array.isArray(data.fallacies) ? data.fallacies.slice() : [],
    rank: data.rank ?? "",
    level: data.level ?? 0,
    badges: Array.isArray(data.badges) ? data.badges.slice() : [],
  };
}

export function createEmptyProfile() {
  return { unlockedBadges: [], bestScore: 0, totalAttempts: 0 };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test test/model.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add js/model.js test/model.test.js
git commit -m "feat: 논증 데이터 모델 추가"
```

---

### Task 3: 점수 산정 엔진 (scoring.js)

**Files:**
- Create: `js/scoring.js`
- Test: `test/scoring.test.js`

**Interfaces:**
- Consumes: `createArgument`의 Argument 형태(`claim, grounds[], warrant, qualifier, rebuttal`).
- Produces:
  - `scoreGroundsSufficiency(arg)` → 0–20
  - `scoreLogicalConnection(arg)` → 0–20
  - `scoreCounterHandling(arg)` → 0–20
  - `scoreClaimClarity(arg)` → 0–20
  - `scoreFallacyCleanliness(fallacies)` → 0–20 (`fallacies`는 string[])
  - `computeScores(arg, fallacies = [])` → `{ groundsSufficiency, logicalConnection, counterHandling, claimClarity, fallacyCleanliness, total }`

- [ ] **Step 1: 실패하는 테스트 작성**

```js
// test/scoring.test.js
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test test/scoring.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: js/scoring.js 구현**

```js
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const CONCRETE = ["%", "명", "년", "원", "통계", "자료", "연구", "에 따르면", "조사"];
const VAGUE = ["등등", "뭔가", "아마", "것 같다", "그런 듯", "대충"];
const COUNTER_MARKERS = ["그러나", "하지만", "반박", "그럼에도", "반대로", "오히려"];

export function scoreGroundsSufficiency(arg) {
  const grounds = (arg.grounds || []).filter((g) => g.trim().length > 0);
  if (grounds.length === 0) return 0;
  let score = clamp(grounds.length, 0, 3) * 4; // 개수: 최대 12
  const text = grounds.join(" ");
  const concrete = CONCRETE.filter((k) => text.includes(k)).length;
  score += clamp(concrete * 3, 0, 8); // 구체성: 최대 8
  return clamp(score, 0, 20);
}

export function scoreLogicalConnection(arg) {
  const w = (arg.warrant || "").trim();
  if (w.length === 0) return 0;
  if (w.length < 10) return 8;
  if (w.length < 30) return 14;
  return 20;
}

export function scoreCounterHandling(arg) {
  const r = (arg.rebuttal || "").trim();
  if (r.length === 0) return 0;
  let score = 8; // 반론 입력만으로 기본점
  if (COUNTER_MARKERS.some((m) => r.includes(m))) score += 12;
  return clamp(score, 0, 20);
}

export function scoreClaimClarity(arg) {
  const c = (arg.claim || "").trim();
  if (c.length === 0) return 0;
  let score = 14;
  if (c.length >= 8 && c.length <= 60) score += 6; // 적절한 길이 가점
  const vague = VAGUE.filter((v) => c.includes(v)).length;
  score -= vague * 5;
  return clamp(score, 0, 20);
}

export function scoreFallacyCleanliness(fallacies = []) {
  return clamp(20 - fallacies.length * 5, 0, 20);
}

export function computeScores(arg, fallacies = []) {
  const groundsSufficiency = scoreGroundsSufficiency(arg);
  const logicalConnection = scoreLogicalConnection(arg);
  const counterHandling = scoreCounterHandling(arg);
  const claimClarity = scoreClaimClarity(arg);
  const fallacyCleanliness = scoreFallacyCleanliness(fallacies);
  const total =
    groundsSufficiency + logicalConnection + counterHandling +
    claimClarity + fallacyCleanliness;
  return {
    groundsSufficiency, logicalConnection, counterHandling,
    claimClarity, fallacyCleanliness, total,
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test test/scoring.test.js`
Expected: PASS (6 tests)

- [ ] **Step 5: 커밋**

```bash
git add js/scoring.js test/scoring.test.js
git commit -m "feat: 5개 지표 점수 산정 엔진 추가"
```

---

### Task 4: 오류 탐지 (fallacy.js)

**Files:**
- Create: `js/fallacy.js`
- Test: `test/fallacy.test.js`

**Interfaces:**
- Consumes: Argument(`claim, grounds[]`).
- Produces:
  - `FALLACY_RULES` → `Array<{ key, name, hint, test(arg) => boolean }>`
  - `detectFallacies(arg)` → `string[]` (탐지된 규칙 key 배열)

- [ ] **Step 1: 실패하는 테스트 작성**

```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test test/fallacy.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: js/fallacy.js 구현**

```js
const hasAny = (text, words) => words.some((w) => text.includes(w));

export const FALLACY_RULES = [
  {
    key: "hasty_generalization",
    name: "성급한 일반화",
    hint: "‘모두/항상/절대’ 같은 단정 표현은 충분한 근거가 필요해요.",
    test: (arg) => {
      const c = arg.claim || "";
      const enoughGrounds = (arg.grounds || []).filter((g) => g.trim()).length >= 2;
      return hasAny(c, ["모두", "항상", "절대", "누구나", "예외 없이"]) && !enoughGrounds;
    },
  },
  {
    key: "false_dilemma",
    name: "흑백논리",
    hint: "선택지를 둘로만 좁히지 않았는지 확인하세요.",
    test: (arg) =>
      hasAny(arg.claim || "", ["아니면", "둘 중 하나", "오직", "밖에 없다"]),
  },
  {
    key: "ad_hominem",
    name: "인신공격",
    hint: "주장 대신 사람을 공격하고 있지 않은지 보세요.",
    test: (arg) =>
      hasAny([arg.claim, ...(arg.grounds || [])].join(" "), ["그 사람은", "너는", "멍청", "무식"]),
  },
  {
    key: "appeal_to_authority",
    name: "권위에 호소",
    hint: "‘유명한/전문가가 그랬다’는 그 자체로 근거가 되지 않아요.",
    test: (arg) => {
      const g = (arg.grounds || []).join(" ");
      return hasAny(g, ["유명한", "전문가가 그랬", "권위자"]) &&
        !hasAny(g, ["통계", "자료", "연구", "%"]);
    },
  },
  {
    key: "circular",
    name: "순환논법",
    hint: "근거가 주장을 거의 그대로 반복하고 있지 않은지 보세요.",
    test: (arg) => {
      const claim = (arg.claim || "").replace(/\s/g, "");
      if (claim.length < 6) return false;
      return (arg.grounds || []).some((g) => g.replace(/\s/g, "").includes(claim));
    },
  },
];

export function detectFallacies(arg) {
  return FALLACY_RULES.filter((r) => r.test(arg)).map((r) => r.key);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test test/fallacy.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add js/fallacy.js test/fallacy.test.js
git commit -m "feat: 규칙 기반 논리 오류 탐지 추가"
```

---

### Task 5: 게이미피케이션 로직 (game.js)

**Files:**
- Create: `js/game.js`
- Test: `test/game.test.js`

**Interfaces:**
- Consumes: `ScoreResult`(특히 `total`), Argument, `prevTotal:number|null`.
- Produces:
  - `getRank(total)` → `{ rank: string, level: number, icon: string }`
  - `BADGE_DEFS` → `Array<{ key, name, icon, test(arg, scores, prevTotal) => boolean }>`
  - `evaluateBadges(arg, scores, prevTotal = null)` → `string[]`
  - `buildQuests(scores, arg)` → `Array<{ text: string }>`

- [ ] **Step 1: 실패하는 테스트 작성**

```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test test/game.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: js/game.js 구현**

```js
const RANKS = [
  { min: 0, max: 40, rank: "견습 논객", level: 1, icon: "🥉" },
  { min: 41, max: 60, rank: "논객", level: 2, icon: "🥈" },
  { min: 61, max: 80, rank: "명논객", level: 3, icon: "🥇" },
  { min: 81, max: 100, rank: "논리 마스터", level: 4, icon: "💎" },
];

export function getRank(total) {
  const r = RANKS.find((x) => total >= x.min && total <= x.max) ?? RANKS[0];
  return { rank: r.rank, level: r.level, icon: r.icon };
}

const COUNTER_MARKERS = ["그러나", "하지만", "반박", "그럼에도"];

export const BADGE_DEFS = [
  {
    key: "ground_king", name: "근거왕", icon: "📚",
    test: (arg) => (arg.grounds || []).filter((g) => g.trim()).length >= 3,
  },
  {
    key: "rebuttal_master", name: "반론 마스터", icon: "🛡️",
    test: (arg) => {
      const r = arg.rebuttal || "";
      return r.trim().length > 0 && COUNTER_MARKERS.some((m) => r.includes(m));
    },
  },
  {
    key: "clean", name: "오류 청정", icon: "✨",
    test: (arg, scores) => scores.fallacyCleanliness === 20,
  },
  {
    key: "perfect", name: "퍼펙트", icon: "🏆",
    test: (arg, scores) => scores.total === 100,
  },
  {
    key: "grower", name: "성장러", icon: "📈",
    test: (arg, scores, prevTotal) => prevTotal != null && scores.total > prevTotal,
  },
];

export function evaluateBadges(arg, scores, prevTotal = null) {
  return BADGE_DEFS.filter((b) => {
    try { return b.test(arg, scores, prevTotal); } catch { return false; }
  }).map((b) => b.key);
}

export function buildQuests(scores, arg) {
  const quests = [];
  if (scores.groundsSufficiency < 12)
    quests.push({ text: "근거를 1개 더, 수치·출처를 담아 추가하면 점수가 올라요 (근거왕 📚 도전!)" });
  if (scores.logicalConnection < 14)
    quests.push({ text: "주장과 근거를 잇는 ‘전제·보강’을 구체적으로 써 보세요." });
  if (scores.counterHandling < 12)
    quests.push({ text: "예상 반론을 적고 ‘그러나/하지만’으로 반박해 보세요 (반론 마스터 🛡️)." });
  if (scores.claimClarity < 14)
    quests.push({ text: "주장에서 모호한 표현을 빼고 한 문장으로 분명히 다듬어 보세요." });
  if (scores.fallacyCleanliness < 20)
    quests.push({ text: "감지된 논리 오류를 점검 탭에서 확인하고 수정해 보세요." });
  if (quests.length === 0)
    quests.push({ text: "훌륭해요! 다른 주제로도 도전해 최고 기록을 갱신해 보세요." });
  return quests;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test test/game.test.js`
Expected: PASS (5 tests)

- [ ] **Step 5: 커밋**

```bash
git add js/game.js test/game.test.js
git commit -m "feat: 랭크/배지/퀘스트 게이미피케이션 로직 추가"
```

---

### Task 6: 저장소 (storage.js)

**Files:**
- Create: `js/storage.js`
- Test: `test/storage.test.js`

**Interfaces:**
- Produces (모든 함수는 마지막 인자로 `store = globalThis.localStorage` 주입 가능):
  - `loadVersions(store?)` → `Argument[]`
  - `saveVersion(arg, store?)` → `Argument[]` (저장 후 전체 목록)
  - `loadProfile(store?)` → `Profile`
  - `saveProfile(profile, store?)` → `Profile`
  - `clearAll(store?)` → void
- 키: `argumap_versions`, `argumap_profile`.

- [ ] **Step 1: 실패하는 테스트 작성**

```js
// test/storage.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadVersions, saveVersion, loadProfile, saveProfile, clearAll } from "../js/storage.js";
import { createArgument, createEmptyProfile } from "../js/model.js";

function makeStore() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

test("빈 저장소는 빈 배열/기본 프로필을 반환", () => {
  const s = makeStore();
  assert.deepEqual(loadVersions(s), []);
  assert.deepEqual(loadProfile(s), createEmptyProfile());
});

test("saveVersion 후 loadVersions로 조회 가능", () => {
  const s = makeStore();
  const arg = createArgument({ title: "초안", claim: "주장" });
  const all = saveVersion(arg, s);
  assert.equal(all.length, 1);
  assert.equal(loadVersions(s)[0].title, "초안");
});

test("saveProfile/loadProfile 왕복", () => {
  const s = makeStore();
  saveProfile({ unlockedBadges: ["perfect"], bestScore: 100, totalAttempts: 3 }, s);
  assert.equal(loadProfile(s).bestScore, 100);
});

test("손상된 JSON은 기본값으로 복구", () => {
  const s = makeStore();
  s.setItem("argumap_versions", "{not json");
  assert.deepEqual(loadVersions(s), []);
});

test("clearAll은 모두 비운다", () => {
  const s = makeStore();
  saveVersion(createArgument(), s);
  clearAll(s);
  assert.deepEqual(loadVersions(s), []);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test test/storage.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: js/storage.js 구현**

```js
import { createEmptyProfile } from "./model.js";

const VERSIONS_KEY = "argumap_versions";
const PROFILE_KEY = "argumap_profile";
const defaultStore = () => globalThis.localStorage;

function readJSON(store, key, fallback) {
  try {
    const raw = store.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function loadVersions(store = defaultStore()) {
  const v = readJSON(store, VERSIONS_KEY, []);
  return Array.isArray(v) ? v : [];
}

export function saveVersion(arg, store = defaultStore()) {
  const all = loadVersions(store);
  all.unshift(arg);
  store.setItem(VERSIONS_KEY, JSON.stringify(all));
  return all;
}

export function loadProfile(store = defaultStore()) {
  return readJSON(store, PROFILE_KEY, createEmptyProfile());
}

export function saveProfile(profile, store = defaultStore()) {
  store.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function clearAll(store = defaultStore()) {
  store.removeItem(VERSIONS_KEY);
  store.removeItem(PROFILE_KEY);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test test/storage.test.js`
Expected: PASS (5 tests)

- [ ] **Step 5: 커밋**

```bash
git add js/storage.js test/storage.test.js
git commit -m "feat: localStorage 저장소 모듈 추가"
```

---

### Task 7: 논증 구조 트리 (tree.js)

**Files:**
- Create: `js/tree.js`
- Test: `test/tree.test.js`

**Interfaces:**
- Consumes: Argument.
- Produces:
  - `buildTreeData(arg)` → `{ claim, branches: Array<{ label, value }> }` (순수, 테스트 대상)
  - `renderTree(arg, container)` → void (DOM에 트리 HTML 주입)

- [ ] **Step 1: 실패하는 테스트 작성 (순수 헬퍼만 테스트)**

```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test test/tree.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: js/tree.js 구현**

```js
export function buildTreeData(arg) {
  const branches = [];
  const grounds = (arg.grounds || []).filter((g) => g.trim());
  if (grounds.length) branches.push({ label: "근거", value: grounds.join(" / ") });
  if ((arg.warrant || "").trim()) branches.push({ label: "전제·보강", value: arg.warrant });
  if ((arg.qualifier || "").trim()) branches.push({ label: "한정", value: arg.qualifier });
  if ((arg.rebuttal || "").trim()) branches.push({ label: "반례·반론", value: arg.rebuttal });
  return { claim: arg.claim || "(주장 없음)", branches };
}

export function renderTree(arg, container) {
  const tree = buildTreeData(arg);
  const branchesHtml = tree.branches
    .map(
      (b) => `
      <div class="tree-branch">
        <div class="tree-connector"></div>
        <div class="tree-node tree-node--branch">
          <span class="tree-label">${escapeHtml(b.label)}</span>
          <span class="tree-value">${escapeHtml(b.value)}</span>
        </div>
      </div>`
    )
    .join("");
  container.innerHTML = `
    <div class="tree">
      <div class="tree-node tree-node--claim">
        <span class="tree-label">주장</span>
        <span class="tree-value">${escapeHtml(tree.claim)}</span>
      </div>
      <div class="tree-branches">${branchesHtml}</div>
    </div>`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test test/tree.test.js`
Expected: PASS (2 tests)

- [ ] **Step 5: 커밋**

```bash
git add js/tree.js test/tree.test.js
git commit -m "feat: 논증 구조 트리 렌더 추가"
```

---

### Task 8: 차트 (charts.js)

**Files:**
- Create: `js/charts.js`
- Modify: `index.html` (Chart.js CDN script 추가)

**Interfaces:**
- Consumes: `ScoreResult`, `Argument[]`, canvas 요소.
- Produces:
  - `renderRadar(scores, canvas)` → void (레이더 차트, 기존 인스턴스 파기 후 재생성)
  - `renderGrowthChart(versions, canvas)` → void (저장 버전 점수 추이 막대/선)

- [ ] **Step 1: index.html에 Chart.js CDN 추가**

`</body>` 직전, `app.js` 스크립트보다 **앞에** 추가:

```html
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <script type="module" src="js/app.js"></script>
```

- [ ] **Step 2: js/charts.js 구현**

```js
const instances = new WeakMap();

function reset(canvas) {
  const existing = instances.get(canvas);
  if (existing) existing.destroy();
}

export function renderRadar(scores, canvas) {
  reset(canvas);
  const chart = new Chart(canvas, {
    type: "radar",
    data: {
      labels: ["근거 충분성", "논리 연결성", "반론 대응력", "주장 명료성", "오류 청결도"],
      datasets: [{
        label: "논증 건강도",
        data: [
          scores.groundsSufficiency, scores.logicalConnection, scores.counterHandling,
          scores.claimClarity, scores.fallacyCleanliness,
        ],
        backgroundColor: "rgba(91,140,255,0.3)",
        borderColor: "#5b8cff", borderWidth: 2, pointBackgroundColor: "#00d4a0",
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { r: { min: 0, max: 20, ticks: { stepSize: 5, color: "#9aa0c3" },
        grid: { color: "#2a2f55" }, angleLines: { color: "#2a2f55" },
        pointLabels: { color: "#e8eaf6", font: { size: 11 } } } },
      plugins: { legend: { labels: { color: "#e8eaf6" } } },
    },
  });
  instances.set(canvas, chart);
}

export function renderGrowthChart(versions, canvas) {
  reset(canvas);
  const ordered = versions.slice().reverse(); // 오래된→최신
  const chart = new Chart(canvas, {
    type: "line",
    data: {
      labels: ordered.map((v, i) => v.title || `v${i + 1}`),
      datasets: [{
        label: "종합 점수", data: ordered.map((v) => v.scores?.total ?? 0),
        borderColor: "#00d4a0", backgroundColor: "rgba(0,212,160,0.2)",
        fill: true, tension: 0.3,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { y: { min: 0, max: 100, ticks: { color: "#9aa0c3" }, grid: { color: "#2a2f55" } },
        x: { ticks: { color: "#9aa0c3" }, grid: { color: "#2a2f55" } } },
      plugins: { legend: { labels: { color: "#e8eaf6" } } },
    },
  });
  instances.set(canvas, chart);
}
```

- [ ] **Step 3: 커밋** (브라우저 통합 확인은 Task 10에서)

```bash
git add js/charts.js index.html
git commit -m "feat: 레이더/성장 차트 모듈 추가"
```

---

### Task 9: 입력 탭 UI + 폼 처리

**Files:**
- Modify: `index.html` (입력 탭 폼 마크업)
- Modify: `js/app.js` (폼 → Argument 수집, 근거 동적 추가)
- Modify: `styles/main.css` (폼 스타일)

**Interfaces:**
- Consumes: `createArgument`.
- Produces: 전역 함수 `collectArgument()` → Argument; "분석하기" 버튼이 `analyzeAndRender(arg)`(Task 10) 호출.

- [ ] **Step 1: index.html 입력 탭 마크업 교체**

`<section id="input" ...>` 내용을 교체:

```html
    <section id="input" class="tab-panel active" role="tabpanel">
      <h2>✍️ 논증 입력</h2>
      <form id="arg-form" class="arg-form">
        <label>제목(주제)
          <input type="text" id="f-title" placeholder="예: 사형제 폐지 - 초안" />
        </label>
        <label>주장 (Claim)
          <textarea id="f-claim" rows="2" placeholder="당신의 핵심 주장"></textarea>
        </label>
        <div id="grounds-wrap">
          <span class="field-label">근거 (Grounds)</span>
          <div class="ground-row">
            <textarea class="f-ground" rows="2" placeholder="근거 1 (수치·출처를 담으면 좋아요)"></textarea>
          </div>
        </div>
        <button type="button" id="add-ground" class="btn-ghost">＋ 근거 추가</button>
        <label>전제·보강 (Warrant)
          <textarea id="f-warrant" rows="2" placeholder="주장과 근거를 잇는 이유"></textarea>
        </label>
        <label>한정 (Qualifier)
          <input type="text" id="f-qualifier" placeholder="예: 대체로, 특정 조건에서" />
        </label>
        <label>반례·반론 (Rebuttal)
          <textarea id="f-rebuttal" rows="2" placeholder="예상 반론과 그에 대한 대응"></textarea>
        </label>
        <div class="form-actions">
          <button type="button" id="load-sample" class="btn-ghost">예시 불러오기</button>
          <button type="submit" id="analyze-btn" class="btn-primary">분석하기 🚀</button>
        </div>
      </form>
      <div id="quest-panel" class="quest-panel" hidden></div>
    </section>
```

- [ ] **Step 2: styles/main.css에 폼 스타일 추가**

```css
.arg-form label, .field-label { display: block; margin: 12px 0 4px; font-weight: 600; }
.arg-form input, .arg-form textarea {
  width: 100%; padding: 10px; border-radius: var(--radius);
  border: 1px solid var(--surface-2); background: var(--surface); color: var(--text);
  font-family: inherit; font-size: 0.95rem;
}
.ground-row { margin-bottom: 8px; }
.btn-ghost {
  min-height: 44px; padding: 0 14px; border-radius: var(--radius);
  background: var(--surface-2); color: var(--text); border: none; cursor: pointer;
}
.btn-primary {
  min-height: 44px; padding: 0 20px; border-radius: var(--radius);
  background: var(--accent); color: #fff; border: none; font-weight: 700; cursor: pointer;
}
.form-actions { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
```

- [ ] **Step 3: js/app.js에 폼 수집 로직 추가**

`app.js` 상단에 import 추가하고, `initTabs()` 아래에 함수들을 추가:

```js
import { createArgument } from "./model.js";

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

function initForm() {
  document.getElementById("add-ground").addEventListener("click", () => addGroundRow());
  document.getElementById("arg-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const arg = collectArgument();
    analyzeAndRender(arg); // Task 10에서 정의
  });
}
```

그리고 `DOMContentLoaded` 콜백에 `initForm();` 추가.

- [ ] **Step 4: 브라우저에서 확인**

페이지를 열고 근거 추가 버튼으로 입력칸이 늘어나는지, "분석하기" 클릭 시 콘솔 에러만(아직 `analyzeAndRender` 미정의) 나는지 확인.
Expected: 근거 행 추가 동작. (제출 시 `analyzeAndRender is not defined` — 다음 태스크에서 해결)

- [ ] **Step 5: 커밋**

```bash
git add index.html styles/main.css js/app.js
git commit -m "feat: 입력 탭 폼과 근거 동적 추가 구현"
```

---

### Task 10: 분석 탭 렌더링 (점수·랭크·배지·트리·차트·오류)

**Files:**
- Modify: `index.html` (분석 탭 마크업)
- Modify: `js/app.js` (`analyzeAndRender` 구현)
- Modify: `styles/game.css` (게이지·랭크·배지·오류 스타일 — 신규 파일)

**Interfaces:**
- Consumes: `computeScores`, `detectFallacies`, `FALLACY_RULES`, `getRank`, `evaluateBadges`, `buildQuests`, `renderTree`, `renderRadar`.
- Produces: `analyzeAndRender(arg)` → void. 모듈 스코프 `currentArg`에 최신 분석 결과 보관(Task 11 저장에서 사용).

- [ ] **Step 1: index.html 분석 탭 마크업 교체**

```html
    <section id="analysis" class="tab-panel" role="tabpanel">
      <h2>📊 분석 결과</h2>
      <div id="rank-banner" class="rank-banner"></div>
      <div class="score-gauge"><div id="gauge-fill" class="gauge-fill"></div>
        <span id="gauge-text" class="gauge-text">0</span></div>
      <div id="badges" class="badges"></div>
      <div class="chart-box"><canvas id="radar-canvas"></canvas></div>
      <h3>논증 구조</h3>
      <div id="tree-container"></div>
      <h3>논리 오류 점검</h3>
      <div id="fallacy-list" class="fallacy-list"></div>
      <button type="button" id="save-btn" class="btn-primary">이 버전 저장 💾</button>
    </section>
```

- [ ] **Step 2: styles/game.css 작성**

```css
.rank-banner {
  text-align: center; font-size: 1.3rem; font-weight: 800; padding: 12px;
  border-radius: var(--radius); background: var(--surface-2); margin-bottom: 12px;
}
.score-gauge {
  position: relative; height: 28px; background: var(--surface-2);
  border-radius: 999px; overflow: hidden; margin-bottom: 12px;
}
.gauge-fill {
  height: 100%; width: 0%; border-radius: 999px;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
  transition: width 0.8s ease;
}
.gauge-text {
  position: absolute; inset: 0; display: flex; align-items: center;
  justify-content: center; font-weight: 700; color: #fff;
}
.badges { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.badge {
  background: var(--surface-2); padding: 6px 10px; border-radius: 999px;
  font-size: 0.85rem; animation: pop .4s ease;
}
@keyframes pop { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.chart-box { position: relative; height: 280px; margin: 12px 0; }
.tree-node { background: var(--surface-2); border-radius: var(--radius); padding: 10px; margin: 6px 0; }
.tree-node--claim { border: 2px solid var(--accent); }
.tree-label { display: block; font-size: 0.75rem; color: var(--muted); }
.tree-value { font-weight: 600; }
.tree-branches { padding-left: 16px; border-left: 2px dashed var(--surface-2); }
.fallacy-list { display: flex; flex-direction: column; gap: 8px; }
.fallacy-item {
  background: rgba(255,107,107,0.12); border: 1px solid var(--danger);
  border-radius: var(--radius); padding: 10px;
}
.fallacy-item.clean { background: rgba(0,212,160,0.12); border-color: var(--accent-2); }
.quest-panel { margin-top: 16px; background: var(--surface-2); border-radius: var(--radius); padding: 12px; }
.quest-panel h3 { margin: 0 0 8px; }
.quest-panel li { margin: 4px 0; }
```

- [ ] **Step 3: js/app.js에 analyzeAndRender 구현**

상단 import 확장:

```js
import { createArgument } from "./model.js";
import { computeScores } from "./scoring.js";
import { detectFallacies, FALLACY_RULES } from "./fallacy.js";
import { getRank, evaluateBadges, buildQuests, BADGE_DEFS } from "./game.js";
import { renderTree } from "./tree.js";
import { renderRadar } from "./charts.js";
import { loadVersions } from "./storage.js";
```

함수 추가:

```js
let currentArg = null;

function renderQuests(scores, arg) {
  const panel = document.getElementById("quest-panel");
  const quests = buildQuests(scores, arg);
  panel.hidden = false;
  panel.innerHTML =
    `<h3>🎯 다음 퀘스트</h3><ul>${quests.map((q) => `<li>${q.text}</li>`).join("")}</ul>`;
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
      return `<div class="fallacy-item">⚠️ <strong>${rule.name}</strong> 의심<br>
        <small>${rule.hint}</small></div>`;
    })
    .join("");
}

function renderBadges(badgeKeys) {
  const box = document.getElementById("badges");
  if (!badgeKeys.length) { box.innerHTML = `<span class="badge">아직 배지 없음 — 도전!</span>`; return; }
  box.innerHTML = badgeKeys
    .map((k) => {
      const def = BADGE_DEFS.find((b) => b.key === k);
      return `<span class="badge">${def.icon} ${def.name}</span>`;
    })
    .join("");
}

function analyzeAndRender(arg) {
  const fallacies = detectFallacies(arg);
  const scores = computeScores(arg, fallacies);
  const { rank, level, icon } = getRank(scores.total);

  // 직전 동일 제목 버전과 비교 → 성장러 배지
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

  // 분석 탭으로 전환
  document.querySelector('.tab-btn[data-tab="analysis"]').click();
}
```

- [ ] **Step 4: 브라우저 통합 확인**

폼에 논증을 입력하고 "분석하기" 클릭 → 분석 탭으로 전환되며 랭크 배너, 게이지, 레이더 차트, 트리, 오류 목록, 배지, 퀘스트가 모두 표시되는지 확인.
Expected: 모든 요소 렌더링, 콘솔 에러 없음.

- [ ] **Step 5: 커밋**

```bash
git add index.html styles/game.css js/app.js
git commit -m "feat: 분석 탭 렌더링(점수/랭크/배지/트리/차트/오류/퀘스트)"
```

---

### Task 11: 성장 탭 (저장·버전 목록·전후 비교·프로필)

**Files:**
- Modify: `index.html` (성장 탭 마크업)
- Modify: `js/app.js` (저장 처리, 버전 목록, 성장 차트, 프로필 갱신)

**Interfaces:**
- Consumes: `saveVersion`, `loadVersions`, `loadProfile`, `saveProfile`, `renderGrowthChart`, `currentArg`.
- Produces: `saveCurrent()`, `renderGrowthTab()`.

- [ ] **Step 1: index.html 성장 탭 마크업 교체**

```html
    <section id="growth" class="tab-panel" role="tabpanel">
      <h2>📈 성장 기록</h2>
      <div id="profile-summary" class="rank-banner"></div>
      <div class="chart-box"><canvas id="growth-canvas"></canvas></div>
      <h3>저장된 버전</h3>
      <ul id="version-list" class="version-list"></ul>
      <button type="button" id="clear-btn" class="btn-ghost">전체 기록 삭제</button>
    </section>
```

- [ ] **Step 2: styles/main.css에 목록 스타일 추가**

```css
.version-list { list-style: none; padding: 0; }
.version-list li {
  background: var(--surface); border-radius: var(--radius);
  padding: 10px 12px; margin-bottom: 8px; display: flex;
  justify-content: space-between; align-items: center;
}
.version-score { font-weight: 700; color: var(--accent-2); }
```

- [ ] **Step 3: js/app.js에 저장·성장 탭 로직 추가**

import에 추가: `saveVersion, loadProfile, saveProfile, clearAll`, 그리고 `renderGrowthChart`.

```js
import {
  loadVersions, saveVersion, loadProfile, saveProfile, clearAll,
} from "./storage.js";
import { renderRadar, renderGrowthChart } from "./charts.js";
```

함수 추가:

```js
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

function escapeHtml(s) {
  return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function initGrowth() {
  document.getElementById("save-btn").addEventListener("click", saveCurrent);
  document.getElementById("clear-btn").addEventListener("click", () => {
    if (confirm("모든 기록을 삭제할까요?")) { clearAll(); renderGrowthTab(); }
  });
  renderGrowthTab();
}
```

`DOMContentLoaded` 콜백에 `initGrowth();` 추가.

- [ ] **Step 4: 브라우저 통합 확인**

논증 분석 → "이 버전 저장" → 성장 탭에 프로필 요약·버전 목록·성장 차트가 보이는지 확인. 같은 제목으로 점수를 올려 다시 저장하면 성장 차트가 우상향하는지 확인.
Expected: 저장·목록·차트·프로필 정상 동작, 새로고침 후에도 데이터 유지.

- [ ] **Step 5: 커밋**

```bash
git add index.html styles/main.css js/app.js
git commit -m "feat: 성장 탭(저장/버전목록/성장차트/프로필) 구현"
```

---

### Task 12: 방법론 탭 + 예시 데이터

**Files:**
- Modify: `index.html` (방법론 탭 콘텐츠)
- Create: `data/sample-arguments.json`
- Modify: `js/app.js` (예시 불러오기 연결)

**Interfaces:**
- Consumes: `data/sample-arguments.json` (fetch).
- Produces: "예시 불러오기" 버튼이 폼을 예시로 채운다.

- [ ] **Step 1: index.html 방법론 탭 콘텐츠 작성**

```html
    <section id="method" class="tab-panel" role="tabpanel">
      <h2>📖 방법론</h2>
      <h3>1. 툴민(Toulmin) 논증 모델</h3>
      <p>주장(Claim)·근거(Grounds)·전제(Warrant)·한정(Qualifier)·반론(Rebuttal)으로
        논증을 분해해 논리 구조를 점검합니다. 이것이 ‘논리적으로 소통하는 힘’의 뼈대입니다.</p>
      <h3>2. 점수 산정 기준 (직접 설계한 KPI)</h3>
      <ul>
        <li>근거 충분성 — 근거 개수와 수치·출처 등 구체성</li>
        <li>논리 연결성 — 주장과 근거를 잇는 전제의 충실도</li>
        <li>반론 대응력 — 반론 제시와 반박 표현</li>
        <li>주장 명료성 — 길이 적절성과 모호어 배제</li>
        <li>오류 청결도 — 논리적 오류 감점</li>
      </ul>
      <h3>3. 게임 설계 관점</h3>
      <p>점수→랭크/레벨, 조건 달성→배지, 약점→퀘스트로 이어지는 <strong>피드백 루프</strong>를
        직접 설계했습니다. 참여 동기를 끌어올리도록 점수를 밸런싱하고, MDA(메커닉–다이내믹–
        에스테틱) 관점으로 ‘학습을 플레이로 바꾸는’ 경험을 기획했습니다.</p>
    </section>
```

- [ ] **Step 2: data/sample-arguments.json 작성**

```json
[
  {
    "title": "교내 휴대폰 사용 - 예시",
    "claim": "학교는 수업 중 휴대폰 사용을 제한해야 한다",
    "grounds": [
      "2022년 연구 자료에 따르면 수업 중 휴대폰 사용은 집중도를 23% 낮춘다",
      "교사 설문 조사에서 응답자 70%가 학습 방해를 지적했다"
    ],
    "warrant": "집중도 저하는 학업 성취 하락으로 이어지므로 제한이 정당하다",
    "qualifier": "수업 시간에 한정하여",
    "rebuttal": "그러나 비상 연락 문제는 담임을 통한 연락 체계로 해결할 수 있다"
  }
]
```

- [ ] **Step 3: js/app.js에 예시 불러오기 연결**

```js
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
```

`initForm()` 안에 연결 추가:

```js
  document.getElementById("load-sample").addEventListener("click", loadSample);
```

- [ ] **Step 4: 브라우저 확인**

로컬 서버(`python -m http.server`)로 열고 "예시 불러오기" 클릭 → 폼이 채워지고, 분석 시 높은 점수가 나오는지 확인. 방법론 탭 내용 표시 확인.
Expected: 예시 폼 채움, 정상 분석.

- [ ] **Step 5: 커밋**

```bash
git add index.html data/sample-arguments.json js/app.js
git commit -m "feat: 방법론 탭과 예시 논증 데이터 추가"
```

---

### Task 13: 반응형 마무리 (responsive.css)

**Files:**
- Create: `styles/responsive.css` (Task 1에서 link만 추가됨, 내용 작성)

**Interfaces:**
- Produces: 데스크톱 2컬럼 레이아웃, 모바일 단일 컬럼.

- [ ] **Step 1: styles/responsive.css 작성**

```css
/* 모바일 우선: 기본은 단일 컬럼. 데스크톱에서 입력/분석 가독성 향상 */
@media (min-width: 720px) {
  .app-header h1 { font-size: 2rem; }
  .arg-form { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
  .arg-form > label:nth-child(1),
  .arg-form > #grounds-wrap,
  .arg-form > #add-ground,
  .arg-form > .form-actions { grid-column: 1 / -1; }
  .chart-box { height: 340px; }
}
@media (max-width: 420px) {
  .tab-btn { font-size: 0.8rem; padding: 0 4px; }
  main { padding: 12px; }
}
```

- [ ] **Step 2: 브라우저 반응형 확인**

브라우저 개발자도구의 디바이스 툴바로 320px / 768px / 1024px 폭을 확인. 깨짐·가로 스크롤이 없고 탭·폼·차트가 적절히 배치되는지 확인.
Expected: 모든 폭에서 레이아웃 정상, 가로 스크롤 없음.

- [ ] **Step 3: 커밋**

```bash
git add styles/responsive.css
git commit -m "feat: 반응형 레이아웃 마무리"
```

---

### Task 14: README + GitHub Pages 배포

**Files:**
- Create: `README.md`
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: `main` 브랜치 push 시 GitHub Pages 자동 배포 워크플로.

- [ ] **Step 1: README.md 작성**

```markdown
# 🎯 논리 퀘스트 (ArguQuest)

논증을 분해·시각화·점수화하고, 랭크·배지·퀘스트로 성장하는 **논리 트레이닝 게임**.

- 과목/주제: 국어 · 「논리적으로 소통하는 힘」 (고1)
- 목표 학과: 게임학과 (학생부종합전형 세특)

## 핵심 기능
- 툴민 논증 모델 6요소 입력 → 논증 구조 트리 시각화
- 5개 지표 종합 점수(0–100) + 레이더 차트
- 규칙 기반 논리 오류 탐지
- 랭크/레벨·배지·퀘스트(게이미피케이션)
- 개선 전·후 성장 그래프, localStorage 저장

## 세특 서사
논증 학습을 게임으로 재설계했다. 점수→랭크→배지→퀘스트로 이어지는 **피드백 루프**를
직접 설계하고, 참여 동기를 높이도록 점수를 밸런싱했으며, MDA 관점으로 학습 경험을 기획했다.
(게임 기획·시스템 설계 역량 증빙)

## 실행
정적 사이트입니다. 로컬에서:
```
python -m http.server 8000
```
브라우저에서 `http://localhost:8000` 접속.

## 테스트
```
npm test   # node --test (순수 로직 단위 테스트)
```

## 기술
HTML/CSS/순수 ES Modules, Chart.js(CDN), localStorage. 빌드 없음.
```

- [ ] **Step 2: .github/workflows/deploy.yml 작성**

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: "."
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: 전체 테스트 실행**

Run: `node --test`
Expected: 모든 테스트 PASS (model, scoring, fallacy, game, storage, tree).

- [ ] **Step 4: 커밋**

```bash
git add README.md .github/workflows/deploy.yml
git commit -m "docs: README 및 GitHub Pages 배포 워크플로 추가"
```

- [ ] **Step 5: Git Publish / 배포**

GitHub에 저장소를 publish(push)한 뒤, 저장소 Settings → Pages → Source를 "GitHub Actions"로 설정. push 시 워크플로가 자동 배포한다. (저장소 이름이 `<user>.github.io`가 아니면 경로 기반 URL이 되며, 모든 자원 경로가 상대경로라 그대로 동작한다.)

---

## Self-Review

**1. Spec coverage:**
- §2 사용자 흐름 → Task 9~11 (입력→분석→보상→저장→비교) ✅
- §3 4개 탭 → Task 1(탭), 9(입력), 10(분석), 11(성장), 12(방법론) ✅
- §4 데이터 모델(Argument/Profile) → Task 2, 6 ✅
- §5 점수 5지표 → Task 3 ✅
- §6 게이미피케이션(랭크/배지/퀘스트/연출) → Task 5, 10(게이지·연출 CSS) ✅
- §7 오류 점검 → Task 4, 10(렌더) ✅
- §8 파일 구조 → 전체 태스크가 동일 구조 사용 ✅
- §9 반응형/접근성 → Task 13 + 시맨틱/라벨은 마크업에 포함 ✅
- §10 GitHub Pages 배포 → Task 14 ✅
- §11 비범위(AI/로그인/멀티 없음) → 준수 ✅
- §12 세특 서사 → Task 12(방법론), 14(README) ✅

**2. Placeholder scan:** 모든 코드 스텝에 실제 코드 포함. "적절히 처리" 류 표현 없음. ✅

**3. Type consistency:**
- `computeScores` 반환 키(`groundsSufficiency` 등)가 scoring/charts/game/app에서 일치 ✅
- `getRank` 반환 `{rank, level, icon}` — app에서 동일 키 사용 ✅
- `evaluateBadges(arg, scores, prevTotal)` 시그니처가 game.test와 app 호출 일치 ✅
- storage 함수 주입형 `store` 인자 — 테스트/런타임 일치 ✅
- `escapeHtml`이 tree.js와 app.js에 각각 정의(모듈 독립) — 의도된 중복, 충돌 없음 ✅
```
