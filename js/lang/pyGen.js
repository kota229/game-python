// pyGen.js — ブロックAST → Python ソース文字列（Stage 2 の「ブロック⇔Python併記」用）。
// ロボット制御サブセット。DOM非依存の純粋関数。

// 条件（内部cond）→ Python式
const COND_PY = {
  path_ahead: 'robot.can_move()',
  blocked: 'not robot.can_move()',
  on_gem: 'robot.on_gem()',
  at_goal: 'robot.at_goal()',
};

const ACTION_PY = {
  forward: 'robot.forward()',
  left: 'robot.turn_left()',
  right: 'robot.turn_right()',
  collect: 'robot.collect()',
};

function condToPy(cond) {
  return COND_PY[cond] || 'False';
}

/**
 * ブロックASTをPythonソースへ変換する。
 * @param {Array} program ブロックノード配列
 * @param {object} opts { indentUnit='    ' }
 * @returns {string}
 */
export function astToPython(program, opts = {}) {
  const unit = opts.indentUnit ?? '    ';
  const lines = [];

  function emit(list, depth) {
    const pad = unit.repeat(depth);
    if (!list || list.length === 0) {
      lines.push(pad + 'pass');
      return;
    }
    for (const node of list) {
      switch (node.type) {
        case 'forward':
        case 'left':
        case 'right':
        case 'collect':
          lines.push(pad + ACTION_PY[node.type]);
          break;
        case 'repeat':
          lines.push(`${pad}for i in range(${node.times | 0}):`);
          emit(node.body, depth + 1);
          break;
        case 'while':
          lines.push(`${pad}while ${condToPy(node.cond)}:`);
          emit(node.body, depth + 1);
          break;
        case 'if':
          lines.push(`${pad}if ${condToPy(node.cond)}:`);
          emit(node.body, depth + 1);
          if (node.else && node.else.length) {
            lines.push(`${pad}else:`);
            emit(node.else, depth + 1);
          }
          break;
        default:
          break;
      }
    }
  }

  emit(program, 0);
  return lines.join('\n');
}

export { condToPy, ACTION_PY, COND_PY };
