# このスターターキットの使い方（GitHub連携版）

## ファイル構成
| ファイル | 役割 |
|---------|------|
| `CLAUDE.md` | Claude Code が毎セッション自動で読むルール（Git運用・技術方針・品質基準） |
| `REQUIREMENTS.md` | 要件定義（何を作るか） |
| `PLAN.md` | 作業計画。M0（GitHub整備）→ フェーズ1 → フェーズ2 の順に進む |
| `DECISIONS.md` | Claude Code が自走中の判断を記録する場所 |
| `docs/` | 設計書の出力先（Claude Code が作成） |

---

## 事前準備（初回のみ、あなたが行う作業）

### 1. このキットを作業フォルダに展開する
ZIPの中身を `C:\Users\kota2\Dropbox\Projects\game-python` に展開してください。
（CLAUDE.md 等がこのフォルダの直下に来るようにする）

### 2. Git と GitHub CLI をインストールする
- Git for Windows: https://git-scm.com/downloads
- GitHub CLI (gh): https://cli.github.com/
  （どちらもインストーラをダウンロードして実行するだけです）

### 3. GitHub に認証する（APIキーは不要です）
コマンドプロンプト or PowerShell で:
```
gh auth login
```
と実行し、「GitHub.com」→「HTTPS」→「ブラウザでログイン」を選ぶと、
ブラウザが開いて認証が完了します。**これで終わりです。**
以後、Claude Code はこの認証を使って push・リポジトリ作成・PR作成・Issue操作が
できるようになります。トークンやAPIキーをファイルに書く必要はありません。

> **補足: 「GitHubのAPIキー」が必要になるのはいつ?**
> 基本的な運用（push / PR / CI / Pages）では一切不要です。
> 唯一必要になるのは発展編の「@claude メンション連携（Claude Code GitHub Actions）」
> を使う場合で、そのときに必要なのは GitHub のキーではなく **Anthropic の APIキー**
> （リポジトリの Settings > Secrets に登録）です。今回のプランでは使いません。

### 4. Dropbox に関する注意（重要）
Git の管理フォルダ（`.git`）と Dropbox の同期は相性が悪く、
同期のタイミングによってリポジトリが壊れることがあります。対策はどちらか:
- **推奨**: Dropbox の設定で `game-python` フォルダを「同期から除外」する
  （選択型同期）。バックアップの役割は GitHub が引き受けるので問題ありません
- または、開発作業中は Dropbox の同期を一時停止する

---

## 開発の進め方

### ステップ1: Claude Code を起動して最初のプロンプトを打つ
```
cd C:\Users\kota2\Dropbox\Projects\game-python
claude
```
最初のプロンプト:
```
CLAUDE.md、REQUIREMENTS.md、PLAN.md を読んでください。
まず PLAN.md の M0（GitHubリポジトリ整備）を完了させ、続けて M1
（GitHub上の類似OSSプロジェクトの徹底調査）を実施して docs/research.md に
まとめてください。その後フェーズ1の残り（設計〜プロトタイプ5ステージ）まで
進め、完了したら報告して止まってください。
```

### ステップ2: 調査結果とプロトタイプを確認する
フェーズ1完了の報告には、docs/research.md（類似OSSの調査結果と採用部品の判断）と
GitHub Pages のURLが含まれます。research.md に目を通すと「どのOSSの何を
参考にしたか」「ライセンス上どう扱ったか」が分かります。
フェーズ1完了の報告に GitHub Pages のURLが含まれます。
**AndroidタブレットのブラウザでそのURLを開けば、その場で遊べます。**
（以後、Claude Code が push するたびに自動で最新版に更新されます）

### ステップ3: フェーズ2へ
問題なければ（あるいは修正指示を出したうえで）:
```
フェーズ1の内容で進めてOKです。PLAN.md のフェーズ2に着手してください。
M5のブランチを切って作業し、完了したらPRを作成して止まってください。
```
以降、各マイルストーンで Pull Request が作られます。
GitHub のリポジトリページ →「Pull requests」タブで差分を眺め、
問題なければ「Merge pull request」ボタンでマージしてください。
マージしたら Claude Code に「マージしました。次のマイルストーンへ」と伝えます。

> この「差分を読む → マージする」の繰り返しが、git/GitHub の実務そのものの
> 練習になります。差分画面で緑（追加）と赤（削除）を読む習慣をつけるのがおすすめです。

### 改善要望は Issue で管理する（任意）
遊んでいて気づいたこと（「ステージ12のヒントが分かりにくい」等）は、
GitHub の Issues タブから登録しておき、セッションで
```
Issue #3 を対応してください
```
と指示すると、Claude Code が内容を読んでブランチを切り、PRまで作ります。

---

## セッションが途中で切れた場合
新しいセッションで以下を打てば続きから再開されます:
```
PLAN.md、DECISIONS.md、git log を確認して、未完了の最初のタスクから再開してください。
```

## 何かが壊れたときの復旧（gitの安心ポイント）
マイルストーンごとにコミットされているので、いつでも戻せます:
```
git log --oneline        ← 履歴を確認
git checkout <コミットID> -- .   ← 特定時点のファイルに戻す
```
判断に迷ったら、Claude Code に「M4完了時点の状態に戻して」と頼むこともできます。

## 権限に関するメモ
- 「完全に自走」させるには、Claude Code の許可プロンプトを減らす設定が有効です。
  起動時に `claude --permission-mode acceptEdits` とするか、
  信頼できる環境なら自動承認の設定を検討してください。
- CLAUDE.md に「フォルダ外の編集禁止」「force push 禁止」を明記済みですが、
  GitHub 側にもバックアップが残るため、万一の際も復旧可能です。
