// pyrun.test.js — 計算/出力パズル用 Python サブセット・インタプリタのテスト
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runPython } from '../js/lang/pyRun.js';

const out = (src) => { const r = runPython(src); assert.equal(r.error, null, `error: ${r.error}`); return r.output; };
const errOf = (src) => runPython(src).error;

test('変数と四則演算', () => {
  assert.equal(out('print(1 + 2)'), '3');
  assert.equal(out('x = 5\ny = x * 2\nprint(y)'), '10');
  assert.equal(out('print(7 // 2)'), '3');
  assert.equal(out('print(7 % 3)'), '1');
  assert.equal(out('print(2 ** 3)'), '8');
  assert.equal(out('print(10 / 4)'), '2.5');
  assert.equal(out('print(-3 + 5)'), '2');
});

test('print の 複数引数', () => {
  assert.equal(out('print(1, 2, 3)'), '1 2 3');
  assert.equal(out('print("a", "b")'), 'a b');
});

test('for と range で合計', () => {
  assert.equal(out('s = 0\nfor i in range(1, 6):\n    s = s + i\nprint(s)'), '15');
  assert.equal(out('for i in range(3):\n    print(i)'), '0\n1\n2');
});

test('while ループ', () => {
  assert.equal(out('n = 3\nwhile n > 0:\n    print(n)\n    n = n - 1'), '3\n2\n1');
});

test('if / elif / else', () => {
  const prog = 'x = 5\nif x > 10:\n    print("big")\nelif x > 3:\n    print("mid")\nelse:\n    print("small")';
  assert.equal(out(prog), 'mid');
  assert.equal(out(prog.replace('x = 5', 'x = 1')), 'small');
  assert.equal(out(prog.replace('x = 5', 'x = 20')), 'big');
});

test('リスト（append/index/len/連結/負index）', () => {
  assert.equal(out('a = [1, 2, 3]\na.append(4)\nprint(len(a))'), '4');
  assert.equal(out('a = [10, 20, 30]\nprint(a[0])\nprint(a[-1])'), '10\n30');
  assert.equal(out('a = [1, 2]\nb = [3]\nprint(a + b)'), '[1, 2, 3]');
  assert.equal(out('total = 0\nfor x in [10, 20, 30]:\n    total = total + x\nprint(total)'), '60');
});

test('文字列（連結/長さ/upper/str）', () => {
  assert.equal(out('name = "abc"\nprint(name + "!")'), 'abc!');
  assert.equal(out('print(len("hello"))'), '5');
  assert.equal(out('print("abc".upper())'), 'ABC');
  assert.equal(out('print("wa: " + str(3 + 4))'), 'wa: 7');
});

test('def と return', () => {
  assert.equal(out('def add(a, b):\n    return a + b\nprint(add(2, 3))'), '5');
  const fact = 'def fact(n):\n    r = 1\n    for i in range(1, n + 1):\n        r = r * i\n    return r\nprint(fact(5))';
  assert.equal(out(fact), '120');
});

test('比較・論理', () => {
  assert.equal(out('print(2 > 1 and 3 > 5)'), 'False');
  assert.equal(out('print(2 > 1 or 3 > 5)'), 'True');
  assert.equal(out('print(not False)'), 'True');
  assert.equal(out('print(3 == 3)'), 'True');
  assert.equal(out('print([1, 2] == [1, 2])'), 'True');
});

test('組み込み関数 sum/min/max/abs', () => {
  assert.equal(out('print(sum([1, 2, 3, 4]))'), '10');
  assert.equal(out('print(max([3, 1, 2]))'), '3');
  assert.equal(out('print(min(5, 2))'), '2');
  assert.equal(out('print(abs(-7))'), '7');
});

test('エラー: 未定義の変数', () => {
  assert.ok(errOf('print(y)').includes('みつからない'));
});
test('エラー: 0わり', () => {
  assert.ok(errOf('print(1 // 0)').includes('0で'));
});
test('エラー: コロン忘れ', () => {
  assert.ok(errOf('for i in range(3)\n    print(i)').includes(':'));
});
test('エラー: 最初の行がインデント', () => {
  assert.ok(errOf('    print(1)'));
});
test('エラー: 無限ループは止まる', () => {
  assert.ok(errOf('while True:\n    x = 1').includes('うごきすぎ'));
});
test('エラー: 文字列と数の + ', () => {
  assert.ok(errOf('print("a" + 1)').includes('str()'));
});

test('コメントと空行は無視', () => {
  assert.equal(out('# メモ\n\nx = 10  \nprint(x)'), '10');
});
