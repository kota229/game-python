// furigana.js — kid向けテキストの漢字に ruby（ふりがな）を付ける。
// 自前の小さな辞書で「漢字の連続」を読みに変換する。コードや記号はそのまま。
// 入力はプロジェクト内の固定テキスト（信頼できる）なので innerHTML で描画する前提。

// 漢字ラン（連続）→ 読み。複数字の語を優先（longest-match）。
const DICT = {
  段階: 'だんかい', 条件: 'じょうけん', 文字列: 'もじれつ', 関数: 'かんすう',
  四則: 'しそく', 演算: 'えんざん', 実行: 'じっこう', 命令: 'めいれい',
  変数: 'へんすう', 合計: 'ごうけい', 平均: 'へいきん',
  // 単字
  右: 'みぎ', 左: 'ひだり', 上: 'うえ', 中: 'なか', 大: 'おお', 小: 'ちい',
  数: 'かず', 旗: 'はた', 答: 'こた', 変: 'か', 向: 'む', 使: 'つか',
  書: 'か', 動: 'うご', 行: 'い', 来: 'き', 入: 'い', 回: 'かい', 何: 'なん',
  正: 'せい', 解: 'かい', 大人: 'おとな',
};

function isKanji(c) {
  const code = c.codePointAt(0);
  return (code >= 0x4e00 && code <= 0x9fff) || c === '々';
}

function escapeHtml(s) {
  return s.replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function ruby(run, reading) {
  return `<ruby>${escapeHtml(run)}<rt>${reading}</rt></ruby>`;
}

// 漢字ランを辞書で分割して ruby 化。next は直後の文字（文脈用）。
function rubyForRun(run, next) {
  // 文脈例外: 「上って」= のぼって
  if (run === '上' && next === 'っ') return ruby('上', 'のぼ');
  let out = '', i = 0;
  while (i < run.length) {
    let matched = false;
    for (let len = Math.min(3, run.length - i); len >= 1; len--) {
      const seg = run.slice(i, i + len);
      if (DICT[seg]) { out += ruby(seg, DICT[seg]); i += len; matched = true; break; }
    }
    if (!matched) { out += escapeHtml(run[i]); i++; } // 辞書に無い漢字はそのまま
  }
  return out;
}

/** テキストの漢字に ruby を付けた HTML 文字列を返す。 */
export function furigana(text) {
  if (text == null) return '';
  const s = String(text);
  let out = '', i = 0;
  while (i < s.length) {
    if (isKanji(s[i])) {
      let j = i;
      while (j < s.length && isKanji(s[j])) j++;
      out += rubyForRun(s.slice(i, j), s[j]);
      i = j;
    } else {
      out += escapeHtml(s[i]);
      i++;
    }
  }
  return out;
}
