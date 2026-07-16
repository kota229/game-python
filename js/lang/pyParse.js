// pyParse.js — ロボット制御サブセットの Python → ブロックAST（既存トレースエンジンで実行）。
// DOM非依存の純粋関数。対応構文:
//   robot.forward() / robot.turn_left() / robot.turn_right() / robot.collect()
//   for <name> in range(<int>):
//   while <cond>:
//   if <cond>:  /  elif <cond>:  /  else:
//   pass
//   cond: robot.can_move() | not robot.can_move() | robot.on_gem() | robot.at_goal()
//
// 返り値: { program, error }  error は子ども向け日本語メッセージ（null=成功）。

const ACTION_MAP = { forward: 'forward', turn_left: 'left', turn_right: 'right', collect: 'collect' };

const RE = {
  action: /^robot\.(forward|turn_left|turn_right|collect)\(\s*\)$/,
  forRange: /^for\s+[A-Za-z_]\w*\s+in\s+range\(\s*(\d+)\s*\)\s*:$/,
  whileH: /^while\s+(.+?)\s*:$/,
  ifH: /^if\s+(.+?)\s*:$/,
  elifH: /^elif\s+(.+?)\s*:$/,
  elseH: /^else\s*:$/,
  pass: /^pass$/,
};

function condFromPy(text) {
  const t = text.trim().replace(/\s+/g, ' ');
  switch (t) {
    case 'robot.can_move()': return 'path_ahead';
    case 'not robot.can_move()': return 'blocked';
    case 'robot.on_gem()': return 'on_gem';
    case 'robot.at_goal()': return 'at_goal';
    default: return null;
  }
}

class PyError extends Error {
  constructor(msg, line) { super(msg); this.line = line; }
}

export function parsePython(src) {
  // 前処理: タブを4スペースに、コメント除去、空行除去。indent と本文を抽出。
  const raw = String(src ?? '').replace(/\t/g, '    ').split(/\r?\n/);
  const toks = [];
  for (let i = 0; i < raw.length; i++) {
    let line = raw[i];
    const hash = line.indexOf('#');
    if (hash >= 0) line = line.slice(0, hash);
    if (line.trim() === '') continue;
    const indent = line.length - line.trimStart().length;
    toks.push({ indent, text: line.trim(), line: i + 1 });
  }

  if (toks.length === 0) return { program: [], error: null };

  try {
    if (toks[0].indent !== 0) throw new PyError('さいしょの行は インデント（すきま）を いれないでね', toks[0].line);
    const { nodes, next } = parseSuite(toks, 0, 0);
    if (next !== toks.length) {
      throw new PyError('インデント（すきま）の ばしょが おかしいよ', toks[next].line);
    }
    return { program: nodes, error: null };
  } catch (e) {
    if (e instanceof PyError) return { program: [], error: `${e.line}行め: ${e.message}` };
    return { program: [], error: 'コードが よめなかったよ' };
  }
}

// indent レベルの一連の文をパースする。tokens[i].indent === indent の間だけ読む。
function parseSuite(toks, i, indent) {
  const nodes = [];
  while (i < toks.length && toks[i].indent === indent) {
    const tk = toks[i];
    const t = tk.text;

    if (RE.pass.test(t)) { i++; continue; }

    let m;
    if ((m = t.match(RE.action))) {
      nodes.push({ type: ACTION_MAP[m[1]] });
      i++;
      continue;
    }
    if ((m = t.match(RE.forRange))) {
      const times = parseInt(m[1], 10);
      const body = parseBody(toks, i, indent);
      nodes.push({ type: 'repeat', times, body: body.nodes });
      i = body.next;
      continue;
    }
    if ((m = t.match(RE.whileH))) {
      const cond = condFromPy(m[1]);
      if (!cond) throw new PyError('while の じょうけんが わからないよ', tk.line);
      const body = parseBody(toks, i, indent);
      nodes.push({ type: 'while', cond, body: body.nodes });
      i = body.next;
      continue;
    }
    if ((m = t.match(RE.ifH))) {
      const cond = condFromPy(m[1]);
      if (!cond) throw new PyError('if の じょうけんが わからないよ', tk.line);
      const body = parseBody(toks, i, indent);
      const node = { type: 'if', cond, body: body.nodes };
      i = body.next;
      // 続く elif / else を処理（同じ indent）
      i = attachElse(toks, i, indent, node);
      nodes.push(node);
      continue;
    }
    if (RE.elifH.test(t) || RE.elseH.test(t)) {
      throw new PyError('if が ないのに elif / else が あるよ', tk.line);
    }

    throw new PyError(`この行は よめないよ: 「${t}」`, tk.line);
  }
  return { nodes, next: i };
}

// ヘッダ行 toks[i] の子ブロック（1段深いインデント）をパースする。
function parseBody(toks, i, headerIndent) {
  const headerLine = toks[i].line;
  if (i + 1 >= toks.length || toks[i + 1].indent <= headerIndent) {
    throw new PyError('このあとに インデントした なかみが ひつようだよ', headerLine);
  }
  const childIndent = toks[i + 1].indent;
  return parseSuite(toks, i + 1, childIndent);
}

// if ノードに続く elif/else を node.else へ結合する。
function attachElse(toks, i, indent, ifNode) {
  if (i >= toks.length || toks[i].indent !== indent) return i;
  const tk = toks[i];
  let m;
  if ((m = tk.text.match(RE.elifH))) {
    const cond = condFromPy(m[1]);
    if (!cond) throw new PyError('elif の じょうけんが わからないよ', tk.line);
    const body = parseBody(toks, i, indent);
    const elifNode = { type: 'if', cond, body: body.nodes };
    let next = body.next;
    next = attachElse(toks, next, indent, elifNode); // elif の連鎖
    ifNode.else = [elifNode];
    return next;
  }
  if (RE.elseH.test(tk.text)) {
    const body = parseBody(toks, i, indent);
    ifNode.else = body.nodes;
    return body.next;
  }
  return i;
}

export { condFromPy };
