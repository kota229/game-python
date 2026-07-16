// audio.js — Web Audio API による効果音のプログラム生成（音声アセットは一切使わない）。
// ブラウザのみで動作。初回のユーザー操作後に AudioContext を有効化する。

let ctx = null;
let muted = false;

function ensureCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// 単純なトーンを鳴らす
function tone(freq, start, dur, type = 'sine', gain = 0.2) {
  const c = ensureCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = c.currentTime + start;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function setMuted(v) {
  muted = v;
  if (muted) stopBgm();
  else startBgm();
}
export function isMuted() { return muted; }

// ---- BGM（プログラム生成の やさしいループ。音声アセットは使わない）----
let bgmTimer = null;
let bgmStep = 0;
let bgmNextTime = 0;
// ペンタトニックの ゆったりした 8ステップ（Hz）
const BGM_SEQ = [523.25, 659.25, 784.0, 659.25, 587.33, 784.0, 880.0, 784.0];
const BGM_BASS = [130.81, 130.81, 174.61, 146.83]; // 4ステップごとの低音
const BGM_STEP_SEC = 0.32;

function bgmNote(time, step) {
  const c = ctx; if (!c) return;
  // メロディ（やわらかい三角波・小音量）
  const osc = c.createOscillator(); const g = c.createGain();
  osc.type = 'triangle'; osc.frequency.value = BGM_SEQ[step % BGM_SEQ.length];
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(0.05, time + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, time + BGM_STEP_SEC * 0.9);
  osc.connect(g).connect(c.destination); osc.start(time); osc.stop(time + BGM_STEP_SEC);
  // 低音（1小節に1回）
  if (step % 2 === 0) {
    const b = c.createOscillator(); const bg = c.createGain();
    b.type = 'sine'; b.frequency.value = BGM_BASS[(step / 2) % BGM_BASS.length];
    bg.gain.setValueAtTime(0, time);
    bg.gain.linearRampToValueAtTime(0.04, time + 0.03);
    bg.gain.exponentialRampToValueAtTime(0.0001, time + BGM_STEP_SEC * 1.6);
    b.connect(bg).connect(c.destination); b.start(time); b.stop(time + BGM_STEP_SEC * 2);
  }
}

function scheduleBgm() {
  const c = ensureCtx(); if (!c) return;
  while (bgmNextTime < c.currentTime + 0.25) {
    bgmNote(bgmNextTime, bgmStep);
    bgmStep = (bgmStep + 1) % BGM_SEQ.length;
    bgmNextTime += BGM_STEP_SEC;
  }
}

export function startBgm() {
  if (muted || bgmTimer) return;
  const c = ensureCtx(); if (!c) return;
  bgmNextTime = c.currentTime + 0.1;
  bgmTimer = setInterval(scheduleBgm, 60);
}
export function stopBgm() {
  if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
}

export const sfx = {
  tap() { if (!muted) tone(440, 0, 0.08, 'triangle', 0.15); },
  add() { if (!muted) tone(660, 0, 0.08, 'triangle', 0.15); },
  remove() { if (!muted) tone(220, 0, 0.1, 'sine', 0.15); },
  step() { if (!muted) tone(520, 0, 0.06, 'square', 0.08); },
  turn() { if (!muted) tone(380, 0, 0.06, 'triangle', 0.08); },
  gem() { if (!muted) { tone(880, 0, 0.1, 'sine', 0.18); tone(1320, 0.06, 0.12, 'sine', 0.15); } },
  bump() { if (!muted) tone(120, 0, 0.18, 'sawtooth', 0.18); },
  fail() { if (!muted) { tone(300, 0, 0.15, 'sawtooth', 0.15); tone(200, 0.12, 0.25, 'sawtooth', 0.15); } },
  success() {
    if (muted) return;
    // 上昇するファンファーレ
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.2, 'triangle', 0.18));
  },
  star(i = 0) { if (!muted) tone(784 + i * 200, 0, 0.15, 'sine', 0.2); },
};

export default sfx;
