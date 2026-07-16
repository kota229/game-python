// engine.test.js — ワールド・インタプリタ・クリア判定のテスト
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createWorld, DIR, moveForward, turnLeft, turnRight, collect,
  canMoveForward, isAtGoal,
} from '../js/engine/world.js';
import { run, countBlocks, MAX_STEPS } from '../js/engine/interpreter.js';
import { checkGoal, evaluate } from '../js/engine/rules.js';

function baseStage(overrides = {}) {
  return {
    grid: { cols: 5, rows: 5 },
    robot: { x: 0, y: 0, dir: DIR.RIGHT },
    goal: { x: 4, y: 0 },
    goalType: 'reach',
    ...overrides,
  };
}

test('world: 前進で座標が進む', () => {
  const w = createWorld(baseStage());
  const { world, bumped } = moveForward(w);
  assert.equal(bumped, false);
  assert.deepEqual({ x: world.robot.x, y: world.robot.y }, { x: 1, y: 0 });
  // 元の world は不変
  assert.equal(w.robot.x, 0);
});

test('world: 盤端でぶつかると移動しない', () => {
  const w = createWorld(baseStage({ robot: { x: 4, y: 0, dir: DIR.RIGHT } }));
  const { world, bumped } = moveForward(w);
  assert.equal(bumped, true);
  assert.equal(world.robot.x, 4);
});

test('world: 壁でぶつかる', () => {
  const w = createWorld(baseStage({ walls: [{ x: 1, y: 0 }] }));
  assert.equal(canMoveForward(w), false);
  const { bumped } = moveForward(w);
  assert.equal(bumped, true);
});

test('world: 回転', () => {
  let w = createWorld(baseStage());
  assert.equal(turnRight(w).robot.dir, DIR.DOWN);
  assert.equal(turnLeft(w).robot.dir, DIR.UP);
});

test('world: ジェム回収', () => {
  const w = createWorld(baseStage({ gems: [{ x: 0, y: 0 }], goalType: 'collect' }));
  assert.equal(w.totalGems, 1);
  const { world, picked } = collect(w);
  assert.equal(picked, true);
  assert.equal(world.collected, 1);
  // 何も無い所では拾えない
  assert.equal(collect(world).picked, false);
});

test('interpreter: 順次実行でゴールへ', () => {
  const w = createWorld(baseStage());
  const program = [
    { type: 'forward' }, { type: 'forward' }, { type: 'forward' }, { type: 'forward' },
  ];
  const { world, trace, error } = run(w, program);
  assert.equal(error, null);
  assert.equal(trace.length, 4);
  assert.ok(isAtGoal(world));
});

test('interpreter: repeat がくり返される', () => {
  const w = createWorld(baseStage());
  const program = [{ type: 'repeat', times: 4, body: [{ type: 'forward' }] }];
  const { world, trace } = run(w, program);
  assert.equal(trace.length, 4);
  assert.ok(isAtGoal(world));
});

test('interpreter: if は条件で分岐する', () => {
  // 前方に壁 → path_ahead は偽 → body 実行されない
  const w = createWorld(baseStage({ walls: [{ x: 1, y: 0 }] }));
  const program = [{ type: 'if', cond: 'path_ahead', body: [{ type: 'forward' }] }];
  const { trace } = run(w, program);
  assert.equal(trace.length, 0);
});

test('interpreter: while で道なりに進む', () => {
  const w = createWorld(baseStage()); // (0,0)→(4,0) まで道
  const program = [{ type: 'while', cond: 'path_ahead', body: [{ type: 'forward' }] }];
  const { world, error } = run(w, program);
  assert.equal(error, null);
  assert.equal(world.robot.x, 4);
});

test('interpreter: 無限ループは MAX_STEPS で止まる', () => {
  // その場で回り続ける while（条件が常に真）
  const w = createWorld(baseStage());
  const program = [{ type: 'while', cond: 'at_goal', body: [{ type: 'left' }] , }];
  // at_goal は偽なので実行されない。無限ループ検証は別途:
  const spin = createWorld(baseStage({ robot: { x: 4, y: 0, dir: DIR.RIGHT } }));
  const prog2 = [{ type: 'while', cond: 'blocked', body: [{ type: 'left' }, { type: 'right' }] }];
  const { error, trace } = run(spin, prog2);
  assert.equal(error, 'too_many_steps');
  assert.ok(trace.length >= MAX_STEPS);
  // 1つ目は何も起きない
  assert.equal(run(w, program).trace.length, 0);
});

test('countBlocks: 入れ子も数える', () => {
  const program = [
    { type: 'forward' },
    { type: 'repeat', times: 3, body: [{ type: 'forward' }, { type: 'left' }] },
  ];
  assert.equal(countBlocks(program), 4); // forward + repeat + (forward + left)
});

test('rules: reach 判定', () => {
  const stage = baseStage();
  const w = createWorld(stage);
  assert.equal(checkGoal(w, stage).success, false);
  const { world } = run(w, [
    { type: 'forward' }, { type: 'forward' }, { type: 'forward' }, { type: 'forward' },
  ]);
  assert.equal(checkGoal(world, stage).success, true);
});

test('rules: collect_and_reach 判定', () => {
  const stage = baseStage({
    gems: [{ x: 2, y: 0 }],
    goalType: 'collect_and_reach',
  });
  const w = createWorld(stage);
  // ジェムを拾わずゴールへ → 失敗
  let r = run(w, [{ type: 'forward' }, { type: 'forward' }, { type: 'forward' }, { type: 'forward' }]);
  assert.equal(checkGoal(r.world, stage).success, false);
  // 拾ってからゴール → 成功
  r = run(w, [
    { type: 'forward' }, { type: 'forward' }, { type: 'collect' },
    { type: 'forward' }, { type: 'forward' },
  ]);
  assert.equal(checkGoal(r.world, stage).success, true);
});

test('rules: スター評価（閾値あり）', () => {
  const stage = baseStage({ stars: { three: 4, two: 6 } });
  const w = createWorld(stage);
  // 最短4ブロックでクリア → ★3
  let r = run(w, [
    { type: 'forward' }, { type: 'forward' }, { type: 'forward' }, { type: 'forward' },
  ]);
  let ev = evaluate({ world: r.world, stage, program: [
    { type: 'forward' }, { type: 'forward' }, { type: 'forward' }, { type: 'forward' },
  ], trace: r.trace });
  assert.equal(ev.success, true);
  assert.equal(ev.stars, 3);

  // repeat で2ブロック → ★3
  const prog2 = [{ type: 'repeat', times: 4, body: [{ type: 'forward' }] }];
  r = run(w, prog2);
  ev = evaluate({ world: r.world, stage, program: prog2, trace: r.trace });
  assert.equal(ev.stars, 3);
});

test('rules: 失敗時は★0', () => {
  const stage = baseStage();
  const w = createWorld(stage);
  const r = run(w, [{ type: 'forward' }]); // 途中で止まる
  const ev = evaluate({ world: r.world, stage, program: [{ type: 'forward' }], trace: r.trace });
  assert.equal(ev.success, false);
  assert.equal(ev.stars, 0);
});
