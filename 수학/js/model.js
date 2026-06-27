// 가챠 설정 모델 (순수)

export function defaultConfig() {
  return {
    rarities: [
      { name: "★5", p: 0.006, color: "#ffcf3f" },
      { name: "★4", p: 0.051, color: "#b07bff" },
    ],
    targetIndex: 0,
    pity: 90,
    costPerDraw: 0,
  };
}

export function createConfig(data = {}) {
  const d = defaultConfig();
  const rarities = Array.isArray(data.rarities) && data.rarities.length
    ? data.rarities.map((r) => ({
        name: r.name ?? "?",
        p: clampProb(r.p),
        color: r.color ?? "#5b8cff",
      }))
    : d.rarities;
  let targetIndex = Number.isInteger(data.targetIndex) ? data.targetIndex : 0;
  if (targetIndex < 0 || targetIndex >= rarities.length) targetIndex = 0;
  return {
    rarities,
    targetIndex,
    pity: Math.max(0, Math.floor(data.pity ?? d.pity)),
    costPerDraw: Math.max(0, data.costPerDraw ?? 0),
  };
}

export function targetProbability(config) {
  return config.rarities[config.targetIndex]?.p ?? 0;
}

function clampProb(p) {
  const v = Number(p);
  if (!Number.isFinite(v) || v < 0) return 0;
  return v > 1 ? 1 : v;
}
