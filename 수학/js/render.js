// Canvas 렌더링 + 공 애니메이션 (DOM/Canvas 의존)
import { WORLD } from "./levels.js";
import { samplePath } from "./physics.js";

const COL = {
  bg: "#0f1226", grid: "#232a52", axis: "#3a4170",
  ground: "#1a1f3d", launcher: "#5b8cff", target: "#ffcf3f",
  obstacle: "#ff6b6b", path: "#00d4a0", ball: "#ffffff",
};

// 월드 좌표 → 캔버스 픽셀 (y 뒤집기). padding 포함.
function makeMapper(canvas) {
  const pad = 26;
  const w = canvas.width, h = canvas.height;
  const sx = (w - pad * 2) / WORLD.W;
  const sy = (h - pad * 2) / WORLD.H;
  return {
    X: (x) => pad + x * sx,
    Y: (y) => h - pad - y * sy,
    sx, sy,
  };
}

function drawGrid(ctx, m, canvas) {
  ctx.fillStyle = COL.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = COL.grid;
  ctx.lineWidth = 1;
  for (let x = 0; x <= WORLD.W; x += 2) {
    ctx.beginPath(); ctx.moveTo(m.X(x), m.Y(0)); ctx.lineTo(m.X(x), m.Y(WORLD.H)); ctx.stroke();
  }
  for (let y = 0; y <= WORLD.H; y += 2) {
    ctx.beginPath(); ctx.moveTo(m.X(0), m.Y(y)); ctx.lineTo(m.X(WORLD.W), m.Y(y)); ctx.stroke();
  }
  // 축
  ctx.strokeStyle = COL.axis; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(m.X(0), m.Y(0)); ctx.lineTo(m.X(WORLD.W), m.Y(0)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(m.X(0), m.Y(0)); ctx.lineTo(m.X(0), m.Y(WORLD.H)); ctx.stroke();
}

function drawObstacles(ctx, m, obstacles) {
  ctx.fillStyle = COL.obstacle;
  for (const o of obstacles) {
    const x = m.X(o.x), y = m.Y(o.top);
    ctx.fillRect(x, y, o.w * m.sx, (o.top - o.bottom) * m.sy);
  }
}

function drawTarget(ctx, m, t, pulse = 1) {
  ctx.save();
  ctx.fillStyle = COL.target;
  ctx.beginPath();
  ctx.arc(m.X(t.x), m.Y(t.y), t.r * m.sx * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff8d8"; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
}

function drawLauncher(ctx, m) {
  ctx.fillStyle = COL.launcher;
  ctx.beginPath();
  ctx.arc(m.X(0), m.Y(0), 7, 0, Math.PI * 2);
  ctx.fill();
}

function drawPath(ctx, m, points) {
  ctx.strokeStyle = COL.path; ctx.lineWidth = 2.5; ctx.setLineDash([6, 5]);
  ctx.beginPath();
  points.forEach((pt, i) => {
    const px = m.X(pt.x), py = m.Y(Math.max(pt.y, 0));
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.setLineDash([]);
}

// 정적 장면(궤적 미리보기 포함)
export function drawScene(canvas, level, a, b) {
  const ctx = canvas.getContext("2d");
  const m = makeMapper(canvas);
  drawGrid(ctx, m, canvas);
  drawObstacles(ctx, m, level.obstacles);
  drawTarget(ctx, m, level.target);
  const points = samplePath(a, b, WORLD.W, 0.25);
  drawPath(ctx, m, points);
  drawLauncher(ctx, m);
  return points;
}

// 공 발사 애니메이션. onDone(reachedHit) 콜백.
export function animateShot(canvas, level, points, hitIndex, onDone) {
  const ctx = canvas.getContext("2d");
  const m = makeMapper(canvas);
  const end = hitIndex >= 0 ? hitIndex : points.length - 1;
  let i = 0;
  function frame() {
    drawGrid(ctx, m, canvas);
    drawObstacles(ctx, m, level.obstacles);
    const pulse = 1 + 0.12 * Math.sin(i * 0.4);
    drawTarget(ctx, m, level.target, pulse);
    drawPath(ctx, m, points.slice(0, i + 1));
    drawLauncher(ctx, m);
    const pt = points[Math.min(i, end)];
    ctx.fillStyle = COL.ball;
    ctx.beginPath();
    ctx.arc(m.X(pt.x), m.Y(Math.max(pt.y, 0)), 6, 0, Math.PI * 2);
    ctx.fill();
    if (i < end) { i += 1; requestAnimationFrame(frame); }
    else if (onDone) onDone();
  }
  requestAnimationFrame(frame);
}
