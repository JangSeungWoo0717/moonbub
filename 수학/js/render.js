// Canvas 렌더러 — 연속 rAF 루프 + 파티클/잔상/화면흔들림 (DOM/Canvas 의존)
import { WORLD } from "./levels.js";
import { samplePath, vertex, landingX } from "./physics.js";

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.W = canvas.width;
    this.H = canvas.height;
    this.pad = 26;
    this.sx = (this.W - this.pad * 2) / WORLD.W;
    this.sy = (this.H - this.pad * 2) / WORLD.H;
    this.level = null;
    this.a = -0.1; this.b = 1.5;
    this.mode = "aim";
    this.shot = null;
    this.particles = [];
    this.trail = [];
    this.shakeAmt = 0;
    this.t = 0;
    this._raf = null;
  }

  X(x) { return this.pad + x * this.sx; }
  Y(y) { return this.H - this.pad - y * this.sy; }

  start() {
    const loop = () => { this.frame(); this._raf = requestAnimationFrame(loop); };
    this._raf = requestAnimationFrame(loop);
  }

  setLevel(level) { this.level = level; this.particles = []; this.trail = []; this.shot = null; this.mode = "aim"; }
  setAim(a, b) { this.a = a; this.b = b; }

  shake(amt) { this.shakeAmt = Math.min(this.shakeAmt + amt, 16); }

  burst(x, y, color, n = 18, speed = 5) {
    for (let i = 0; i < n; i += 1) {
      const ang = (Math.PI * 2 * i) / n + Math.random();
      const sp = speed * (0.5 + Math.random());
      this.particles.push({
        x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 1,
        life: 1, decay: 0.02 + Math.random() * 0.02,
        color, size: 2 + Math.random() * 3,
      });
    }
  }

  // 발사 시작: points(월드), events:[{index,type,color,x,y}], 콜백
  shoot(points, events, onEvent, onDone) {
    this.shot = { points, events: events.slice(), idx: 0, onEvent, onDone, fired: new Set() };
    this.trail = [];
    this.mode = "shoot";
  }

  frame() {
    const ctx = this.ctx;
    this.t += 1;
    ctx.save();
    if (this.shakeAmt > 0.2) {
      ctx.translate((Math.random() - 0.5) * this.shakeAmt, (Math.random() - 0.5) * this.shakeAmt);
      this.shakeAmt *= 0.86;
    }
    this.drawBackground();
    if (this.level) {
      this.drawObstacles();
      this.drawCoins();
      this.drawTargets();
      if (this.mode === "aim") this.drawAimPreview();
      this.drawCannon();
      if (this.mode === "shoot") this.advanceShot();
    }
    this.updateParticles();
    ctx.restore();
  }

  drawBackground() {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, this.H);
    g.addColorStop(0, "#141a3a");
    g.addColorStop(0.7, "#0f1226");
    g.addColorStop(1, "#0b0e1f");
    ctx.fillStyle = g;
    ctx.fillRect(-20, -20, this.W + 40, this.H + 40);
    // 격자
    ctx.strokeStyle = "rgba(91,140,255,0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= WORLD.W; x += 2) {
      ctx.beginPath(); ctx.moveTo(this.X(x), this.Y(0)); ctx.lineTo(this.X(x), this.Y(WORLD.H)); ctx.stroke();
    }
    for (let y = 0; y <= WORLD.H; y += 2) {
      ctx.beginPath(); ctx.moveTo(this.X(0), this.Y(y)); ctx.lineTo(this.X(WORLD.W), this.Y(y)); ctx.stroke();
    }
    // 땅
    ctx.fillStyle = "#1c2342";
    ctx.fillRect(0, this.Y(0), this.W, this.H - this.Y(0) + 20);
    ctx.strokeStyle = "#3a4170"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, this.Y(0)); ctx.lineTo(this.W, this.Y(0)); ctx.stroke();
  }

  drawObstacles() {
    const ctx = this.ctx;
    for (const o of this.level.obstacles) {
      const x = this.X(o.x), y = this.Y(o.top);
      const w = o.w * this.sx, h = (o.top - o.bottom) * this.sy;
      ctx.fillStyle = "#7a3b52";
      this.roundRect(x, y, w, h, 4); ctx.fill();
      ctx.strokeStyle = "#ff8aa0"; ctx.lineWidth = 2;
      this.roundRect(x, y, w, h, 4); ctx.stroke();
      // 벽돌 줄
      ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = 1;
      for (let yy = y + 8; yy < y + h; yy += 9) {
        ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke();
      }
    }
  }

  drawCoins() {
    const ctx = this.ctx;
    for (const c of this.level.coins) {
      if (c._got) continue;
      const cx = this.X(c.x), cy = this.Y(c.y);
      const r = c.r * this.sx * 0.7;
      const spin = Math.abs(Math.cos(this.t * 0.06 + c.x));
      ctx.save();
      ctx.shadowColor = "#ffcf3f"; ctx.shadowBlur = 12;
      ctx.fillStyle = "#ffcf3f";
      ctx.beginPath(); ctx.ellipse(cx, cy, r * (0.3 + 0.7 * spin), r, 0, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#fff3c4"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, cy, r * (0.3 + 0.7 * spin), r, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
  }

  drawTargets() {
    const ctx = this.ctx;
    for (const t of this.level.targets) {
      if (t._hit) continue;
      const cx = this.X(t.x), cy = this.Y(t.y);
      const pulse = 1 + 0.08 * Math.sin(this.t * 0.12 + t.x);
      const r = t.r * this.sx * pulse;
      // 풍선 줄
      ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, cy + r); ctx.lineTo(cx, this.Y(0)); ctx.stroke();
      ctx.save();
      ctx.shadowColor = "#ff6b6b"; ctx.shadowBlur = 16;
      const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r);
      g.addColorStop(0, "#ff9aa8"); g.addColorStop(1, "#ff4d62");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // 하이라이트
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath(); ctx.arc(cx - r * 0.32, cy - r * 0.32, r * 0.18, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawAimPreview() {
    const ctx = this.ctx;
    const pts = samplePath(this.a, this.b, WORLD.W, 0.3);
    ctx.strokeStyle = "rgba(0,212,160,0.85)"; ctx.lineWidth = 2.5;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    pts.forEach((p, i) => {
      const px = this.X(p.x), py = this.Y(Math.max(p.y, 0));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    // 꼭짓점 + 대칭축
    const v = vertex(this.a, this.b);
    if (v && v.y > 0) {
      ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(this.X(v.x), this.Y(0)); ctx.lineTo(this.X(v.x), this.Y(v.y)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#00d4a0";
      const vx = this.X(v.x), vy = this.Y(v.y);
      ctx.beginPath(); ctx.moveTo(vx, vy - 5); ctx.lineTo(vx + 5, vy); ctx.lineTo(vx, vy + 5); ctx.lineTo(vx - 5, vy); ctx.closePath(); ctx.fill();
    }
    // 착지 마커
    const land = landingX(this.a, this.b);
    if (land != null && land <= WORLD.W) {
      const lx = this.X(land), ly = this.Y(0);
      ctx.strokeStyle = "#ffcf3f"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(lx - 5, ly - 5); ctx.lineTo(lx + 5, ly + 5);
      ctx.moveTo(lx + 5, ly - 5); ctx.lineTo(lx - 5, ly + 5); ctx.stroke();
    }
  }

  drawCannon() {
    const ctx = this.ctx;
    const ox = this.X(0), oy = this.Y(0);
    const ang = Math.atan2(-this.b * this.sy, this.sx);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(ang);
    ctx.fillStyle = "#5b8cff";
    this.roundRect(-2, -7, 30, 14, 5); ctx.fill();
    ctx.fillStyle = "#7da3ff";
    this.roundRect(20, -7, 8, 14, 4); ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#3a4170";
    ctx.beginPath(); ctx.arc(ox, oy, 11, Math.PI, 0); ctx.fill();
    ctx.fillStyle = "#5b8cff";
    ctx.beginPath(); ctx.arc(ox, oy, 7, 0, Math.PI * 2); ctx.fill();
  }

  advanceShot() {
    const ctx = this.ctx;
    const s = this.shot;
    const end = s.points.length - 1;
    // 이벤트 발화
    for (const ev of s.events) {
      if (!s.fired.has(ev) && s.idx >= ev.index) {
        s.fired.add(ev);
        this.burst(this.X(ev.x), this.Y(ev.y), ev.color, ev.type === "target" ? 22 : 14, ev.type === "target" ? 6 : 4);
        if (ev.type === "target") this.shake(7);
        if (s.onEvent) s.onEvent(ev);
      }
    }
    const p = s.points[Math.min(s.idx, end)];
    const px = this.X(p.x), py = this.Y(Math.max(p.y, 0));
    // 지나온 궤적
    ctx.strokeStyle = "rgba(0,212,160,0.5)"; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
    ctx.beginPath();
    for (let i = 0; i <= Math.min(s.idx, end); i += 1) {
      const q = s.points[i];
      const qx = this.X(q.x), qy = this.Y(Math.max(q.y, 0));
      if (i === 0) ctx.moveTo(qx, qy); else ctx.lineTo(qx, qy);
    }
    ctx.stroke(); ctx.setLineDash([]);
    // 잔상
    this.trail.push({ x: px, y: py });
    if (this.trail.length > 14) this.trail.shift();
    this.trail.forEach((tp, i) => {
      const al = i / this.trail.length;
      ctx.fillStyle = `rgba(255,255,255,${al * 0.4})`;
      ctx.beginPath(); ctx.arc(tp.x, tp.y, 5 * al, 0, Math.PI * 2); ctx.fill();
    });
    // 공
    ctx.save();
    ctx.shadowColor = "#fff"; ctx.shadowBlur = 14;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    s.idx += 1;
    if (s.idx > end) {
      this.mode = "aim";
      const done = s.onDone; this.shot = null;
      if (done) done();
    }
  }

  updateParticles() {
    const ctx = this.ctx;
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const p of this.particles) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.life -= p.decay;
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  roundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // 캔버스 좌표(px) → 월드 좌표
  toWorld(px, py) {
    return { x: (px - this.pad) / this.sx, y: (this.H - this.pad - py) / this.sy };
  }
}
