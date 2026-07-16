// furigana.test.js — ふりがな付与の検証
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { furigana } from '../js/ui/furigana.js';

test('単字の漢字に ruby', () => {
  assert.equal(furigana('右にすすむ'), '<ruby>右<rt>みぎ</rt></ruby>にすすむ');
  assert.equal(furigana('上に'), '<ruby>上<rt>うえ</rt></ruby>に');
});

test('文脈例外: 上って = のぼって', () => {
  assert.equal(furigana('上っていこう'), '<ruby>上<rt>のぼ</rt></ruby>っていこう');
});

test('送りがなは残す', () => {
  assert.equal(furigana('大きい'), '<ruby>大<rt>おお</rt></ruby>きい');
  assert.equal(furigana('答えを'), '<ruby>答<rt>こた</rt></ruby>えを');
});

test('複数字の語は1つの ruby', () => {
  assert.equal(furigana('文字列'), '<ruby>文字列<rt>もじれつ</rt></ruby>');
  assert.equal(furigana('段階1'), '<ruby>段階<rt>だんかい</rt></ruby>1');
});

test('漢字が無ければそのまま', () => {
  assert.equal(furigana('まえに すすむ'), 'まえに すすむ');
  assert.equal(furigana('for i in range(6):'), 'for i in range(6):');
});

test('HTML特殊文字はエスケープ', () => {
  assert.equal(furigana('a < b & c'), 'a &lt; b &amp; c');
});
