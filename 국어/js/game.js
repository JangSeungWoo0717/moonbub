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
