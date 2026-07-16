// rules.js — クリア判定とスター評価（DOM非依存・純粋関数）
import { isAtGoal } from './world.js';
import { countBlocks } from './interpreter.js';

/**
 * 最終ワールドがステージのゴール条件を満たすか判定する。
 * goalType:
 *   'reach'            … ゴールに到達
 *   'collect'          … すべてのジェムを回収
 *   'collect_and_reach'… 全ジェム回収 かつ ゴール到達
 * @returns {{ success:boolean, reason:string }}
 */
export function checkGoal(world, stage) {
  const type = stage.goalType || (world.goal ? 'reach' : 'collect');
  const allGems = world.collected >= world.totalGems;
  const atGoal = isAtGoal(world);

  switch (type) {
    case 'reach':
      return atGoal
        ? { success: true, reason: 'goal_reached' }
        : { success: false, reason: 'not_at_goal' };
    case 'collect':
      return allGems
        ? { success: true, reason: 'all_collected' }
        : { success: false, reason: 'gems_remaining' };
    case 'collect_and_reach':
      if (!allGems) return { success: false, reason: 'gems_remaining' };
      return atGoal
        ? { success: true, reason: 'done' }
        : { success: false, reason: 'not_at_goal' };
    default:
      return { success: false, reason: 'unknown_goal' };
  }
}

/**
 * スター3段階評価。
 *   クリアできなければ 0。
 *   クリア + 途中で壁にぶつからない かつ ブロック数が閾値以内で 2〜3。
 * stage.stars = { three:Nブロック以内で★3, two:Mブロック以内で★2 } を任意で指定。
 * 未指定なら「クリア=★3」（初期ステージ向け）。
 * @param {object} params { world, stage, program, trace }
 * @returns {{ success:boolean, stars:number, reason:string, bumped:boolean }}
 */
export function evaluate({ world, stage, program, trace }) {
  const goal = checkGoal(world, stage);
  const bumped = (trace || []).some((s) => s.bumped);
  if (!goal.success) {
    return { success: false, stars: 0, reason: goal.reason, bumped };
  }

  const thresholds = stage.stars;
  if (!thresholds) {
    // 閾値未指定: クリアで★3（ただしぶつかったら★2）
    return { success: true, stars: bumped ? 2 : 3, reason: 'cleared', bumped };
  }

  const blocks = countBlocks(program);
  let stars = 1;
  if (blocks <= thresholds.three) stars = 3;
  else if (blocks <= thresholds.two) stars = 2;
  // 壁にぶつかると最大★2に制限（丁寧に解けたことを評価）
  if (bumped && stars === 3) stars = 2;

  return { success: true, stars, reason: 'cleared', bumped, blocks };
}
