// pyRun.js — 計算/出力パズル用の Python サブセット・インタプリタ（DOM非依存・純粋）。
// 対応: 変数代入、四則演算(+ - * / // % **)、比較、and/or/not、
//   if/elif/else、for x in ...、while、def/return、print、リスト([]、append、index、len)、
//   文字列（'..' "..", + 連結, str/int, upper/lower）、range/len/str/int/abs/sum/min/max/bool。
// ロボット制御用の pyParse.js とは別物（あちらは既存トレースエンジン向け）。

const MAX_STEPS = 200000;

// ---------- トークナイザ ----------
const KEYWORDS = new Set(['if', 'elif', 'else', 'for', 'in', 'while', 'def', 'return', 'pass', 'and', 'or', 'not', 'True', 'False', 'None']);
const THREE = [];
const TWO = ['**', '//', '==', '!=', '<=', '>='];

function tokenizeLine(text, lineNo) {
  const toks = [];
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (c === ' ' || c === '\t') { i++; continue; }
    if (c === '#') break; // 行コメント
    // 文字列
    if (c === '"' || c === "'") {
      let j = i + 1, s = '';
      while (j < n && text[j] !== c) {
        if (text[j] === '\\' && j + 1 < n) { // 簡易エスケープ
          const e = text[j + 1];
          s += e === 'n' ? '\n' : e === 't' ? '\t' : e;
          j += 2; continue;
        }
        s += text[j]; j++;
      }
      if (j >= n) throw new PyRunError('文字列の おわりの クォートが ないよ', lineNo);
      toks.push({ t: 'str', v: s }); i = j + 1; continue;
    }
    // 数値
    if (c >= '0' && c <= '9') {
      let j = i, num = '';
      while (j < n && ((text[j] >= '0' && text[j] <= '9') || text[j] === '.')) { num += text[j]; j++; }
      toks.push({ t: 'num', v: Number(num) }); i = j; continue;
    }
    // 名前・キーワード
    if (/[A-Za-z_]/.test(c)) {
      let j = i, name = '';
      while (j < n && /[A-Za-z0-9_]/.test(text[j])) { name += text[j]; j++; }
      toks.push({ t: KEYWORDS.has(name) ? name : 'name', v: name }); i = j; continue;
    }
    // 2文字演算子
    const two = text.slice(i, i + 2);
    if (TWO.includes(two)) { toks.push({ t: 'op', v: two }); i += 2; continue; }
    // 1文字
    if ('+-*/%<>=(),:[].'.includes(c)) { toks.push({ t: 'op', v: c }); i++; continue; }
    throw new PyRunError(`よめない もじ: 「${c}」`, lineNo);
  }
  return toks;
}

class PyRunError extends Error {
  constructor(msg, line) { super(msg); this.line = line; }
}

// ---------- 行→インデント付きトークン列 ----------
function preprocess(src) {
  const raw = String(src ?? '').replace(/\t/g, '    ').split(/\r?\n/);
  const lines = [];
  for (let i = 0; i < raw.length; i++) {
    let line = raw[i];
    // コメント/空行判定（文字列内#は簡易的に無視しないが、行頭#と空行のみ除外）
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
    const indent = line.length - line.trimStart().length;
    lines.push({ indent, toks: tokenizeLine(line, i + 1), line: i + 1 });
  }
  return lines;
}

