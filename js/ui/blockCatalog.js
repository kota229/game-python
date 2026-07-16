// blockCatalog.js — ブロックの見た目・ラベル定義（子ども向け表示）。
// container=true のブロックは中に他のブロックを入れられる（repeat/if/while）。

export const CATALOG = {
  forward: { label: 'まえに すすむ', icon: '👣', color: '#3b82f6', container: false },
  left:    { label: 'ひだりを むく', icon: '↺', color: '#8b5cf6', container: false },
  right:   { label: 'みぎを むく',   icon: '↻', color: '#8b5cf6', container: false },
  collect: { label: 'ジェムを ひろう', icon: '💎', color: '#f59e0b', container: false },
  repeat:  { label: 'くりかえす',    icon: '🔁', color: '#10b981', container: true, param: 'times', defaultTimes: 3 },
  if:      { label: 'もし みちが あれば', icon: '❓', color: '#ec4899', container: true, param: 'cond', defaultCond: 'path_ahead' },
  while:   { label: 'みちが あるあいだ', icon: '🔄', color: '#06b6d4', container: true, param: 'cond', defaultCond: 'path_ahead' },
};

export function blockLabel(type) {
  return CATALOG[type]?.label || type;
}

export function isContainer(type) {
  return !!CATALOG[type]?.container;
}
