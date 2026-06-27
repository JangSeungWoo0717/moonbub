const instances = new WeakMap();

function reset(canvas) {
  const existing = instances.get(canvas);
  if (existing) existing.destroy();
}

const AXIS = "#9aa0c3";
const GRID = "#2a2f55";
const TEXT = "#e8eaf6";

// 누적확률 곡선 + (있으면) 목표 분위 표시
export function renderCumulative(curve, canvas) {
  reset(canvas);
  const chart = new Chart(canvas, {
    type: "line",
    data: {
      labels: curve.map((pt) => pt.n),
      datasets: [{
        label: "N번 안에 1개 이상 얻을 확률",
        data: curve.map((pt) => +(pt.prob * 100).toFixed(2)),
        borderColor: "#5b8cff", backgroundColor: "rgba(91,140,255,0.2)",
        fill: true, tension: 0.25, pointRadius: 0,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        y: { min: 0, max: 100, ticks: { color: AXIS, callback: (v) => v + "%" }, grid: { color: GRID } },
        x: { ticks: { color: AXIS, maxTicksLimit: 10 }, grid: { color: GRID }, title: { display: true, text: "뽑기 횟수", color: AXIS } },
      },
      plugins: { legend: { labels: { color: TEXT } } },
    },
  });
  instances.set(canvas, chart);
}

// 시뮬레이션 분포 히스토그램 + 이론 기댓값/시뮬 평균
export function renderHistogram(histogram, canvas) {
  reset(canvas);
  const chart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: histogram.map((h) => h.bucket),
      datasets: [{
        label: "시행 분포(빈도)",
        data: histogram.map((h) => h.count),
        backgroundColor: "rgba(0,212,160,0.5)", borderColor: "#00d4a0", borderWidth: 1,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, ticks: { color: AXIS }, grid: { color: GRID } },
        x: { ticks: { color: AXIS }, grid: { color: GRID }, title: { display: true, text: "목표 획득까지 뽑기 수", color: AXIS } },
      },
      plugins: { legend: { labels: { color: TEXT } } },
    },
  });
  instances.set(canvas, chart);
}