// ---------- パーサ ----------
function parse(src) {
  const lines = preprocess(src);
  let pos = 0;

  function parseSuite(indent) {
    const stmts = [];
    while (pos < lines.length && lines[pos].indent === indent) {
      stmts.push(parseStatement(indent));
    }
    return stmts;
  }

  function childBlock(headerIndent, headerLine) {
    if (pos >= lines.length || lines[pos].indent <= headerIndent) {
      throw new PyRunError('このあとに インデントした なかみが ひつようだよ', headerLine);
    }
    return parseSuite(lines[pos].indent);
  }

  function parseStatement(indent) {
    const ln = lines[pos];
    const toks = ln.toks;
    const first = toks[0];
    const kw = first.t;

    if (kw === 'pass') { pos++; return { type: 'pass' }; }
    if (kw === 'return') {
      pos++;
      const expr = toks.length > 1 ? new ExprParser(toks.slice(1), ln.line).parse() : null;
      return { type: 'return', expr };
    }
    if (kw === 'if' || kw === 'elif') {
      expectColonEnd(toks, ln.line);
      const cond = new ExprParser(toks.slice(1, toks.length - 1), ln.line).parse();
      pos++;
      const body = childBlock(indent, ln.line);
      let orelse = [];
      if (pos < lines.length && lines[pos].indent === indent) {
        const nk = lines[pos].toks[0].t;
        if (nk === 'elif') orelse = [parseStatement(indent)];
        else if (nk === 'else') {
          const el = lines[pos]; expectColonOnly(el.toks, el.line); pos++;
          orelse = childBlock(indent, el.line);
        }
      }
      return { type: 'if', cond, body, orelse };
    }
    if (kw === 'else' || kw === 'elif') {
      throw new PyRunError('if が ないのに else / elif が あるよ', ln.line);
    }
    if (kw === 'while') {
      expectColonEnd(toks, ln.line);
      const cond = new ExprParser(toks.slice(1, toks.length - 1), ln.line).parse();
      pos++;
      const body = childBlock(indent, ln.line);
      return { type: 'while', cond, body };
    }
    if (kw === 'for') {
      // for NAME in EXPR :
      if (toks[1]?.t !== 'name' || toks[2]?.v !== 'in') throw new PyRunError('for の かきかたが ちがうよ', ln.line);
      expectColonEnd(toks, ln.line);
      const varName = toks[1].v;
      const iter = new ExprParser(toks.slice(3, toks.length - 1), ln.line).parse();
      pos++;
      const body = childBlock(indent, ln.line);
      return { type: 'for', varName, iter, body };
    }
    if (kw === 'def') {
      // def NAME ( params ) :
      if (toks[1]?.t !== 'name' || toks[2]?.v !== '(') throw new PyRunError('def の かきかたが ちがうよ', ln.line);
      expectColonEnd(toks, ln.line);
      const name = toks[1].v;
      const params = [];
      let k = 3;
      while (toks[k] && toks[k].v !== ')') {
        if (toks[k].t === 'name') params.push(toks[k].v);
        else if (toks[k].v !== ',') throw new PyRunError('def の ひきすうが おかしいよ', ln.line);
        k++;
      }
      pos++;
      const body = childBlock(indent, ln.line);
      return { type: 'def', name, params, body };
    }

    // 代入 or 式文: トップレベルの単独 '=' を探す
    const eq = topLevelAssign(toks);
    if (eq >= 0) {
      const target = new ExprParser(toks.slice(0, eq), ln.line).parse();
      const value = new ExprParser(toks.slice(eq + 1), ln.line).parse();
      pos++;
      return { type: 'assign', target, value };
    }
    const expr = new ExprParser(toks, ln.line).parse();
    pos++;
    return { type: 'expr', expr };
  }

  const body = pos < lines.length ? (lines[0].indent === 0 ? parseSuite(0) : (() => { throw new PyRunError('さいしょの行は インデントしないでね', lines[0].line); })()) : [];
  if (pos !== lines.length) throw new PyRunError('インデントの ばしょが おかしいよ', lines[pos].line);
  return body;
}

function expectColonEnd(toks, line) {
  if (!toks.length || toks[toks.length - 1].v !== ':') throw new PyRunError('さいごに : が ひつようだよ', line);
}
function expectColonOnly(toks, line) {
  if (toks.length !== 2 || toks[1].v !== ':') throw new PyRunError('else: の かきかたが ちがうよ', line);
}
// トップレベル（括弧の外）の単独 '=' の位置。無ければ -1。
function topLevelAssign(toks) {
  let depth = 0;
  for (let i = 0; i < toks.length; i++) {
    const v = toks[i].v;
    if (v === '(' || v === '[') depth++;
    else if (v === ')' || v === ']') depth--;
    else if (v === '=' && depth === 0 && toks[i].t === 'op') return i;
  }
  return -1;
}

