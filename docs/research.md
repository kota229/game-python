# docs/research.md — 類似OSS徹底調査（M1）

作成日: 2026-07-16 / 調査対象: 14プロジェクト（GitHub上のライセンス表示・LICENSEファイルを実際に確認）

本プロジェクト「CodeQuest」は **オフライン完結 / GitHub Pages 公開 / ビルド不要のプレーンJS /
子ども向けPython学習（ブロック→Python 4段階）** を制約とする。各OSSはこの制約に照らして
「ライブラリとして利用可 / 設計参考のみ / コード一部流用候補」を判定した。

> ライセンス方針（CLAUDE.md）: MIT / Apache-2.0 / BSD / MPL-2.0 は利用可。GPL / AGPL / EUPL 系の
> コード取り込みは回避し、設計思想の参考にとどめる。アセット（画像・音・レベル）の流用は一切禁止。

---

## 1. Blockly
- URL: https://github.com/google/blockly （約13,500★）
- **ライセンス: Apache-2.0**（寛容・利用可）
- **技術構成**: 純クライアントサイドJSライブラリ。ブロック定義はJSON/JS、コードジェネレータで
  JavaScript / **Python** / Lua / Dart 等へ変換。ワークスペース状態は XML/JSON でシリアライズ。
  `blockly.min.js` を script 読み込みするだけで動き、**ビルド不要のプレーンJSで利用可能**。
- **学べる設計**: ブロック形状（凹凸コネクタ）による構文の型安全、影ブロック、ツールボックスの
  カテゴリ設計、ブロック↔生成コードのリアルタイム対応。
- **活用方針**: **ライブラリ利用可（Stage 2 の本命候補）**。ブロック→Python 変換ジェネレータが
  標準搭載で、「ブロック＋Python併記」段の中核に最適。

## 2. Blockly Games
- URL: https://github.com/google/blockly-games （約1,370★）
- **ライセンス: Apache-2.0**（寛容・利用可）
- **技術構成**: Blockly上に構築。Closure Library/Compiler でのビルド前提。
  Puzzle→Maze→Bird→Turtle→Movie→Music→Pond の段階的ゲーム群。
- **学べる設計**: **レベル設計・カリキュラム構成の教科書**。レベルが進むごとに使えるブロックを解放、
  難易度の逓増、ブロック数制限で「最適解」を誘導、最後にブロック→テキストコードを見せる演出。
- **活用方針**: **設計参考（＋一部流用候補）**。Closureビルド前提のため丸ごと流用は不向きだが、
  Maze のレベル進行・ゴール判定の考え方は本プロジェクトの難易度カーブに直接活かす。

## 3. scratch-gui
- URL: https://github.com/scratchfoundation/scratch-gui （約4,800★）
- **ライセンス: AGPL-3.0**（強コピーレフト → コード流用回避、設計参考のみ）
- **技術構成**: React + Redux。Scratch 3.0 エディタUI。
- **学べる設計**: ステージ/スプライト/ブロックパレットの三分割UI、子ども向けD&DのUX。
- **活用方針**: **設計参考のみ**（AGPLのため流用不可）。

## 4. scratch-vm
- URL: https://github.com/scratchfoundation/scratch-vm （約1,300★）
- **ライセンス: AGPL-3.0**（設計参考のみ）
- **技術構成**: Scratch実行エンジン。スレッド/シーケンサによる並行ブロック実行。
- **学べる設計**: イベント駆動・ステップ実行モデル。→ 本プロジェクトの「トレースを1ステップずつ
  再生してアニメーションする」実行モデルの参考にした（コードは流用せず設計のみ）。
- **活用方針**: **設計参考のみ**（AGPL）。

## 5. scratch-blocks
- URL: https://github.com/scratchfoundation/scratch-blocks （約2,760★）
- **ライセンス: Apache-2.0**（Blockly派生。gui/vm の AGPL とは別ライセンスな点に注意）
- **技術構成**: Blockly のフォーク。丸みのある子ども向けブロック形状、色分けカテゴリ。
- **活用方針**: **設計参考／利用可**。ブロックの見た目（丸み・色分け・大きめ）を自作ブロックUIの
  デザイン指針として参照。

## 6. CodeCombat
- URL: https://github.com/codecombat/codecombat （約8,500★）
- **ライセンス: コードとコンテンツで分離**
  - コード: **MIT** / アート・音楽: **CC-BY** / ゲームレベル: **非OSS（権利留保）**
