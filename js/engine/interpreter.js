// interpreter.js — ブロックプログラムを実行し、アニメーション用トレースを生成する（DOM非依存）
//
// プログラムはブロックノードの配列。ノードの種類:
//   { type:'forward' }                          前進
//   { type:'left' } / { type:'right' }          左/右に90度回転
//   { type:'collect' }                          足元のジェムを拾う
//   { type:'repeat', times:n, body:[...] }      n回くり返す
//   { type:'if', cond, body:[...], else:[...] } 条件分岐
//   { type:'while', cond, body:[...] }          条件が真の間くり返す
//
// cond: 'path_ahead'（前に進める） / 'blocked'（前が壁） /
//       'on_gem'（足元にジェム） / 'at_goal'（ゴール上）

import {
  moveForward, turnLeft, turnRight, collect,
  canMoveForward, isOnGem, isAtGoal,
} from './world.js';

// while の暴走を防ぐ実行ステップ上限
export const MAX_STEPS = 500;

function evalCond(world, cond) {
  switch (cond) {
    case 'path_ahead': return canMoveForward(world);
    case 'blocked': return !canMoveForward(world);
    case 'on_gem': return isOnGem(world);
    case 'at_goal': return isAtGoal(world);
    default: return false;
  }
}

/**
 * プログラムを実行する。
 * @returns {{ trace: Array, world: object, error: string|null }}
 *   trace: 各アクションのイベント列。要素は
 *          { action, robot:{x,y,dir}, collected, bumped?, blockId? }
 */
export function run(initialWorld, program) {
  let world = initialWorld;
  const trace = [];
  let error = null;

  // 各アクション後にトレースへスナップショットを積む
  function record(action, extra = {}) {
    trace.push({
      action,
      robot: { ...world.robot },
      collected: world.collected,
      ...extra,
    });
  }

  function execList(list) {
    for (const node of list) {
      if (error) return;
      if (trace.length >= MAX_STEPS) {
        error = 'too_many_steps';
        return;
      }
      execNode(node);
    }
  }

  function execNode(node) {
    switch (node.type) {
      case 'forward': {
        const r = moveForward(world);
        world = r.world;
        record('forward', { bumped: r.bumped, blockId: node.id });
        break;
      }
      case 'left':
        world = turnLeft(world);
        record('left', { blockId: node.id });
        break;
      case 'right':
        world = turnRight(world);
        record('right', { blockId: node.id });
        break;
      case 'collect': {
        const r = collect(world);
        world = r.world;
        record('collect', { picked: r.picked, blockId: node.id });
        break;
      }
      case 'repeat': {
        const times = Math.max(0, node.times | 0);
        for (let i = 0; i < times; i++) {
          if (error || trace.length >= MAX_STEPS) break;
          execList(node.body || []);
        }
        break;
      }
      case 'if': {
        if (evalCond(world, node.cond)) execList(node.body || []);
        else if (node.else) execList(node.else);
        break;
      }
      case 'while': {
        while (evalCond(world, node.cond)) {
          if (error || trace.length >= MAX_STEPS) break;
          execList(node.body || []);
          if (trace.length >= MAX_STEPS) { error = 'too_many_steps'; break; }
        }
        break;
      }
      default:
        // 未知ブロックは無視（前方互換のため）
        break;
    }
  }

  execList(program || []);
  return { trace, world, error };
}

/** プログラム内のアクションブロック数（repeat/if/while の入れ子も展開せず素の個数を数える） */
export function countBlocks(program) {
  let n = 0;
  for (const node of program || []) {
    n += 1;
    if (node.body) n += countBlocks(node.body);
    if (node.else) n += countBlocks(node.else);
  }
  return n;
}
