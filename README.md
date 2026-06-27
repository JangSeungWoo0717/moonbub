# 🎓 세특 프로젝트 모음 (moonbub)

학생부종합전형 세부능력 및 특기사항(세특)용 과목별 탐구 산출물 모음.
모두 빌드 없는 정적 웹앱이며 GitHub Pages로 배포됩니다. 목표 학과: **게임학과**.

| 과목 | 프로젝트 | 주제 | 경로 |
|---|---|---|---|
| 국어 (고1) | 🎯 논리 퀘스트 (ArguQuest) | 논리적으로 소통하는 힘 | [`국어/`](국어/) |
| 수학 (고1) | 🎲 확률의 설계자 (GachaLab) | 확률로 설계하는 게임 | [`수학/`](수학/) |

## 구조
```
/                  루트 랜딩 페이지(허브)
국어/              논증 분석 게임 (논리 퀘스트)
수학/              가챠 확률 실험실 (확률의 설계자)
docs/              설계 명세서·구현 계획서
.github/workflows/ GitHub Pages 자동 배포
```

## 배포
`main` 브랜치 push 시 `.github/workflows/deploy.yml`가 전체를 GitHub Pages에 배포합니다.
- 허브: `https://jangseungwoo0717.github.io/moonbub/`
- 국어: `.../moonbub/국어/`
- 수학: `.../moonbub/수학/`

## 테스트
각 프로젝트 폴더에서:
```
npm test   # node --test (순수 로직 단위 테스트)
```