- **技術構成**: フルスタック（Node.js、Backbone）、コード実行は Aether サンドボックス。**サーバ必須**の重量級。
- **学べる設計**: **報酬設計・カリキュラムの好例**。RPG的キャンペーン、経験値/ジェム、キャラ育成、
  実際のコードタイピングで攻略させる動機付け。
- **活用方針**: **設計参考のみ**（サーバ前提でオフライン不適。アートCC-BYも本プロジェクトは自作方針で流用しない）。

## 7. Hedy 【段階カリキュラムの最重要参考】
- URL: https://github.com/hedyorg/hedy （約1,640★）
- **ライセンス: EUPL-1.2**（コピーレフト → コード流用回避、設計参考のみ）
- **技術構成**: Flask バックエンド。**段階的言語**で約18レベル、各レベルで構文を追加。Larkパーサで
  Hedy コード→Python へトランスパイル。最終的に有効なPythonのサブセットを習得。
- **学べる設計**: **本プロジェクトの「ブロック→Python 4段階」の直接の思想的モデル**。構文を一気に
  見せず、レベルごとに引用符・インデント・変数を段階導入。エラーメッセージの子ども向け言い換え。
- **活用方針**: **設計参考のみ**（EUPL＋サーバ前提）。段階導入の粒度を design.md の難易度カーブに反映する。

## 8. Reeborg's World 【形態が最も近い】
- URL: https://github.com/aroberge/reeborg （約48★）
- **ライセンス: CC-BY-SA-4.0**（ShareAlike継承条項 → コード流用回避、設計参考のみ）
- **技術構成**: クライアントサイドJS。ブラウザ内Python実行に Brython/Skulpt 系。マス目ロボット課題、
  Python/JavaScript/Blockly の3インターフェース。**オフライン版あり**。
- **学べる設計**: **本プロジェクトと最も近い形態**（マス目ロボット＋Python＋Blockly＋オフライン）。
  ワールド（課題）エディタ、ゴール条件の宣言的定義、同一課題を複数言語で解ける設計。
- **活用方針**: **設計参考のみ**。課題（ステージ）をデータで宣言的に定義する設計を参考にした
  （本プロジェクトの `data/stages.js` スキーマに反映）。

## 9. MakeCode / pxt
- URL: https://github.com/microsoft/pxt （約2,290★）
- **ライセンス: MIT**（寛容・利用可）
- **技術構成**: TypeScript。Blocklyブロック＋Monacoテキストを統合し、**ブロック↔テキスト双方向変換**。
  ビルド前提の大規模フレームワーク。
- **学べる設計**: **ブロック⇔テキスト双方向同期のUX** が「ブロック→Python」段階移行の直接の参考。
- **活用方針**: **設計参考（＋部品流用候補）**。MITだが重量級・ビルド前提でプレーンJS方針と相性が悪い。
  双方向変換の設計を参考にする。

## 10. Pyodide
- URL: https://github.com/pyodide/pyodide （約14,700★）
- **ライセンス: MPL-2.0**（ファイル単位コピーレフト。未改変利用ならJSアプリ本体へ伝播せず → 組込可）
- **技術構成**: CPython を WebAssembly 化した**本物のPython**。NumPy等も動作。初回DLが数MB〜十数MBと重い。
  完全クライアントサイドで**オフライン動作可**。
- **活用方針**: **ライブラリ利用可**。「本物のPythonを動かす最終段階（Stage 4）」用の有力候補。
  ただし容量が大きいので軽量な Skulpt と比較検討（下記 DECISIONS）。

