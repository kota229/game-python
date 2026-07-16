// stages.test.js — 全ステージの解答が実際にクリア可能かをデータ検証する（全モード対応）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STAGES } from '../data/stages.js';
import { createWorld } from '../js/engine/world.js';
import { run } from '../js/engine/interpreter.js';
import { evaluate } from '../js/engine/rules.js';
import { parsePython } from '../js/lang/pyParse.js';
import { runPython } from '../js/lang/pyRun.js';

const mode = (s) => s.mode || 'block';

// fill テンプレートに解答を差し込んで Python 文字列を作る
function assembleFill(stage) {
  let code = stage.fill.template;
  stage.fill.blanks.forEach((b, i) => {
    code = code.replace(new RegExp(`\\{${i}\\}`, 'g'), b.answer);
  });
  return code;
}

test('全ステージに必須フィールドがある', () => {
  const ids = new Set();
  for (const s of STAGES) {
    assert.ok(s.id, 'id 必須');
    assert.ok(!ids.has(s.id), `id 重複: ${s.id}`); ids.add(s.id);
    assert.ok(s.title, `${s.id}: title 必須`);
    assert.ok(Array.isArray(s.hints) && s.hints.length >= 1, `${s.id}: hints 必須`);
    const m = mode(s);
    if (m !== 'compute') {
      assert.ok(s.grid && s.grid.cols && s.grid.rows, `${s.id}: grid 必須`);
      assert.ok(s.robot, `${s.id}: robot 必須`);
    }
    if (m === 'block' || m === 'bridge') assert.ok(Array.isArray(s.solution), `${s.id}: solution 必須`);
    if (m === 'fill') assert.ok(s.fill && s.fill.template && Array.isArray(s.fill.blanks), `${s.id}: fill 必須`);
    if (m === 'free') assert.ok(typeof s.solutionCode === 'string', `${s.id}: solutionCode 必須`);
    if (m === 'compute') {
      assert.ok(typeof s.solutionCode === 'string', `${s.id}: solutionCode 必須`);
      assert.ok(s.check && typeof s.check.output === 'string', `${s.id}: check.output 必須`);
    }
  }
});

for (const stage of STAGES) {
  const m = mode(stage);

  if (m === 'block' || m === 'bridge') {
    test(`[${m}] ${stage.id}「${stage.title}」の解答が★3でクリア`, () => {
      const { world, trace, error } = run(createWorld(stage), stage.solution);
      assert.equal(error, null, `${stage.id}: 実行エラー`);
      const ev = evaluate({ world, stage, program: stage.solution, trace });
      assert.equal(ev.success, true, `${stage.id}: 未クリア (${ev.reason})`);
      assert.equal(ev.stars, 3, `${stage.id}: ★3にならない (stars=${ev.stars})`);
    });
    test(`[${m}] ${stage.id} の solution は allowed のみ`, () => {
      const allowed = new Set(stage.allowed);
      const walk = (nodes) => nodes.forEach((n) => {
        assert.ok(allowed.has(n.type), `${stage.id}: ${n.type} は allowed に無い`);
        if (n.body) walk(n.body); if (n.else) walk(n.else);
      });
      walk(stage.solution);
    });
  }

  if (m === 'fill') {
    test(`[fill] ${stage.id}「${stage.title}」の解答でクリア`, () => {
      const code = assembleFill(stage);
      const { program, error } = parsePython(code);
      assert.equal(error, null, `${stage.id}: parse error: ${error}\n${code}`);
      const { world, trace } = run(createWorld(stage), program);
      const ev = evaluate({ world, stage, program, trace });
      assert.equal(ev.success, true, `${stage.id}: 未クリア (${ev.reason})`);
    });
  }

  if (m === 'free') {
    test(`[free] ${stage.id}「${stage.title}」の solutionCode でクリア`, () => {
      const { program, error } = parsePython(stage.solutionCode);
      assert.equal(error, null, `${stage.id}: parse error: ${error}`);
      const { world, trace } = run(createWorld(stage), program);
      const ev = evaluate({ world, stage, program, trace });
      assert.equal(ev.success, true, `${stage.id}: 未クリア (${ev.reason})`);
    });
  }

  if (m === 'compute') {
    test(`[compute] ${stage.id}「${stage.title}」の solutionCode が 正しい出力`, () => {
      const r = runPython(stage.solutionCode);
      assert.equal(r.error, null, `${stage.id}: 実行エラー: ${r.error}`);
      assert.equal(r.output.trim(), stage.check.output.trim(), `${stage.id}: 出力が 期待と違う`);
    });
  }
}
