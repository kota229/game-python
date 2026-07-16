// blockCatalog.js — ブロックの見た目・ラベル定義（子ども向け表示）。
// container=true のブロックは中に他のブロックを入れられる（repeat/if/while）。
// param:'times' は回数、param:'cond' は条件を持つ。hasElse=true は else 分岐を持つ。

export const CATALOG = {
  forward: { label: 'まえに すすむ', icon: '👣', color: '#3b82f6', container: false },
  left:    { label: 'ひだりを むく', icon: '↺', color: '#8b5cf6', container: false },
  right:   { label: 'みぎを むく',   icon: '↻', color: '#8b5cf6', container: false },
  collect: { label: 'ジェムを ひろう', icon: '💎', color: '#f59e0b', container: false },
  repeat:  { label: 'くりかえす', icon: '🔁', color: '#10b981', container: true, param: 'times', defaultTimes: 3 },
  if:      { label: 'もし', icon: '❓', color: '#ec4899', container: true, param: 'cond', defaultCond: 'path_ahead', hasElse: true },
  while:   { label: 'のあいだ くりかえす', icon: '🔄', color: '#06b6d4', container: true, param: 'cond', defaultCond: 'path_ahead' },
};

// 条件の子ども向けラベル
export const COND_LABELS = {
  path_ahead: 'まえに みちが ある',
  blocked: 'まえが かべ',
  on_gem: 'ジェムの うえ',
  at_goal: 'ゴールの うえ',
};

export const COND_ORDER = ['path_ahead', 'blocked', 'on_gem', 'at_goal'];

export function blockLabel(type) {
  return CATALOG[type]?.label || type;
}

export function isContainer(type) {
  return !!CATALOG[type]?.container;
}
