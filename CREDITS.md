# CREDITS.md — 利用OSS・ライセンス表記

本プロジェクトが利用する（または利用予定の）OSS を記載する。
形式: 名称 / リポジトリURL / ライセンス / 利用箇所。

## 現在コードに取り込んでいる外部OSS
- （なし）— プロトタイプ（M0〜M4）はブロックUI・実行エンジン・音・グラフィックを
  すべて自作している。効果音は Web Audio API によるプログラム生成、グラフィックは
  Canvas/SVG/CSS による自作で、外部アセットの流用は一切ない。

## フェーズ2以降で導入予定（導入時に本ファイルへ表記を確定する）
| 名称 | リポジトリ | ライセンス | 予定利用箇所 |
|---|---|---|---|
| Blockly | https://github.com/google/blockly | Apache-2.0 | Stage 2 のブロック→Python（自作変換で不足する場合の代替） |
| CodeMirror 6 | https://github.com/codemirror/dev | MIT | Stage 3/4 のPythonテキスト編集 |
| Pyodide | https://github.com/pyodide/pyodide | MPL-2.0 | Stage 4 の本物Python実行（第一候補） |
| Skulpt | https://github.com/skulpt/skulpt | MIT | Stage 4 の軽量Python実行（Pyodideの代替候補） |

> 導入時の対応:
> - Apache-2.0 / MIT: 著作権表示・ライセンス全文を本リポジトリに同梱し、本ファイルに明記する。
> - MPL-2.0（Pyodide）: 改変せず同梱する限りファイル単位コピーレフトはJS本体へ伝播しない。
>   配布ファイルにライセンスを添付する。

## 設計のみ参考にしたプロジェクト（コード・アセットの流用なし）
Hedy（段階カリキュラム）/ Reeborg's World（マス目Python・課題のデータ化）/
Blockly Games（難易度カーブ）/ CodeCombat（報酬・演出設計）/ Scratch（子ども向けUI）。
これらはコピーレフト・サーバ前提・非OSSアセット等の理由でコードは取り込まず、
公開情報からの設計思想の参照にとどめている。詳細は `docs/research.md`。
