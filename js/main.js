// main.js — 画面コントローラ（タイトル / ステージマップ / プレイ / クリア演出）。
import { STAGES } from '../data/stages.js';
import { createWorld } from './engine/world.js';
import { run } from './engine/interpreter.js';
import { evaluate } from './engine/rules.js';
import { recordResult, getResult, resetProgress } from './storage.js';
import sfx, { setMuted, isMuted } from './audio.js';
import { createWorldView } from './ui/worldView.js';
import { createProgramEditor } from './ui/programEditor.js';

const $ = (sel) => document.querySelector(sel);
const screens = {
  title: $('#screen-title'),
  map: $('#screen-map'),
  play: $('#screen-play'),
};

let worldView = null;
let editor = null;
let currentStage = null;
let running = false;
let hintIndex = 0;

function show(name) {
  for (const [k, el] of Object.entries(screens)) el.classList.toggle('active', k === name);
}

// --- ステージ解放判定: 最初のステージ or 直前がクリア済み ---
function isUnlocked(index) {
  if (index === 0) return true;
  return !!getResult(STAGES[index - 1].id)?.cleared;
}

// --- タイトル ---
function initTitle() {
  $('#btn-start').addEventListener('click', () => { sfx.tap(); renderMap(); show('map'); });
  $('#btn-continue').addEventListener('click', () => {
    sfx.tap();
    // 最後にクリアした次の未クリアステージへ
    let idx = 0;
    for (let i = 0; i < STAGES.length; i++) { if (getResult(STAGES[i].id)?.cleared) idx = Math.min(STAGES.length - 1, i + 1); }
    renderMap(); show('map');
    if (isUnlocked(idx)) openStage(idx);
  });
  const muteBtn = $('#btn-mute');
  const syncMute = () => { muteBtn.textContent = isMuted() ? '🔇 おと オフ' : '🔊 おと オン'; };
  muteBtn.addEventListener('click', () => { setMuted(!isMuted()); syncMute(); if (!isMuted()) sfx.tap(); });
  syncMute();
}

// --- ステージマップ ---
function renderMap() {
  const grid = $('#map-grid');
  grid.innerHTML = '';
  STAGES.forEach((stage, i) => {
    const unlocked = isUnlocked(i);
    const res = getResult(stage.id);
    const card = document.createElement('button');
    card.className = 'stage-card' + (unlocked ? '' : ' locked') + (res?.cleared ? ' cleared' : '');
    const stars = res?.stars || 0;
    card.innerHTML = `
      <div class="stage-num">${i + 1}</div>
      <div class="stage-title">${unlocked ? stage.title : '？？？'}</div>
      <div class="stage-stars">${unlocked ? starMarks(stars) : '🔒'}</div>`;
    if (unlocked) card.addEventListener('click', () => { sfx.tap(); openStage(i); });
    grid.appendChild(card);
  });
}

function starMarks(n) {
  return '★★★'.slice(0, n).padEnd(3, '☆');
}

$('#btn-back-title')?.addEventListener('click', () => { sfx.tap(); show('title'); });

// --- プレイ画面 ---
function openStage(index) {
  currentStage = { ...STAGES[index], _index: index };
  hintIndex = 0;
  show('play');

  $('#play-title').textContent = `${index + 1}. ${currentStage.title}`;
  $('#play-tutorial').textContent = currentStage.tutorial || '';
  $('#hint-area').textContent = '';
  $('#hint-area').classList.remove('show');

  // キャンバス
  const canvas = $('#world-canvas');
  fitCanvas(canvas);
  worldView = createWorldView(canvas);
  worldView.setStage(currentStage);

  // エディタ
  editor = createProgramEditor($('#palette'), $('#program'), {
    allowed: currentStage.allowed,
    sfx,
    onChange: () => { $('#msg-area').textContent = ''; },
  });

  setRunning(false);
}

function fitCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(300, Math.round(rect.width * dpr));
  canvas.height = Math.max(300, Math.round(rect.height * dpr));
}

function setRunning(v) {
  running = v;
  $('#btn-run').disabled = v;
  $('#palette').classList.toggle('disabled', v);
  $('#program').classList.toggle('disabled', v);
}