// ---------- 式パーサ（優先順位つき） ----------
class ExprParser {
  constructor(toks, line) { this.toks = toks; this.i = 0; this.line = line; }
  peek() { return this.toks[this.i]; }
  next() { return this.toks[this.i++]; }
  err(m) { throw new PyRunError(m, this.line); }
  parse() {
    if (this.toks.length === 0) this.err('しきが ないよ');
    const e = this.parseOr();
    if (this.i !== this.toks.length) this.err('しきの かきかたが ちがうよ');
    return e;
  }
  parseOr() { let l = this.parseAnd(); while (this.peek()?.t === 'or') { this.next(); l = { type: 'bool', op: 'or', l, r: this.parseAnd() }; } return l; }
  parseAnd() { let l = this.parseNot(); while (this.peek()?.t === 'and') { this.next(); l = { type: 'bool', op: 'and', l, r: this.parseNot() }; } return l; }
  parseNot() { if (this.peek()?.t === 'not') { this.next(); return { type: 'not', e: this.parseNot() }; } return this.parseCmp(); }
  parseCmp() {
    let l = this.parseAdd();
    const CMP = ['==', '!=', '<', '<=', '>', '>='];
    while (this.peek()?.t === 'op' && CMP.includes(this.peek().v)) { const op = this.next().v; l = { type: 'cmp', op, l, r: this.parseAdd() }; }
    return l;
  }
  parseAdd() { let l = this.parseMul(); while (this.peek()?.t === 'op' && (this.peek().v === '+' || this.peek().v === '-')) { const op = this.next().v; l = { type: 'bin', op, l, r: this.parseMul() }; } return l; }
  parseMul() { let l = this.parseUnary(); while (this.peek()?.t === 'op' && ['*', '/', '//', '%'].includes(this.peek().v)) { const op = this.next().v; l = { type: 'bin', op, l, r: this.parseUnary() }; } return l; }
  parseUnary() { if (this.peek()?.t === 'op' && (this.peek().v === '-' || this.peek().v === '+')) { const op = this.next().v; return { type: 'unary', op, e: this.parseUnary() }; } return this.parsePow(); }
  parsePow() { const b = this.parsePostfix(); if (this.peek()?.v === '**') { this.next(); return { type: 'bin', op: '**', l: b, r: this.parseUnary() }; } return b; }
  parsePostfix() {
    let e = this.parseAtom();
    for (;;) {
      const p = this.peek();
      if (p?.v === '(') { this.next(); e = { type: 'call', fn: e, args: this.parseArgs() }; }
      else if (p?.v === '[') { this.next(); const idx = this.parseOr(); this.expect(']'); e = { type: 'index', obj: e, idx }; }
      else if (p?.v === '.') { this.next(); const nm = this.next(); if (nm?.t !== 'name') this.err('. の あとに なまえが ひつよう'); e = { type: 'attr', obj: e, name: nm.v }; }
      else break;
    }
    return e;
  }
  parseArgs() {
    const args = [];
    if (this.peek()?.v === ')') { this.next(); return args; }
    for (;;) { args.push(this.parseOr()); const p = this.next(); if (p?.v === ')') break; if (p?.v !== ',') this.err('ひきすうの , が ちがうよ'); }
    return args;
  }
  expect(v) { const t = this.next(); if (t?.v !== v) this.err(`${v} が ひつようだよ`); }
  parseAtom() {
    const t = this.next();
    if (!t) this.err('しきが とちゅうで おわったよ');
    if (t.t === 'num') return { type: 'num', v: t.v };
    if (t.t === 'str') return { type: 'str', v: t.v };
    if (t.t === 'True') return { type: 'const', v: true };
    if (t.t === 'False') return { type: 'const', v: false };
    if (t.t === 'None') return { type: 'const', v: null };
    if (t.t === 'name') return { type: 'name', v: t.v };
    if (t.v === '(') { const e = this.parseOr(); this.expect(')'); return e; }
    if (t.v === '[') {
      const items = [];
      if (this.peek()?.v === ']') { this.next(); return { type: 'list', items }; }
      for (;;) { items.push(this.parseOr()); const p = this.next(); if (p?.v === ']') break; if (p?.v !== ',') this.err('リストの , が ちがうよ'); }
      return { type: 'list', items };
    }
    this.err(`ここに 「${t.v}」は おけないよ`);
  }
}

// ---------- 評価器 ----------
class ReturnSignal { constructor(v) { this.value = v; } }

