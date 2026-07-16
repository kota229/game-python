// storage.js — 進捗を localStorage に保存する（オフライン完結）。
const KEY = 'codequest.progress.v1';

function load() {
  if (typeof localStorage === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function save(data) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* 保存に失敗しても遊べるよう握りつぶす */
  }
}

/** ステージ結果を記録（過去より良いスターのみ更新） */
export function recordResult(stageId, stars) {
  const data = load();
  const prev = data[stageId]?.stars || 0;
  data[stageId] = { cleared: true, stars: Math.max(prev, stars) };
  save(data);
  return data[stageId];
}

/** 指定ステージの記録（未クリアなら null） */
export function getResult(stageId) {
  return load()[stageId] || null;
}

/** クリア済みステージ数 */
export function clearedCount() {
  return Object.values(load()).filter((r) => r.cleared).length;
}

export function getAll() { return load(); }

export function resetProgress() { save({}); }
