# 포물선 슈터 (ParabolaShot) — 설계 명세서

- **작성일**: 2026-06-27
- **과목 / 학년**: 수학 / 고1 (이차함수)
- **주제**: 이차함수로 조준하라 — 포물선의 기하
- **목표 학과**: 게임학과 (학생부종합전형 세특)
- **배포**: GitHub Pages (`수학/` 경로)
- **기술 스택**: 순수 HTML/CSS/JS (빌드 없음), Canvas 2D, localStorage

---

## 1. 개요

발사대(원점)에서 공이 **이차함수 `y = a·x² + b·x`** 궤적을 그리며 날아가는 퍼즐
아케이드 게임. 플레이어가 계수 **a**(개구 방향·폭)와 **b**(발사 기울기)를 조절해
표적을 맞히고 장애물을 피한다. "분석 대시보드"가 아니라 **실제로 플레이하는 게임**이며,
국어 프로젝트(탭형 분석기)와 구조가 완전히 다르다.

### 핵심 서사 (세특·입시 차별점)
- **수학 역량**: 이차함수 `y = ax² + bx`의 계수 변화가 그래프에 주는 영향(개구 방향,
  폭, 꼭짓점 `x = -b/2a`, x절편 `0`과 `-b/a`, 대칭축)을 직접 조작하며 체득.
- **게임학과 역량**: 발사 물리, 충돌 판정, 레벨 디자인, 별점 보상, 궤적 미리보기 등
  게임 메커니즘을 직접 설계. 수학(포물선)을 *게임플레이의 핵심 규칙*으로 사용.

### 성공 기준
1. a·b 슬라이더 조절 시 캔버스에 포물선 **궤적 미리보기**가 실시간으로 그려진다.
2. "발사" 시 공이 궤적을 따라 애니메이션으로 날아간다.
3. 표적에 명중하면 클리어, 장애물에 막히면 실패 판정.
4. 여러 레벨(표적·장애물 배치가 다름)을 순서대로 진행한다.
5. 시도 횟수에 따라 **별점(1~3)** 이 부여되고 진행도가 저장된다.
6. 꼭짓점·x절편·대칭축 등 현재 포물선의 수학 정보가 표시된다.
7. 모바일·데스크톱 반응형, GitHub Pages에서 서버·키 없이 동작.

---

## 2. 화면 구성 (단일 게임 화면 — 탭 없음)

- **상단 HUD**: 레벨 번호, 시도 횟수, 별점, 현재 포물선 정보(꼭짓점·대칭축·x절편).
- **중앙 캔버스**: 격자 좌표계, 발사대(원점), 표적, 장애물, 궤적, 공.
- **하단 컨트롤**: a 슬라이더, b 슬라이더, [발사] 버튼, [레벨 선택]/[다음] 버튼, [도움말/수학 설명] 토글.
- **승리/실패 오버레이**: 결과 + 별점 + 다음 레벨 버튼.

게임 루프는 `requestAnimationFrame`으로 공 애니메이션 처리.

---

## 3. 좌표계 & 물리

- 월드 좌표: x ∈ [0, W], y ∈ [0, H] (y는 위로 증가). 발사대 = 원점 (0,0).
- 궤적: `y = a·x² + b·x` (상수항 0 → 항상 발사대에서 출발).
- a < 0, b > 0 일 때 위로 솟았다 떨어지는 아치. 착지점(두 번째 x절편) = `-b/a`.
- 꼭짓점: `x = -b/(2a)`, 높이 `y = -b²/(4a)`.
- 렌더는 월드→캔버스 픽셀 변환(y축 뒤집기).

---

## 4. 데이터 모델

```js
Level = {
  id: number,
  target: { x: number, y: number, r: number },     // 명중 판정 반경
  obstacles: { x, w, bottom, top }[],               // 사각 장애물(월드 좌표)
  controls: { aMin, aMax, bMin, bMax, aStep, bStep },// 슬라이더 범위
  hint: string,
}

Shot = { a: number, b: number }
ShotResult = { win: boolean, blocked: boolean, points: {x,y}[] }
Progress = { cleared: { [levelId]: stars } }          // stars 1~3
```

저장: `localStorage` 키 `parabola_progress`.

---

## 5. 순수 로직 (방법론·테스트 대상)

`physics.js` (DOM 비의존):
- `trajectoryY(a, b, x)` → `a*x*x + b*x`
- `vertex(a, b)` → `{ x: -b/(2a), y: 꼭짓점 높이 }`
- `landingX(a, b)` → `-b/a` (a<0,b>0일 때 착지점, 아니면 null)
- `samplePath(a, b, xMax, step)` → `[{x,y}]`
- `hitsTarget(points, target)` → boolean (반경 내 통과)
- `hitsObstacle(points, obstacle)` → boolean (사각형 내부 통과)
- `evaluateShot(a, b, level, xMax, step)` → `ShotResult`

`levels.js`:
- `LEVELS` → `Level[]` (손수 설계한 5단계)
- `starRating(attempts)` → 1~3 (적게 시도할수록 높음)

`game.js`:
- 상태 머신: 현재 레벨·시도 횟수·상태. `fire(state, shot)` → 결과 반영.

모든 순수 함수는 `node --test`로 검증.

---

## 6. 게임 요소 (게임학과 연결)

- 궤적 실시간 미리보기 → 즉각 피드백 루프.
- 별점 보상(시도 효율), 진행도 저장, 레벨 점진적 난이도(표적 거리·장애물 추가).
- 명중 연출(표적 폭발·파티클 느낌), 실패 시 장애물 강조.
- 핵심: 이차함수라는 *수학 규칙*을 게임의 조준 메커니즘으로 사용.

---

## 7. 파일 구조

```
수학/
  index.html
  styles/  main.css · game.css · responsive.css
  js/
    physics.js   # 포물선 수학·충돌 판정          (순수)
    levels.js    # 레벨 데이터·별점               (순수)
    game.js      # 게임 상태 머신                 (순수)
    storage.js   # 진행도 localStorage
    render.js    # Canvas 렌더·공 애니메이션
    app.js       # 컨트롤·게임 루프 조립
  test/
    physics.test.js · levels.test.js · game.test.js · storage.test.js
  package.json
  README.md
```

순수 모듈(physics/levels/game)은 DOM·Canvas 비의존.

---

## 8. 반응형 / 배포 / 비범위

- 캔버스는 컨테이너 폭에 맞춰 리사이즈, 터치로 슬라이더 조작.
- 루트 `.github/workflows/deploy.yml`가 전체(`수학/` 포함)를 Pages에 배포.
- 비범위(YAGNI): 실시간 바람·다물체 충돌·온라인 랭킹·레벨 에디터.

---

## 9. 세특 연계 포인트

- 방법론(도움말) 패널·README에 "이차함수 `y=ax²+bx`의 계수가 포물선 모양과 꼭짓점·
  x절편을 어떻게 바꾸는지 게임으로 탐구했고, 발사 물리와 충돌 판정·레벨 보상을 직접
  설계했다" 명시 → 수학적 이해 + 게임 시스템 설계 역량 증빙.
