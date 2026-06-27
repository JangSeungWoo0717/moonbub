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
