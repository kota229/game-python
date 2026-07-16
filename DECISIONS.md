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
