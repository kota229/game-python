// world.js — グリッドワールドの状態モデル（DOM非依存・純粋関数）
//
// 座標系: x=列(0..cols-1), y=行(0..rows-1)。y は下方向に増える。
// 向き dir: 0=上(北), 1=右(東), 2=下(南), 3=左(西)。

export const DIR = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3 };

// 各向きの移動量
const DELTA = [
  { dx: 0, dy: -1 }, // UP
  { dx: 1, dy: 0 },  // RIGHT
  { dx: 0, dy: 1 },  // DOWN
  { dx: -1, dy: 0 }, // LEFT
];

const cellKey = (x, y) => `${x},${y}`;

/**
 * ステージ定義から初期ワールド状態を生成する。
 * stage.walls / stage.gems は [{x,y}, ...] の配列。
 */
export function createWorld(stage) {
  const g = stage.grid || { cols: 5, rows: 5 };
  return {
    cols: g.cols,
    rows: g.rows,
    robot: {
      x: stage.robot.x,
      y: stage.robot.y,
      dir: stage.robot.dir ?? DIR.RIGHT,
    },
    goal: stage.goal ? { x: stage.goal.x, y: stage.goal.y } : null,
    walls: new Set((stage.walls || []).map((c) => cellKey(c.x, c.y))),
    // 未回収のジェム集合
    gems: new Set((stage.gems || []).map((c) => cellKey(c.x, c.y))),
    collected: 0,
    totalGems: (stage.gems || []).length,
  };
}

export function isWall(world, x, y) {
  return world.walls.has(cellKey(x, y));
}

export function inBounds(world, x, y) {
  return x >= 0 && y >= 0 && x < world.cols && y < world.rows;
}

/** ロボットの前方セル座標を返す */
export function frontCell(world) {
  const d = DELTA[world.robot.dir];
  return { x: world.robot.x + d.dx, y: world.robot.y + d.dy };
}

/** 前方に進めるか（盤内かつ壁でない） */
export function canMoveForward(world) {
  const { x, y } = frontCell(world);
  return inBounds(world, x, y) && !isWall(world, x, y);
}

export function hasGemAt(world, x, y) {
  return world.gems.has(cellKey(x, y));
}

export function isOnGem(world) {
  return hasGemAt(world, world.robot.x, world.robot.y);
}

export function isAtGoal(world) {
  return !!world.goal && world.robot.x === world.goal.x && world.robot.y === world.goal.y;
}

// --- 状態を進める操作。いずれも新しい world を返す（不変的に扱う） ---

function clone(world) {
  return {
    ...world,
    robot: { ...world.robot },
    walls: world.walls, // 壁は不変
    gems: new Set(world.gems),
  };
}

/**
 * 前進。壁や盤端でぶつかった場合は移動せず bumped=true を返す。
 * @returns {{ world, bumped:boolean }}
 */
export function moveForward(world) {
  if (!canMoveForward(world)) {
    return { world, bumped: true };
  }
  const d = DELTA[world.robot.dir];
  const next = clone(world);
  next.robot.x += d.dx;
  next.robot.y += d.dy;
  return { world: next, bumped: false };
}

export function turnLeft(world) {
  const next = clone(world);
  next.robot.dir = (next.robot.dir + 3) % 4;
  return next;
}

export function turnRight(world) {
  const next = clone(world);
  next.robot.dir = (next.robot.dir + 1) % 4;
  return next;
}

/**
 * 足元のジェムを拾う。ジェムが無ければ失敗（picked=false）。
 * @returns {{ world, picked:boolean }}
 */
export function collect(world) {
  if (!isOnGem(world)) {
    return { world, picked: false };
  }
  const next = clone(world);
  next.gems.delete(cellKey(world.robot.x, world.robot.y));
  next.collected += 1;
  return { world: next, picked: true };
}

export { cellKey };
