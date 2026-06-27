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
