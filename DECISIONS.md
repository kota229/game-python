# DECISIONS.md — 設計判断の記録

Claude Code が自走中に行った判断をここに追記する。
形式: 日付 / 判断内容 / 理由 / 代替案

（例）
- 2026-07-16 / Python実行にPyodideを採用 / オフラインで本物のPythonが動き、
  Stage 4の自由記述に対応できるため / 代替案: 自作簡易インタプリタ（Pyodide導入失敗時）

---

## 2026-07-16 M0（リポジトリ整備）

- 2026-07-16 / **ビルド不要のプレーンJS（ESモジュール）静的構成を採用** /
  GitHub Pages にそのまま公開でき、オフライン完結・起動が速い。バンドラや
  トランスパイルの複雑さを避け、子ども向けアプリの軽量要件に合う /
  代替案: TypeScript + Vite（型安全だがビルド工程とツールチェーン依存が増える）
- 2026-07-16 / **テストは Node 標準の `node --test` を採用** / 追加依存ゼロで
  CI が単純になる。エンジン部（インタプリタ・クリア判定）は DOM 非依存の
  純粋モジュールとして書き、Node で直接テストする / 代替案: Jest / Vitest
- 2026-07-16 / **CI/Pages を GitHub Actions で構成**（test.yml / pages.yml）/
  push・PR ごとにテスト、main への push で Pages に自動デプロイ /
  ※Pages のソースはリポジトリ設定で「GitHub Actions」を選ぶ必要がある（下記）

### ⚠️ 未完了・ユーザー対応が必要な項目（M0 の GitHub リモート連携）
この環境には **GitHub CLI（`gh`）が未インストール**で、GitHub 認証は
ブラウザ経由の対話ログインが必要なため、以下は自走では完了できませんでした。
ローカル側（git init、.gitignore、CI/Pages workflow、コミット）は完了済みです。

### ✅ 公開URL（2026-07-16 GitHub連携セットアップ完了）
ユーザーが gh 認証・リポジトリ作成・push を実施し、Pages（Source=GitHub Actions）も有効化済み。
**公開URL: https://kota229.github.io/game-python/** （main への push で自動デプロイ・動作確認済み）。
以降は Claude 側で push→PR→CI確認→マージまで自動化（gh はフルパス `C:\Program Files\GitHub CLI\gh.exe`）。

（以下は当時の手順メモ。対応済み）
ユーザーに実施いただく手順:
1. GitHub CLI をインストール（https://cli.github.com/）
2. `gh auth login` でブラウザ認証（GitHub.com → HTTPS → ブラウザ）
3. リポジトリ作成と push:
   ```
   cd C:\Users\kota2\Dropbox\Projects\game-python
   gh repo create game-python --private --source=. --remote=origin --push
   ```
4. GitHub の Settings → Pages で **Source を「GitHub Actions」** に設定
5. push 後、Actions の deploy-pages が完了すると公開URL
   （`https://<ユーザー名>.github.io/game-python/`）でアクセス可能になる。
   URL が確定したらこの DECISIONS.md に追記する。

（`gh` が使えるようになれば、以降のマイルストーンでの push / PR 作成は
Claude Code 側で自動化できる。）

---

## 2026-07-16 M1（類似OSS調査）— 採用部品の判断

14件のOSSを調査（`docs/research.md`）。GitHub上のライセンスを実際に確認して採用可否を決定した。

- 2026-07-16 / **プロトタイプ（Stage 1）のブロックUIは自作の軽量ビルダーを採用** /
  命令セットが小さく（前進・回転・拾う・くりかえし）、オフライン・ビルド不要・子ども向けの
  タッチUX（大きなブロック、タップ追加、ドラッグ並べ替え）を完全に制御でき、外部依存ゼロで軽い /
  代替案: Blockly（Apache-2.0）。高機能だが今のプロトタイプには過剰でロードも重い。
  Stage 2 でブロック→Python が複雑化した場合の移行先として保持
- 2026-07-16 / **ブロック→Python変換（Stage 2）は自作の手書き変換を第一候補、Blockly を代替** /
  固定の小さいブロック集合なら手書き変換で十分軽量に実現できる。複雑化時に Blockly（Python
  ジェネレータ標準搭載）へ移行 / 代替案: 最初から Blockly 採用
- 2026-07-16 / **Pythonテキスト編集（Stage 3/4）は CodeMirror 6（MIT）を採用予定** /
  軽量・モバイル対応・オフライン。Monaco（MIT）は高機能だが重く子ども向けに過剰 /
- 2026-07-16 / **Python実行（Stage 4）は Pyodide（MPL-2.0, CLAUDE.md方針）を第一候補とし、
  Skulpt（MIT, 軽量）を代替として M5 のスパイクで実機ロード重量を比較して確定** /
  Pyodide は本物のCPythonだが初回DLが重い。Skulpt は約1MBで軽く単一JS・オフライン適合。
  子ども向けタブレットの初回ロード体感を実測してから最終決定する（現時点は未確定）/
  代替案: 自作簡易Pythonインタプリタ（両者とも導入困難な場合）
- 2026-07-16 / **設計参考にとどめる（コード流用しない）**: Hedy（EUPL, 段階カリキュラム）,
  Reeborg's World（CC-BY-SA, マス目Python・課題のデータ化）, Blockly Games（難易度カーブ）,
  Scratch gui/vm（AGPL, UI・実行モデル）, CodeCombat（報酬演出）/ いずれもコピーレフト・
  サーバ前提・非OSSアセットのため、公開情報からの設計参照にとどめる（CLAUDE.mdのライセンス方針に従う）

