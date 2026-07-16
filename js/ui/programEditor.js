// programEditor.js — ブロックパレット＋プログラム組み立てUI（タップ追加 / ドラッグ&ドロップ）。
// ブラウザ専用。program（ノード配列）を内部に保持し、変更のたびに再描画する。

import { CATALOG, isContainer, COND_LABELS, COND_ORDER } from './blockCatalog.js';

let uidSeq = 1;
const nextUid = () => `b${uidSeq++}`;

function makeNode(type) {
  const node = { type, _uid: nextUid() };
  const def = CATALOG[type];
  if (def?.param === 'times') node.times = def.defaultTimes ?? 3;
  if (def?.param === 'cond') node.cond = def.defaultCond ?? 'path_ahead';
  if (def?.container) node.body = [];
  if (def?.hasElse) node.else = [];
  return node;
}

export function createProgramEditor(paletteEl, programEl, { allowed, onChange, sfx } = {}) {
  let program = [];
  const beep = (name) => sfx && sfx[name] && sfx[name]();

  // --- ノード探索（uid で親配列とindexを見つける） ---
  function locate(uid, list = program, parent = null) {
    for (let i = 0; i < list.length; i++) {
      if (list[i]._uid === uid) return { list, index: i, node: list[i] };
      if (list[i].body) {
        const r = locate(uid, list[i].body, list[i]);
        if (r) return r;
      }
      if (list[i].else) {
        const r = locate(uid, list[i].else, list[i]);
        if (r) return r;
      }
    }
    return null;
  }

  // --- パレット描画 ---
  function renderPalette() {
    paletteEl.innerHTML = '';
    for (const type of allowed) {
      const def = CATALOG[type];
      if (!def) continue;
      const el = document.createElement('button');
      el.className = 'palette-block';
      el.style.setProperty('--block-color', def.color);
      el.dataset.type = type;
      el.innerHTML = `<span class="blk-icon">${def.icon}</span><span class="blk-label">${def.label}</span>`;
      el.addEventListener('click', () => { addNode(type); beep('add'); });
      el.addEventListener('pointerdown', (e) => startDrag(e, { kind: 'new', type }));
      paletteEl.appendChild(el);
    }
  }

  // トップレベル末尾に追加
  function addNode(type) {
    program.push(makeNode(type));
    renderProgram(); emitChange();
  }

  // --- プログラム描画 ---
  function renderProgram() {
    programEl.innerHTML = '';
    const root = buildList(program, true);
    programEl.appendChild(root);
    if (program.length === 0) {
      const hint = document.createElement('div');
      hint.className = 'drop-hint';
      hint.textContent = 'ここに ブロックを ならべよう（タップ か ドラッグ）';
      root.appendChild(hint);
    }
  }

  function buildList(list, isRoot) {
    const ul = document.createElement('div');
    ul.className = 'block-list' + (isRoot ? ' root' : '');
    ul.dataset.droplist = '1';
    ul._model = list; // このDOMが表す配列への参照
    for (const node of list) ul.appendChild(buildBlock(node));
    return ul;
  }

  function buildBlock(node) {
    const def = CATALOG[node.type];
    const card = document.createElement('div');
    card.className = 'block' + (def.container ? ' container' : '');
    card.style.setProperty('--block-color', def.color);
    card.dataset.uid = node._uid;

    const head = document.createElement('div');
    head.className = 'block-head';

    const handle = document.createElement('span');
    handle.className = 'block-handle';
    handle.textContent = '⠿';
    handle.addEventListener('pointerdown', (e) => startDrag(e, { kind: 'move', uid: node._uid }));
    head.appendChild(handle);

    const icon = document.createElement('span');
    icon.className = 'blk-icon'; icon.textContent = def.icon;
    head.appendChild(icon);

    const label = document.createElement('span');
    label.className = 'blk-label'; label.textContent = def.label;
    head.appendChild(label);

    // repeat の回数コントロール
    if (def.param === 'times') {
      const ctrl = document.createElement('span');
      ctrl.className = 'times-ctrl';
      const minus = document.createElement('button'); minus.textContent = '−'; minus.className = 'times-btn';
      const num = document.createElement('span'); num.className = 'times-num'; num.textContent = node.times;
      const plus = document.createElement('button'); plus.textContent = '＋'; plus.className = 'times-btn';
      minus.addEventListener('click', () => { node.times = Math.max(1, node.times - 1); num.textContent = node.times; beep('tap'); emitChange(); });
      plus.addEventListener('click', () => { node.times = Math.min(9, node.times + 1); num.textContent = node.times; beep('tap'); emitChange(); });
      ctrl.append(minus, num, document.createTextNode('かい'), plus);
      head.appendChild(ctrl);
    }

    // if / while の条件セレクタ
    if (def.param === 'cond') {
      const sel = document.createElement('select');
      sel.className = 'cond-ctrl';
      for (const c of COND_ORDER) {
        const o = document.createElement('option');
        o.value = c; o.textContent = COND_LABELS[c];
        if (c === node.cond) o.selected = true;
        sel.appendChild(o);
      }
      sel.addEventListener('change', () => { node.cond = sel.value; beep('tap'); emitChange(); });
      sel.addEventListener('pointerdown', (e) => e.stopPropagation());
      // while は「〈条件〉のあいだ くりかえす」の語順にする
      if (node.type === 'while') head.insertBefore(sel, label);
      else head.appendChild(sel);
    }

    const del = document.createElement('button');
    del.className = 'block-del'; del.textContent = '✕';
    del.title = 'けす';
    del.addEventListener('click', () => { removeNode(node._uid); beep('remove'); });
    head.appendChild(del);

    card.appendChild(head);

    if (def.container) {
      const body = buildList(node.body, false);
      body.classList.add('block-body');
      if (node.body.length === 0) {
        const h = document.createElement('div');
        h.className = 'drop-hint small';
        h.textContent = 'この中に いれる';
        body.appendChild(h);
      }
      card.appendChild(body);

      // if の else 分岐
      if (def.hasElse) {
        const elseLabel = document.createElement('div');
        elseLabel.className = 'else-label';
        elseLabel.textContent = 'そうでなければ';
        card.appendChild(elseLabel);
        if (!node.else) node.else = [];
        const elseList = buildList(node.else, false);
        elseList.classList.add('block-body', 'else-body');
        if (node.else.length === 0) {
          const h = document.createElement('div');
          h.className = 'drop-hint small';
          h.textContent = '（なくても いいよ）';
          elseList.appendChild(h);
        }
        card.appendChild(elseList);
      }
    }
    return card;
  }

  function removeNode(uid) {
    const found = locate(uid);
    if (found) { found.list.splice(found.index, 1); renderProgram(); emitChange(); }
  }

  // --- ドラッグ&ドロップ ---
  let drag = null; // { source, ghost, marker }

  function startDrag(e, source) {
    e.preventDefault();
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    const def = CATALOG[source.kind === 'new' ? source.type : locate(source.uid).node.type];
    ghost.innerHTML = `<span class="blk-icon">${def.icon}</span><span class="blk-label">${def.label}</span>`;
    ghost.style.setProperty('--block-color', def.color);
    document.body.appendChild(ghost);

    const marker = document.createElement('div');
    marker.className = 'drop-marker';

    drag = { source, ghost, marker, targetList: null, targetIndex: -1 };
    moveGhost(e.clientX, e.clientY);

    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragEnd, { once: true });
  }

  function moveGhost(x, y) {
    drag.ghost.style.left = x + 'px';
    drag.ghost.style.top = y + 'px';
  }

  function onDragMove(e) {
    moveGhost(e.clientX, e.clientY);
    drag.ghost.style.display = 'none';
    const under = document.elementFromPoint(e.clientX, e.clientY);
    drag.ghost.style.display = '';
    const listEl = under && under.closest('[data-droplist]');

    // 自分自身の中には落とさない（コンテナを自分の子に入れない）
    if (listEl && drag.source.kind === 'move' && isInsideOwn(listEl, drag.source.uid)) {
      hideMarker(); drag.targetList = null; return;
    }

    if (!listEl) { hideMarker(); drag.targetList = null; return; }

    const index = computeIndex(listEl, e.clientY);
    drag.targetList = listEl._model;
    drag.targetIndex = index;
    showMarker(listEl, index);
  }

  // listEl が uid のブロック自身またはその子孫か
  function isInsideOwn(listEl, uid) {
    let el = listEl;
    while (el) {
      if (el.dataset && el.dataset.uid === uid) return true;
      el = el.parentElement;
    }
    return false;
  }

  function computeIndex(listEl, y) {
    const blocks = [...listEl.children].filter((c) => c.classList.contains('block'));
    for (let i = 0; i < blocks.length; i++) {
      const r = blocks[i].getBoundingClientRect();
      if (y < r.top + r.height / 2) return i;
    }
    return blocks.length;
  }

  function showMarker(listEl, index) {
    const blocks = [...listEl.children].filter((c) => c.classList.contains('block'));
    listEl.classList.add('drop-active');
    if (index >= blocks.length) listEl.appendChild(drag.marker);
    else listEl.insertBefore(drag.marker, blocks[index]);
  }

  function hideMarker() {
    document.querySelectorAll('.drop-active').forEach((el) => el.classList.remove('drop-active'));
    if (drag.marker.parentElement) drag.marker.remove();
  }

  function onDragEnd() {
    window.removeEventListener('pointermove', onDragMove);
    const { source, targetList, targetIndex } = drag;
    hideMarker();
    drag.ghost.remove();

    if (targetList) {
      let node;
      if (source.kind === 'new') {
        node = makeNode(source.type);
      } else {
        const found = locate(source.uid);
        if (!found) { drag = null; return; }
        node = found.node;
        found.list.splice(found.index, 1); // 元位置から取り除く
      }
      // 取り除きで index がずれる可能性があるが、_model 参照で splice するので概ね安全
      const idx = Math.min(targetIndex, targetList.length);
      targetList.splice(idx, 0, node);
      beep('add');
      renderProgram(); emitChange();
    }
    drag = null;
  }

  function emitChange() { onChange && onChange(getProgram()); }

  // 実行エンジン向けにクリーンなノードを返す（_uid を除去）
  function getProgram() {
    const strip = (list) => list.map((n) => {
      const o = { type: n.type };
      if (n.times != null) o.times = n.times;
      if (n.cond != null) o.cond = n.cond;
      if (n.body) o.body = strip(n.body);
      if (n.else) o.else = strip(n.else);
      return o;
    });
    return strip(program);
  }

  function clear() { program = []; renderProgram(); emitChange(); }
  function isEmpty() { return program.length === 0; }
  function blockCount() {
    const c = (l) => l.reduce((s, n) => s + 1 + (n.body ? c(n.body) : 0) + (n.else ? c(n.else) : 0), 0);
    return c(program);
  }

  renderPalette();
  renderProgram();

  return { clear, getProgram, isEmpty, blockCount, renderPalette, renderProgram };
}