async function onRun() {
  if (running || !editor) return;
  const program = editor.getProgram();
  if (editor.isEmpty()) {
    flashMsg('ブロックを ならべてね！');
    sfx.fail();
    return;
  }
  $('#msg-area').textContent = '';
  setRunning(true);
  worldView.reset();

  const world0 = createWorld(currentStage);
  const { trace, world, error } = run(world0, program);

  await worldView.play(trace, {
    onStep: (step) => {
      if (step.action === 'forward') step.bumped ? sfx.bump() : sfx.step();
      else if (step.action === 'left' || step.action === 'right') sfx.turn();
      else if (step.action === 'collect') step.picked ? sfx.gem() : sfx.bump();
    },
  });

  const ev = evaluate({ world, stage: currentStage, program, trace });
  if (error === 'too_many_steps') {
    flashMsg('うごきすぎ！ ループを みなおそう 🔄');
    sfx.fail();
    setRunning(false);
    return;
  }
  if (ev.success) {
    recordResult(currentStage.id, ev.stars);
    showClear(ev.stars);
  } else {
    flashMsg(failMessage(ev.reason));
    sfx.fail();
    setRunning(false);
  }
}

function failMessage(reason) {
  switch (reason) {
    case 'not_at_goal': return 'ゴールに とどかなかった…もういちど！';
    case 'gems_remaining': return 'ジェムが のこってるよ 💎';
    default: return 'ざんねん！ もういちど ちょうせん！';
  }
}

function flashMsg(text) {
  const el = $('#msg-area');
  el.textContent = text;
  el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
}

function onReset() {
  if (running) return;
  sfx.tap();
  $('#msg-area').textContent = '';
  worldView.reset();
}

function onHint() {
  if (!currentStage) return;
  sfx.tap();
  const hints = currentStage.hints || [];
  if (hints.length === 0) return;
  const area = $('#hint-area');
  area.textContent = `💡 ${hints[Math.min(hintIndex, hints.length - 1)]}`;
  area.classList.add('show');
  hintIndex = Math.min(hintIndex + 1, hints.length - 1);
}

// --- クリア演出 ---
function showClear(stars) {
  const dlg = $('#clear-dialog');
  const starsEl = $('#clear-stars');
  starsEl.innerHTML = '';
  dlg.classList.add('show');
  sfx.success();
  // スターを1つずつ出す
  for (let i = 0; i < 3; i++) {
    const s = document.createElement('span');
    s.className = 'big-star';
    s.textContent = i < stars ? '★' : '☆';
    starsEl.appendChild(s);
    if (i < stars) {
      setTimeout(() => { s.classList.add('pop'); sfx.star(i); }, 350 + i * 350);
    }
  }
  const isLast = currentStage._index >= STAGES.length - 1;
  $('#btn-next').textContent = isLast ? 'マップへ もどる' : 'つぎへ ▶';
}

function hideClear() { $('#clear-dialog').classList.remove('show'); }

function onNext() {
  sfx.tap();
  hideClear();
  const next = currentStage._index + 1;
  if (next < STAGES.length && isUnlocked(next)) {
    openStage(next);
  } else {
    renderMap(); show('map');
  }
}

function onRetry() {
  sfx.tap();
  hideClear();
  setRunning(false);
  worldView.reset();
}

// --- 配線 ---
function init() {
  initTitle();
  $('#btn-run').addEventListener('click', onRun);
  $('#btn-reset').addEventListener('click', onReset);
  $('#btn-hint').addEventListener('click', onHint);
  $('#btn-to-map').addEventListener('click', () => { sfx.tap(); renderMap(); show('map'); });
  $('#btn-next').addEventListener('click', onNext);
  $('#btn-retry').addEventListener('click', onRetry);
  $('#btn-reset-progress')?.addEventListener('click', () => {
    if (confirm('すすめた きろくを ぜんぶ けしますか？')) { resetProgress(); renderMap(); }
  });
  show('title');
}

document.addEventListener('DOMContentLoaded', init);
