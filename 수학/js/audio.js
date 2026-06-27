// WebAudio 효과음 (외부 에셋 없이 오실레이터로 합성)
let ctx = null;
let enabled = true;

export function initAudio() {
  if (ctx) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    ctx = null;
  }
}

export function setEnabled(on) { enabled = on; }
export function isEnabled() { return enabled; }

function tone(freq, dur, type = "sine", gain = 0.18, slideTo = null) {
  if (!ctx || !enabled) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function playLaunch(power = 1) {
  initAudio();
  tone(180 + power * 120, 0.22, "sawtooth", 0.16, 90);
}

export function playCoin(step = 0) {
  initAudio();
  tone(660 + step * 90, 0.12, "square", 0.12);
}

export function playHit() {
  initAudio();
  tone(140, 0.18, "triangle", 0.22, 70);
}

export function playMiss() {
  initAudio();
  tone(120, 0.25, "sine", 0.16, 60);
}

export function playWin(stars = 3) {
  initAudio();
  const notes = [523, 659, 784, 1047]; // C E G C
  for (let i = 0; i < Math.max(3, stars + 1); i += 1) {
    const f = notes[Math.min(i, notes.length - 1)];
    setTimeout(() => tone(f, 0.22, "triangle", 0.18), i * 110);
  }
}
