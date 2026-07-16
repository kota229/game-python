# CREDITS.md — 利用OSS・ライセンス表記

形式: 名称 / リポジトリURL / ライセンス / 利用箇所。

## 公開される Web アプリ本体に含まれる第三者コード
**なし（ゼロ）。** CodeQuest の実行時コードはすべて自作です。
- ブロックUI・ドラッグ&ドロップ、グリッド世界の描画（Canvas）: 自作
- 実行エンジン（ロボット制御のトレース実行 / クリア判定）: 自作（`js/engine/`）
- ブロック⇔Python 変換、Python サブセット実行系（計算・出力パズル）: 自作（`js/lang/`）
- ふりがな付与、効果音・BGM（Web Audio API によるプログラム生成）: 自作
- 画像・音・キャラクターなどのアセット流用は一切なし（SVG/Canvas/CSS で自作、音は合成）

> M1 の調査（`docs/research.md`）では Blockly(Apache-2.0) / CodeMirror(MIT) /
> Pyodide(MPL-2.0) / Skulpt(MIT) の採用を検討したが、オフライン完結・GitHub Pages・
> ビルド不要・軽量・**Node での自動テスト（CI 安全網）維持**の観点から、いずれも取り込まず
> 自作で実装した（判断理由は `DECISIONS.md` の M5 / M6.5）。これらOSSの設計は参考にしたが、
> コード・アセットの流用はしていないため、本アプリに帰属表示義務のある第三者コードはない。

## 開発・配布のためのツール（Web アプリ本体には同梱されない）
| 名称 | リポジトリ | ライセンス | 用途 |
|---|---|---|---|
| GitHub Actions（公式アクション） | https://github.com/actions | MIT | CI（テスト）/ Pages デプロイ |
| Capacitor | https://github.com/ionic-team/capacitor | MIT | （任意）APK 化。導入する場合の設定は `capacitor.config.json`／README 参照 |
| puppeteer-core | https://github.com/puppeteer/puppeteer | Apache-2.0 | 開発時のブラウザ自動E2E検証のみ（`--no-save` でローカル使用。リポジトリには非同梱） |

> Capacitor を実際に APK 化で導入する場合は `npm i -D @capacitor/core @capacitor/cli @capacitor/android`
> を行い、その時点で `node_modules` に MIT ライセンスの全文が含まれる。配布APKに同梱される
> Capacitor ランタイム（MIT）の表記が必要な場合は本ファイルに追記すること。
