// 월드 좌표 (발사대 = 원점)
export const WORLD = { W: 24, H: 14 };

// 전역 조작 범위 (슬라이더 + 드래그 매핑 클램프 + 풀이 가능성 기준)
export const CONTROLS = {
  aMin: -0.5, aMax: -0.01, aStep: 0.01,
  bMin: 0.1, bMax: 5, bStep: 0.05,
};

// 드래그 발사 → 계수 매핑에 쓰는 중력 상수
export const GRAVITY = 9.8;

// 설계 곡선 y = a·x² + b·x 위의 점 (풀이 가능성 보장)
const on = (a, b, x, r) => ({ x, y: a * x * x + b * x, r });

// 각 레벨: 설계 곡선(da,db)을 정하고 그 위에 표적·코인을 올린다.
function build() {
  return [
    {
      id: 1, par: 3,
      targets: [on(-0.10, 1.20, 12, 1.3)],
      coins: [], obstacles: [],
      hint: "대포에서 바깥으로 드래그해 조준! 멀리 당길수록 강하게 날아가요.",
    },
    {
      id: 2, par: 3,
      targets: [on(-0.15, 2.10, 7, 1.1)],
      coins: [], obstacles: [],
      hint: "공중 표적! 포물선의 꼭짓점(x=-b/2a)이 표적을 지나도록 해요.",
    },
    {
      id: 3, par: 2,
      targets: [on(-0.08, 1.20, 15, 1.2)],
      coins: [on(-0.08, 1.20, 4, 0.8), on(-0.08, 1.20, 8, 0.8), on(-0.08, 1.20, 11, 0.8)],
      obstacles: [],
      hint: "코인을 모두 지나며 표적까지! 하나의 곡선으로 정교하게.",
    },
    {
      id: 4, par: 3,
      targets: [on(-0.18, 2.70, 15, 1.2)],
      coins: [], obstacles: [{ x: 7, w: 0.6, bottom: 0, top: 7 }],
      hint: "벽을 넘겨야 해요. 더 높이 솟는 포물선을 만들어요.",
    },
    {
      id: 5, par: 3,
      targets: [on(-0.25, 2.50, 10, 1.2)],
      coins: [], obstacles: [{ x: 5, w: 0.6, bottom: 7, top: 14 }],
      hint: "천장이 있어요! 너무 높이 솟지 않게 낮은 포물선으로.",
    },
    {
      id: 6, par: 2,
      targets: [on(-0.10, 1.80, 4, 1.0), on(-0.10, 1.80, 14, 1.0)],
      coins: [], obstacles: [],
      hint: "두 표적이 같은 포물선 위에 있어요. 한 발로 둘 다!",
    },
    {
      id: 7, par: 2,
      targets: [on(-0.12, 2.00, 5, 1.0), on(-0.12, 2.00, 12, 1.0)],
      coins: [on(-0.12, 2.00, 2, 0.8), on(-0.12, 2.00, 8, 0.8)],
      obstacles: [],
      hint: "표적 2 + 코인 2. 곡선 하나로 모두 꿰어요.",
    },
    {
      id: 8, par: 3,
      targets: [on(-0.10, 1.60, 16, 1.1)],
      coins: [on(-0.10, 1.60, 11, 0.8), on(-0.10, 1.60, 14, 0.8)],
      obstacles: [{ x: 6, w: 0.6, bottom: 0, top: 5 }],
      hint: "벽을 넘고 내려오며 코인까지 챙겨요.",
    },
    {
      id: 9, par: 3,
      targets: [on(-0.20, 2.80, 3, 1.0), on(-0.20, 2.80, 11, 1.0)],
      coins: [], obstacles: [{ x: 7, w: 0.6, bottom: 10.5, top: 14 }],
      hint: "천장 아래로 두 표적을 한 번에!",
    },
    {
      id: 10, par: 3,
      targets: [on(-0.14, 2.25, 16, 1.1)],
      coins: [on(-0.14, 2.25, 4, 0.8), on(-0.14, 2.25, 12, 0.8)],
      obstacles: [{ x: 8, w: 0.6, bottom: 0, top: 7 }, { x: 8, w: 0.6, bottom: 10, top: 14 }],
      hint: "벽과 천장 사이 좁은 틈을 정확히 통과해요!",
    },
    {
      id: 11, par: 2,
      targets: [on(-0.07, 1.40, 20, 1.1)],
      coins: [
        on(-0.07, 1.40, 3, 0.8), on(-0.07, 1.40, 7, 0.8), on(-0.07, 1.40, 10, 0.8),
        on(-0.07, 1.40, 13, 0.8), on(-0.07, 1.40, 17, 0.8),
      ],
      obstacles: [],
      hint: "코인 5개 정밀 사격! 완벽한 곡선을 빚어 보세요.",
    },
    {
      id: 12, par: 3,
      targets: [on(-0.11, 2.20, 4, 1.0), on(-0.11, 2.20, 10, 1.0), on(-0.11, 2.20, 16, 1.0)],
      coins: [on(-0.11, 2.20, 6, 0.8), on(-0.11, 2.20, 14, 0.8)],
      obstacles: [{ x: 7, w: 0.6, bottom: 0, top: 5 }, { x: 13, w: 0.6, bottom: 0, top: 5 }],
      hint: "최종 관문! 표적 3 + 코인 2 + 두 벽. 행운을 빌어요 🍀",
    },
  ];
}

export const LEVELS = build();
