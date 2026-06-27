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