## 11. CodeMirror 6
- URL: https://github.com/codemirror/dev （約7,800★）
- **ライセンス: MIT**（各 @codemirror/* パッケージがMIT）
- **技術構成**: モジュール式のブラウザ内コードエディタ。ESM構成（プリビルド配布も利用可）。軽量・モバイル対応。
- **活用方針**: **ライブラリ利用可**。Stage 3/4 のPythonテキスト編集に最適（Monacoより軽量）。

## 12. Monaco Editor
- URL: https://github.com/microsoft/monaco-editor （約46,400★）
- **ライセンス: MIT**（利用可だが過剰）
- **技術構成**: VS Code由来のフル機能エディタ。数MB規模で重い。
- **活用方針**: 子ども向け・軽量方針には過剰。**CodeMirror を優先**。

## 13. Skulpt 【軽量Python実行の本命候補】
- URL: https://github.com/skulpt/skulpt （約3,400★）
- **ライセンス: MIT**（LICENSE本文で確認。GitHubのSPDX自動判定は追加帰属文のため NOASSERTION だが実体はMIT）
- **技術構成**: **PythonをJavaScriptで実装**（Python 2/3サブセット）。単一JS読み込みで動作、
  **ビルド不要・軽量（約1MB規模、Pyodideより大幅に軽い）**。完全クライアントサイド。
- **活用方針**: **ライブラリ利用可**。MIT・単一JS・オフライン・軽量で本プロジェクトの制約に最も適合。
  実Pythonの厳密さが要る場合のみ Pyodide へ切替。

## 14. Karel（fredoverflow/karel）
- URL: https://github.com/fredoverflow/karel （約605★）
- **ライセンス: なし（LICENSE不在 → 全権利留保。法的に再利用不可）**
- **技術構成**: Kotlin（JVMデスクトップ）。マス目ロボットで命令型基礎を教える。Webではない。
- **活用方針**: **設計参考のみ**（流用不可）。マス目ロボット＋前進/回転/条件/繰返しという最小教材の
  題材設計は、本プロジェクトのプロトタイプ（p1〜p5）の課題設計に通じる。
  ※Web＋Python＋マス目を求めるなら Reeborg's World の方が近い。

---

## ライセンス分類まとめ

| 分類 | プロジェクト | SPDX | 位置づけ |
|---|---|---|---|
| 寛容（ライブラリ利用可） | Blockly | Apache-2.0 | Stage 2 ブロック→Python 本命 |
| | Blockly Games | Apache-2.0 | レベル設計参考＋部分流用可 |
| | scratch-blocks | Apache-2.0 | ブロック見た目の参考 |
| | MakeCode/pxt | MIT | 双方向変換UX参考 |
| | Pyodide | MPL-2.0※ | 本物Python（重）／組込可 |
| | CodeMirror 6 | MIT | Pythonテキスト編集（推奨） |
| | Monaco | MIT | 高機能だが過剰 |
| | Skulpt | MIT | 軽量Python実行の本命 |
| | CodeCombat（コード） | MIT | サーバ前提で実質は設計参考 |
| コピーレフト（設計参考のみ） | scratch-gui / scratch-vm | AGPL-3.0 | UI・実行モデル参考 |
| | Hedy | EUPL-1.2 | 段階カリキュラムの最重要参考 |
| | Reeborg's World | CC-BY-SA-4.0 | 形態が最も近い／課題設計参考 |
| アセット別ライセンス（注意） | CodeCombat（アート/音楽） | CC-BY | 本プロジェクトは自作方針で流用しない |
| | CodeCombat（レベル） | 非OSS | 流用不可 |
| ライセンス不在（再利用不可） | Karel(fredoverflow) | なし | 設計参考のみ |

※MPL-2.0 はファイル単位コピーレフト。未改変利用なら JS アプリ本体へライセンス伝播せず、GitHub Pages 配布可。

---

## 採用する部品リスト（結論）

調査を踏まえた採用方針。詳細な判断理由は `DECISIONS.md`、ライセンス表記は `CREDITS.md` に記載。

| 層 | 採用 | ライセンス | 理由 |
|---|---|---|---|
| **ブロックUI（Stage 1・プロトタイプ）** | **自作の軽量ブロックビルダー** | 自作 | 命令セットが小さく（前進/回転/拾う/くりかえし）、オフライン・ビルド不要・子ども向けUXを完全制御できる。外部依存ゼロで軽い |
| **ブロック→Python（Stage 2）** | 自作の block→Python 変換を第一候補、**Blockly** を代替候補 | 自作 / Apache-2.0 | 小さい固定ブロック集合なら手書き変換で十分軽量。複雑化したら Blockly（Python生成標準搭載）へ移行 |
| **Pythonテキスト編集（Stage 3/4）** | **CodeMirror 6** | MIT | 軽量・モバイル対応・オフライン |
| **Python実行（Stage 4）** | **Pyodide**（CLAUDE.md方針）を第一候補、**Skulpt** を軽量代替として M5 で比較検証 | MPL-2.0 / MIT | 本物のPythonか、軽さ優先か。実機タブレットでの初回ロード重量を M5 のスパイクで測って確定 |
| **参考（コード流用せず設計のみ）** | Hedy（段階導入）/ Reeborg（マス目Python・課題データ化）/ Blockly Games（難易度カーブ）/ CodeCombat（報酬演出） | — | いずれもコピーレフト or サーバ前提 or 非OSSアセットのため設計参照にとどめる |

**プロトタイプ（M3/M4）時点で実際に取り込んだ外部OSSコードはゼロ**（すべて自作）。
Blockly / CodeMirror / Pyodide / Skulpt はフェーズ2（M5）で導入判断・組込予定であり、
導入時に `CREDITS.md` へライセンス表記を追加する。
