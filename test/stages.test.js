// stages.test.js — 全ステージの模範解答がクリア可能かをデータ検証する
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STAGES } from '../data/stages.js';
import { createWorld } from '../js/engine/world.js';
import { run } from '../js/engine/interpreter.js';
import { evaluate } from '../js/engine/rules.js';

test('全プロトタイプステージに必須フィールドがある', () => {
  for (const s of STAGES) {
    assert.ok(s.id, `id 必須`);
    assert.ok(s.title, `${s.id}: title 必須`);
    assert.ok(s.grid && s.grid.cols && s.grid.rows, `${s.id}: grid 必須`);
    assert.ok(s.robot, `${s.id}: robot 必須`);
    assert.ok(Array.isArray(s.allowed) && s.allowed.length > 0, `${s.id}: allowed 必須`);
    assert.ok(Array.isArray(s.hints) && s.hints.length >= 1, `${s.id}: hints 必須`);
    assert.ok(Array.isArray(s.solution), `${s.id}: solution 必須`);
  }
});

for (const stage of STAGES) {
  test(`ステージ ${stage.id}「${stage.title}」の模範解答が★3でクリアできる`, () => {
    const world0 = createWorld(stage);
    const { world, trace, error } = run(world0, stage.solution);
    assert.equal(error, null, `${stage.id}: 実行エラー`);
    const ev = evaluate({ world, stage, program: stage.solution, trace });
    assert.equal(ev.success, true, `${stage.id}: クリアできていない (${ev.reason})`);
    assert.equal(ev.stars, 3, `${stage.id}: ★3にならない (stars=${ev.stars}, blocks=${ev.blocks})`);
  });

  test(`ステージ ${stage.id} の solution は allowed ブロックのみを使う`, () => {
    const allowed = new Set(stage.allowed);
    const walk = (nodes) => {
      for (const n of nodes) {
        assert.ok(allowed.has(n.type), `${stage.id}: ${n.type} は allowed に無い`);
        if (n.body) walk(n.body);
        if (n.else) walk(n.else);
      }
    };
    walk(stage.solution);
  });
}
