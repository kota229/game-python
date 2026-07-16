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