**プロトタイプ時点で取り込んだ外部OSSコードはゼロ（すべて自作）。** 効果音は Web Audio 生成、
グラフィックは Canvas/CSS 自作でアセット流用なし。

---

## 2026-07-16 M5（カリキュラム全段階のエンジン拡張）— Python層の方式

- 2026-07-16 / **ブロック→Python変換は自作ジェネレータ（js/lang/pyGen.js）を採用** /
  ブロックASTから対応Pythonソースを生成し、Stage 2（ブロック⇔Python併記）で表示する。
  ロボットの動作は既存のトレース実行エンジンで動かし、Pythonは「対応表示」として見せる /
  代替案: Blockly の Python ジェネレータ（重く、既存の自作ブロックと二重管理になる）
- 2026-07-16 / **Stage 3/4 の Python 実行は、ロボット制御サブセットの自作パーサ
  （js/lang/pyParse.js）で既存トレースエンジンに写像して実行** /
  対応構文: robot.forward()/turn_left()/turn_right()/collect()、for i in range(n):、
  while <条件>:、if/elif/else、条件（robot.can_move()/on_gem()/at_goal() とその否定）、
  Pythonのインデント構造。これによりオフライン・軽量・ビルド不要・Nodeでテスト可能を維持 /
- 2026-07-16 / **Pyodide の導入は見送り（保留・将来のアップグレード候補）** /
  CLAUDE.md は「Pyodide第一候補、導入が困難な場合は自作簡易インタプリタで代替」。
  オフライン完結＋GitHub Pages＋子ども向けタブレットの高速初回ロードという制約下で、
  10MB超のCPython(WASM)をリポジトリに同梱するのは「導入が困難」に該当すると判断。
  本ゲームのステージが要求するPython（ロボットAPI・for/while・range・if/elif/else・比較）は
  上記サブセットで充足する。任意コードの本物Python実行が必要になった段階でPyodideを
  遅延ロードで追加する道は残す（CREDITS/DECISIONSに記録して切替） /
  代替案: Skulpt（MIT・約1MB）。サブセット自作より本物志向だが、robot APIのブリッジと
  トレース化の作り込みが必要で、当面はサブセット自作の方が軽く確実
- 2026-07-16 / **CodeMirror の導入は Stage 4 UI では当面見送り、等幅textareaで代替** /
  オフライン同梱の複雑さを避け、まず動くものを優先。シンタックスハイライト等が必要に
  なった段階で M7（磨き込み）で CodeMirror(MIT) を導入する /

---

## 2026-07-16 M6（ステージ量産）

- 2026-07-16 / **ブロックエディタを if/while の条件選択と else 分岐に対応拡張** /
  段階1で条件（if・if/else・while）を「ブロックで」学ぶため。条件はドロップダウン
  （まえに みちが ある / まえが かべ / ジェムの うえ / ゴールの うえ）、if には else ゾーンを追加 /
- 2026-07-16 / **合計31ステージを実装（block10/bridge5/fill8/free8）** /
  設計書の難易度カーブに沿って量産。全解答を stages.test.js で自動検証（実クリア確認）/
- 2026-07-16 / **変数・四則演算・リスト・文字列・def は現エンジン非対応 → 別マイルストーンで拡張** /
  現エンジンはロボット制御サブセット（順次・for/while・if/elif/else・robot API・boolean条件）を
  実行/検証する。REQUIREMENTS の Python 範囲のうち上記は「ロボットを動かす」パズルと評価軸が
  異なり（式評価・出力/戻り値の照合が必要）、pyParse への式評価追加＋新パズル型が要る。
  M6 のスコープ（量産＋難易度カーブ）とは別のエンジン拡張として、M7 の前 or M6.5 で対応を提案 /
  ※この点はユーザーに明示し、判断を仰ぐ

---

## 2026-07-16 M6.5（Python値エンジンの拡張）

上記 M6 の「未対応」を解消。ユーザーの了承（おすすめ順で進行）を受けて実装。

- 2026-07-16 / **計算/出力パズル用に Python サブセット・インタプリタ `js/lang/pyRun.js` を自作** /
  変数代入・四則演算(+ - * / // % **)・比較・and/or/not・if/elif/else・for(range/リスト)・while・
  def/return・print・リスト([]/append/index/len/連結)・文字列(連結/len/upper/lower/str/int)・
  組み込み(sum/min/max/abs/range/bool)に対応。トークナイザ＋優先順位つき式パーサ＋
  ツリーウォーク評価器。DOM非依存で Node テスト可能（無限ループは MAX_STEPS で停止）/
  代替案: Skulpt/Pyodide（本物Pythonだが、Nodeでの自動検証が難しく CI 安全網を失う。
  自作サブセットなら stages.test.js で出力を実行照合できる）
- 2026-07-16 / **mode:'compute' の新パズル型を追加（ロボット無し・print 出力で正誤判定）** /
  変数/計算/リスト/文字列/def を「ミッションの こたえを print する」形式で学ぶ。
  compute8ステージ（d1〜d8）を追加し、全 solutionCode の出力を stages.test.js で照合 /
- 2026-07-16 / **これで REQUIREMENTS の Python 範囲（変数・四則演算・if/elif/else・for/while・
  def・リスト・文字列）を全て網羅** / 合計39ステージ（block10/bridge5/fill8/free8/compute8）/
  ※Pyodide は引き続き不要（サブセットで要件充足・軽量・オフライン・CI検証可能を維持）

---
