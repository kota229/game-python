# PLAN.md — 作業計画

Claude Code はこのファイルに従って作業を進める。
各タスク完了時にチェックボックスを `[x]` に更新し、進捗を常にこのファイルに反映すること。
セッション再開時はまずこのファイルと `git log --oneline -20` を確認し、
未完了の最初のタスクから再開する。

## フェーズ0: リポジトリ整備（最初に一度だけ）

### M0: Git / GitHub セットアップ
- [x] `git init`（未実施の場合）、`.gitignore` 作成（node_modules、ビルド生成物、OSゴミファイル）
- [ ] `gh auth status` で GitHub 認証を確認（未認証ならユーザーに認証を依頼して停止）
      → ⚠️ この環境に `gh` が未インストール。DECISIONS.md に導入・認証手順を記載し、ユーザー対応待ち
- [ ] `gh repo create` で GitHub にリポジトリを作成し origin に設定 → ⚠️ 上記のためユーザー対応待ち
- [ ] スターターファイル一式を初回コミットして push → コミットは完了（ローカル）。push はユーザー対応待ち
- [x] GitHub Actions CI を作成（`.github/workflows/test.yml`）: push と PR のたびに自動テスト（スモークテスト1本で確認済み）
- [x] GitHub Pages 公開の仕組みを作る（`.github/workflows/pages.yml` 作成済み）。
      ※URL 確定と Pages ソース設定（「GitHub Actions」）はユーザーの認証・push 後（DECISIONS.md 参照）

## フェーズ1: 調査 + 設計 + プロトタイプ（main ブランチで作業）

### M1: GitHub上の類似OSSプロジェクトの徹底調査
- [x] `reference/` フォルダを作成し、`.gitignore` に追加する（クローンした他者の
      リポジトリを自分のリポジトリにコミットしないため）
- [x] GitHub を検索し（`gh search repos`、WebSearch、GitHub のトピック検索を併用）、
      子ども向けプログラミング学習ゲーム・Python学習アプリの類似OSSを
      **最低10個以上** 収集する。以下は必ず調査対象に含めること:
  - Blockly / Blockly Games（Google製ビジュアルブロックと学習ゲーム集）
  - Scratch 関連（scratch-gui / scratch-vm / scratch-blocks）
  - CodeCombat（コードを書いて進むRPG型学習ゲーム）
  - Hedy（段階的にPython文法へ近づけていく教育用言語。本プロジェクトの
    カリキュラム4段階と思想が近く、特に重点調査すること）
  - Reeborg's World / Karel 系の実装（マス目ロボット課題）
  - MakeCode（Microsoft のブロック⇔テキスト相互変換エディタ）
  - Pyodide の教育用途での利用例
  - CodeMirror / Monaco 等、子ども向けに使えるコードエディタ部品
- [x] 有望なリポジトリは `reference/` にクローンし、実際にコードとデモを確認する
      → ネット/容量の都合でクローンは行わず、GitHub上のライセンス・コード・READMEを
        WebFetch/WebSearchで実際に確認した（14件、docs/research.md にライセンス検証結果を記録）
- [x] 調査結果を `docs/research.md` にまとめる（①学べる設計 ②技術構成 ③ライセンス実確認 ④活用方針）
- [x] 調査を踏まえ「採用する部品リスト」を確定（research.md 末尾 + DECISIONS.md に判断記録、CREDITS.md 初版作成）
- [x] コミット（M1完了）※push は gh 認証後にユーザー実施（M0の未完了項目）

### M2: 設計
- [x] docs/research.md の知見を反映して、docs/design.md に設計書を作成する
  - カリキュラム全体構成（30ステージ以上の一覧: 各ステージの学習目標・形式・難易度。
    Blockly Games / Hedy のレベル設計から学んだ難易度カーブを取り入れること）
  - 画面遷移図（タイトル → ステージマップ → プレイ画面 → クリア演出）
  - データ構造（ステージ定義JSON のスキーマ、進捗データのスキーマ）
  - コード実行エンジンの方式（Pyodide 採用可否の検証結果を含む）
  - 採用OSS部品の一覧とライセンス対応（CREDITS.md の初版を作成）
- [x] プロジェクト雛形を作成（package.json / node:test / ディレクトリ構成、ビルド不要の静的構成）
- [x] コミット（M2完了）※push は gh 認証後にユーザー実施

