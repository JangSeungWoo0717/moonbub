// 월드 좌표 크기 (발사대 = 원점)
export const WORLD = { W: 20, H: 12 };

const DEFAULT_CONTROLS = { aMin: -0.4, aMax: -0.02, aStep: 0.01, bMin: 0.2, bMax: 4, bStep: 0.05 };

export const LEVELS = [
  {
    id: 1,
    target: { x: 8, y: 0, r: 1.2 },
    obstacles: [],
    controls: DEFAULT_CONTROLS,
    hint: "a는 곡선의 휘어짐, b는 발사 세기예요. 착지점을 표적에 맞춰 보세요.",
  },
  {
    id: 2,
    target: { x: 5, y: 3, r: 1 },
    obstacles: [],
    controls: DEFAULT_CONTROLS,
    hint: "공중에 뜬 표적! 꼭짓점(x=-b/2a)이 표적 근처를 지나게 만들어요.",
  },
  {
    id: 3,
    target: { x: 13, y: 0, r: 1.1 },
    obstacles: [{ x: 5, w: 0.6, bottom: 0, top: 3 }],
    controls: DEFAULT_CONTROLS,
    hint: "벽을 넘겨야 해요. 더 높이 솟는 포물선을 만들어 보세요.",
  },
  {
    id: 4,
    target: { x: 7, y: 4, r: 0.9 },
    obstacles: [{ x: 3, w: 0.6, bottom: 0, top: 2.5 }],
    controls: DEFAULT_CONTROLS,
    hint: "낮은 벽을 넘으면서도 높은 표적을 맞히는 균형을 찾아요.",
  },
  {
    id: 5,
    target: { x: 15, y: 0, r: 1 },
    obstacles: [
      { x: 5, w: 0.6, bottom: 0, top: 3.5 },
      { x: 10, w: 0.6, bottom: 0, top: 2.5 },
    ],
    controls: DEFAULT_CONTROLS,
    hint: "두 개의 벽! 둘 다 넘기는 포물선의 꼭짓점 위치를 고민해 보세요.",
  },
];

// 시도 횟수에 따른 별점 (적을수록 높음)
export function starRating(attempts) {
  if (attempts <= 1) return 3;
  if (attempts <= 3) return 2;
  return 1;
}