export function runPython(src) {
  let output = [];
  let steps = 0;
  const tick = (line) => { if (++steps > MAX_STEPS) throw new PyRunError('うごきすぎ！ ループを みなおそう', line); };

  let ast;
  try { ast = parse(src); }
  catch (e) { return { output: '', lines: [], vars: {}, error: fmtErr(e) }; }

  const globals = Object.create(null);

  function pyStr(v) {
    if (v === null) return 'None';
    if (v === true) return 'True';
    if (v === false) return 'False';
    if (Array.isArray(v)) return '[' + v.map(reprStr).join(', ') + ']';
    if (typeof v === 'number') return numStr(v);
    return String(v);
  }
  function reprStr(v) { return typeof v === 'string' ? `'${v}'` : pyStr(v); }
  function numStr(v) { return Number.isInteger(v) ? String(v) : String(v); }

  const BUILTINS = {
    print: (args) => { output.push(args.map(pyStr).join(' ')); return null; },
    len: (a) => { const x = a[0]; if (typeof x === 'string' || Array.isArray(x)) return x.length; throw new PyRunError('len() に つかえない ものだよ'); },
    range: (a) => {
      let start = 0, stop, step = 1;
      if (a.length === 1) stop = a[0]; else if (a.length >= 2) { start = a[0]; stop = a[1]; if (a.length >= 3) step = a[2]; }
      const out = []; if (step === 0) throw new PyRunError('range の step は 0に できないよ');
      if (step > 0) for (let i = start; i < stop; i += step) out.push(i);
      else for (let i = start; i > stop; i += step) out.push(i);
      return out;
    },
    str: (a) => pyStr(a[0]),
    int: (a) => { const x = a[0]; const n = typeof x === 'string' ? parseInt(x, 10) : Math.trunc(x); if (Number.isNaN(n)) throw new PyRunError('int() に できない もじだよ'); return n; },
    float: (a) => { const n = Number(a[0]); if (Number.isNaN(n)) throw new PyRunError('float() に できないよ'); return n; },
    abs: (a) => Math.abs(a[0]),
    sum: (a) => a[0].reduce((s, x) => s + x, 0),
    min: (a) => (a.length === 1 && Array.isArray(a[0])) ? Math.min(...a[0]) : Math.min(...a),
    max: (a) => (a.length === 1 && Array.isArray(a[0])) ? Math.max(...a[0]) : Math.max(...a),
    bool: (a) => truthy(a[0]),
  };

  function truthy(v) {
    if (v === null || v === false) return false;
    if (v === true) return true;
    if (typeof v === 'number') return v !== 0;
    if (typeof v === 'string' || Array.isArray(v)) return v.length > 0;
    return true;
  }

  function lookup(scope, name, line) {
    if (name in scope) return scope[name];
    if (name in globals) return globals[name];
    if (name in BUILTINS) return { __builtin: name };
    throw new PyRunError(`「${name}」が みつからないよ（へんすう？）`, line);
  }

  function evalExpr(node, scope) {
    switch (node.type) {
      case 'num': case 'str': return node.v;
      case 'const': return node.v;
      case 'name': return lookup(scope, node.v);
      case 'list': return node.items.map((it) => evalExpr(it, scope));
      case 'unary': { const v = evalExpr(node.e, scope); return node.op === '-' ? -v : +v; }
      case 'not': return !truthy(evalExpr(node.e, scope));
      case 'bool': {
        const l = evalExpr(node.l, scope);
        if (node.op === 'and') return truthy(l) ? evalExpr(node.r, scope) : l;
        return truthy(l) ? l : evalExpr(node.r, scope);
      }
      case 'cmp': {
        const l = evalExpr(node.l, scope), r = evalExpr(node.r, scope);
        switch (node.op) {
          case '==': return eqv(l, r); case '!=': return !eqv(l, r);
          case '<': return l < r; case '<=': return l <= r; case '>': return l > r; case '>=': return l >= r;
        }
        return false;
      }
      case 'bin': return binop(node.op, evalExpr(node.l, scope), evalExpr(node.r, scope));
      case 'index': {
        const obj = evalExpr(node.obj, scope); let i = evalExpr(node.idx, scope);
        if (!Array.isArray(obj) && typeof obj !== 'string') throw new PyRunError('[] で とりだせない ものだよ');
        if (i < 0) i += obj.length;
        if (i < 0 || i >= obj.length) throw new PyRunError('リスト/もじれつの そとを さしているよ（index）');
        return obj[i];
      }
      case 'attr': return { __method: node.name, __self: evalExpr(node.obj, scope) };
      case 'call': return doCall(node, scope);
      default: throw new PyRunError('しきを けいさんできないよ');
    }
  }

  function doCall(node, scope) {
    const args = node.args.map((a) => evalExpr(a, scope));
    const fn = node.fn;
    // メソッド呼び出し
    if (fn.type === 'attr') {
      const self = evalExpr(fn.obj, scope);
      return callMethod(self, fn.name, args, fn.obj, scope);
    }
    const f = evalExpr(fn, scope);
    if (f && f.__builtin) return BUILTINS[f.__builtin](args);
    if (f && f.__func) return callUser(f, args);
    throw new PyRunError('よべない ものを よぼうとしたよ');
  }

  function callMethod(self, name, args, objNode, scope) {
    if (Array.isArray(self)) {
      if (name === 'append') { self.push(args[0]); return null; }
      if (name === 'pop') { if (!self.length) throw new PyRunError('からの リストから pop できないよ'); return self.pop(); }
    }
    if (typeof self === 'string') {
      if (name === 'upper') return self.toUpperCase();
      if (name === 'lower') return self.toLowerCase();
    }
    throw new PyRunError(`「.${name}()」は つかえないよ`);
  }

  function callUser(f, args) {
    if (args.length !== f.params.length) throw new PyRunError(`「${f.name}」の ひきすうの かずが ちがうよ`);
    const local = Object.create(null);
    f.params.forEach((p, i) => { local[p] = args[i]; });
    try { execBlock(f.body, local); }
    catch (e) { if (e instanceof ReturnSignal) return e.value; throw e; }
    return null;
  }

  function assign(target, value, scope) {
    if (target.type === 'name') { scope[target.v] = value; return; }
    if (target.type === 'index') {
      const obj = evalExpr(target.obj, scope); let i = evalExpr(target.idx, scope);
      if (!Array.isArray(obj)) throw new PyRunError('この ものには [] で だいにゅう できないよ');
      if (i < 0) i += obj.length;
      if (i < 0 || i >= obj.length) throw new PyRunError('リストの そとに だいにゅう しているよ');
      obj[i] = value; return;
    }
    throw new PyRunError('ここには だいにゅう できないよ');
  }

  function execBlock(stmts, scope) {
    for (const s of stmts) execStmt(s, scope);
  }

  function execStmt(s, scope) {
    tick();
    switch (s.type) {
      case 'pass': return;
      case 'expr': evalExpr(s.expr, scope); return;
      case 'assign': assign(s.target, evalExpr(s.value, scope), scope); return;
      case 'if':
        if (truthy(evalExpr(s.cond, scope))) execBlock(s.body, scope);
        else execBlock(s.orelse, scope);
        return;
      case 'while': {
        while (truthy(evalExpr(s.cond, scope))) { tick(); execBlock(s.body, scope); }
        return;
      }
      case 'for': {
        const it = evalExpr(s.iter, scope);
        if (!Array.isArray(it) && typeof it !== 'string') throw new PyRunError('for で まわせない ものだよ');
        for (const v of it) { tick(); scope[s.varName] = v; execBlock(s.body, scope); }
        return;
      }
      case 'def': globals[s.name] = { __func: true, name: s.name, params: s.params, body: s.body }; return;
      case 'return': throw new ReturnSignal(s.expr ? evalExpr(s.expr, scope) : null);
    }
  }

  function eqv(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => eqv(x, b[i]));
    return a === b;
  }
  function binop(op, l, r) {
    switch (op) {
      case '+':
        if (Array.isArray(l) && Array.isArray(r)) return l.concat(r);
        if (typeof l === 'string' || typeof r === 'string') {
          if (typeof l !== 'string' || typeof r !== 'string') throw new PyRunError('もじれつと すうじは + で つなげないよ（str() を つかってね）');
          return l + r;
        }
        return l + r;
      case '-': return l - r;
      case '*':
        if (typeof l === 'string' && typeof r === 'number') return l.repeat(Math.max(0, r));
        return l * r;
      case '/': if (r === 0) throw new PyRunError('0で わっては だめだよ'); return l / r;
      case '//': if (r === 0) throw new PyRunError('0で わっては だめだよ'); return Math.floor(l / r);
      case '%': if (r === 0) throw new PyRunError('0で わっては だめだよ'); return ((l % r) + r) % r;
      case '**': return Math.pow(l, r);
    }
    throw new PyRunError('けいさんできない えんざんだよ');
  }

  try {
    execBlock(ast, globals);
  } catch (e) {
    if (e instanceof ReturnSignal) { /* トップレベルreturnは無視 */ }
    else return { output: output.join('\n'), lines: output.slice(), vars: publicVars(globals), error: fmtErr(e) };
  }
  return { output: output.join('\n'), lines: output.slice(), vars: publicVars(globals), error: null };
}

function publicVars(globals) {
  const o = {};
  for (const k in globals) { const v = globals[k]; if (!(v && (v.__func || v.__builtin))) o[k] = v; }
  return o;
}

function fmtErr(e) {
  if (e instanceof PyRunError) return e.line ? `${e.line}行め: ${e.message}` : e.message;
  return 'コードで エラーが おきたよ';
}

export { MAX_STEPS };