### M3: コアエンジン
- [x] ステージ定義データ（data/stages.js）を読み込み、マップとキャラクターをCanvasで描画できる
- [x] ビジュアルブロックのドラッグ&ドロップUI（Stage 1形式。調査の結果 Blockly は採用せず
      自作の軽量ブロックビルダーを採用＝DECISIONS.md。タップ追加＋D&D入れ子＋並べ替え対応）
- [x] ブロック列を実行してキャラクターがアニメーション（1命令ずつ）で動く（トレースベース実行）
- [x] クリア判定と自動テスト（node:test 27件パス、CIでもパスする構成）
- [x] コミット（M3完了）※push は gh 認証後にユーザー実施

### M4: プロトタイプ5ステージ
- [x] Stage 1 形式のステージを5つ実装（順次実行→回転→回収→ループ導入→ループ+回転）
- [x] クリア演出（効果音・スター評価）、3段階ヒント機能、進捗保存（localStorage）
- [x] タイトル画面とステージマップ（解放/スター表示）
- [x] ブラウザで通しプレイして動作確認、全テストパス（実Chromeでの自動E2E検証済み・スクショ確認）
- [ ] GitHub Pages に反映し、公開URLでプレイできることを確認 → ⚠️ gh 認証・push 後にユーザー実施（M0参照）
- [x] コミット（M4完了）※push は gh 認証後にユーザー実施

### フェーズ1完了時の報告
- [x] フェーズ1（M0ローカル整備〜M4プロトタイプ5ステージ）完了、報告して停止。
      ⚠️ 残タスク（ユーザー対応）: この環境に `gh` 未インストールのため、GitHub への
      push・リポジトリ作成・Pages 公開URLの確定が未実施。DECISIONS.md の M0 手順を実施すると、
      以降 Pages が自動デプロイされ公開URLが確定する。ローカルでは `npm run serve` で即プレイ可能。

## フェーズ2: 本実装（各マイルストーンをブランチ + PR で進める）

以降の各マイルストーンは `feature/mN-xxx` ブランチで作業し、完了時に
`gh pr create` で Pull Request を作成して停止する。ユーザーが GitHub 上で
差分を確認してマージしたら、次のマイルストーンに進む。

### M5: カリキュラム全段階のエンジン拡張（branch: feature/m5-python-editor）
- [x] Stage 2 形式: ブロック⇔Pythonコード対応表示（mode:'bridge'、pyGen.jsで生成、実ブラウザE2E確認）
- [x] Stage 3 形式: Python穴埋めエディタ（mode:'fill'、選択式ブランク、正誤判定E2E確認）
- [x] Stage 4 形式: 自由記述Pythonエディタ + サンドボックス実行（mode:'free'、pyParse.jsのサブセット
      実行。Pyodideは軽量性の観点で見送り＝DECISIONS.md。将来の遅延ロード導入余地は残す）
- [x] 各形式の自動テスト（言語コア20件＋ステージ検証、全57テストパス）
      ※PR作成は gh 未導入のため未実施。ローカルで feature/m5-python-editor に実装完了。
        gh 認証後にユーザーが push → PR 作成（PR本文は報告に記載）

### M6: ステージ量産（branch: feature/m6-stages）
- [ ] 設計書のステージ一覧に従い、合計30ステージ以上を実装
- [ ] 難易度カーブの通し確認（急なジャンプがないか）
- [ ] PR作成

### M7: 磨き込み（branch: feature/m7-polish）
- [ ] BGM追加、演出強化（レベルアップ、アンロック要素）
- [ ] ふりがな・文言の子ども向け最終調整
- [ ] タブレット実機相当の画面サイズでの表示確認（800px〜1280px幅）
- [ ] PR作成

### M8: 納品準備（branch: feature/m8-release）
- [ ] Capacitor プロジェクト構成の整備（APK化手順の検証または手順書作成）
- [ ] CREDITS.md の最終化（利用した全OSSのライセンス表記が揃っているか監査）
- [ ] README.md 完成（Pages のURL、起動方法、APK化手順、操作説明）
- [ ] 全テストパスの最終確認、DECISIONS.md の整理
- [ ] PR作成、マージ後に「納品完了。タブレットで ○○ を開いてください」と報告する

## 完了条件（Definition of Done）
- GitHub Pages のURLをタブレットのブラウザで開けば、ゲームが最初から最後まで遊べる
- 30ステージ以上、カリキュラム4段階すべてを含む
- 全自動テストがローカルと GitHub Actions CI の両方でパス
- main の履歴がマイルストーン単位のコミットで追跡できる
- 利用したOSSがすべて CREDITS.md に記載され、ライセンス条件を満たしている
