// パイプライン動作確認用のスモークテスト。
// 実際のエンジンのテストは M3 以降で test/ 配下に追加していく。
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('smoke: テストランナーが動作する', () => {
  assert.equal(1 + 1, 2);
});
