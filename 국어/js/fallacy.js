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
