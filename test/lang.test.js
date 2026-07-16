// lang.test.js — pyGen（ブロック→Python）と pyParse（Python→ブロック）のテスト
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { astToPython } from '../js/lang/pyGen.js';
import { parsePython } from '../js/lang/pyParse.js';
import { STAGES } from '../data/stages.js';
import { createWorld, DIR } from '../js/engine/world.js';
import { run } from '../js/engine/interpreter.js';
import { evaluate } from '../js/engine/rules.js';

test('pyGen: 基本アクション', () => {
  const py = astToPython([{ type: 'forward' }, { type: 'left' }, { type: 'collect' }]);
  assert.equal(py, 'robot.forward()\nrobot.turn_left()\nrobot.collect()');
});

test('pyGen: repeat → for range', () => {
  const py = astToPython([{ type: 'repeat', times: 3, body: [{ type: 'forward' }] }]);
  assert.equal(py, 'for i in range(3):\n    robot.forward()');
});

test('pyGen: if/else と while の条件', () => {
  const py = astToPython([
    { type: 'while', cond: 'path_ahead', body: [{ type: 'forward' }] },
    { type: 'if', cond: 'on_gem', body: [{ type: 'collect' }], else: [{ type: 'right' }] },
  ]);
  assert.equal(py, [
    'while robot.can_move():',
    '    robot.forward()',
    'if robot.on_gem():',
    '    robot.collect()',
    'else:',
    '    robot.turn_right()',
  ].join('\n'));
});

test('pyGen: 空ボディは pass', () => {
  const py = astToPython([{ type: 'repeat', times: 2, body: [] }]);
  assert.equal(py, 'for i in range(2):\n    pass');
});

test('pyParse: 基本アクション', () => {
  const { program, error } = parsePython('robot.forward()\nrobot.turn_left()');
  assert.equal(error, null);
  assert.deepEqual(program, [{ type: 'forward' }, { type: 'left' }]);
});

test('pyParse: for range → repeat', () => {
  const { program, error } = parsePython('for i in range(4):\n    robot.forward()');
  assert.equal(error, null);
  assert.deepEqual(program, [{ type: 'repeat', times: 4, body: [{ type: 'forward' }] }]);
});

test('pyParse: while + 条件', () => {
  const { program, error } = parsePython('while robot.can_move():\n    robot.forward()');
  assert.equal(error, null);
  assert.deepEqual(program, [{ type: 'while', cond: 'path_ahead', body: [{ type: 'forward' }] }]);
});

test('pyParse: if / elif / else', () => {
  const src = [
    'if robot.on_gem():',
    '    robot.collect()',
    'elif robot.can_move():',
    '    robot.forward()',
    'else:',
    '    robot.turn_right()',
  ].join('\n');
  const { program, error } = parsePython(src);
  assert.equal(error, null);
  assert.equal(program.length, 1);
  assert.equal(program[0].type, 'if');
  assert.equal(program[0].cond, 'on_gem');
  assert.equal(program[0].body[0].type, 'collect');
  // elif は else の中の if としてネスト
  assert.equal(program[0].else[0].type, 'if');
  assert.equal(program[0].else[0].cond, 'path_ahead');
  assert.equal(program[0].else[0].else[0].type, 'right');
});

test('pyParse: ネストした for', () => {
  const src = 'for i in range(2):\n    robot.forward()\n    robot.turn_right()';
  const { program, error } = parsePython(src);
  assert.equal(error, null);
  assert.deepEqual(program, [{
    type: 'repeat', times: 2,
    body: [{ type: 'forward' }, { type: 'right' }],
  }]);
});

test('pyParse: エラー — 読めない行', () => {
  const { error } = parsePython('robot.jump()');
  assert.ok(error && error.includes('よめない'));
});

test('pyParse: エラー — 中身が無い', () => {
  const { error } = parsePython('for i in range(3):');
  assert.ok(error && error.includes('なかみ'));
});

test('pyParse: エラー — 最初の行がインデント', () => {
  const { error } = parsePython('    robot.forward()');
  assert.ok(error);
});

test('pyParse: エラー — 未知の条件', () => {
  const { error } = parsePython('while x > 0:\n    robot.forward()');
  assert.ok(error && error.includes('じょうけん'));
});

test('pyParse: コメントと空行は無視', () => {
  const { program, error } = parsePython('# コメント\n\nrobot.forward()  # うしろのコメント\n');
  assert.equal(error, null);
  assert.deepEqual(program, [{ type: 'forward' }]);
});

// --- 往復（ラウンドトリップ）: 全プロトタイプ解答が block→py→parse で同じ結果になる ---
for (const stage of STAGES) {
  test(`往復: ${stage.id} の解答が block→Python→parse で同じクリアになる`, () => {
    const py = astToPython(stage.solution);
    const { program, error } = parsePython(py);
    assert.equal(error, null, `${stage.id}: parse error: ${error}\n---\n${py}`);
    const { world, trace, error: runErr } = run(createWorld(stage), program);
    assert.equal(runErr, null);
    const ev = evaluate({ world, stage, program, trace });
    assert.equal(ev.success, true, `${stage.id}: 往復後にクリアできない`);
    assert.equal(ev.stars, 3, `${stage.id}: 往復後 ★3にならない`);
  });
}

test('往復: while で道なりに進むコードが解ける', () => {
  const stage = {
    grid: { cols: 5, rows: 1 }, robot: { x: 0, y: 0, dir: DIR.RIGHT },
    goal: { x: 4, y: 0 }, goalType: 'reach',
  };
  const { program, error } = parsePython('while robot.can_move():\n    robot.forward()');
  assert.equal(error, null);
  const { world } = run(createWorld(stage), program);
  assert.equal(world.robot.x, 4);
});
