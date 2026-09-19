# Super Kill Time

VS Code のエディタタブで複数のミニゲームを遊べる拡張機能。

## 動かし方

### 1. 依存をインストールしてビルド

リポジトリのルートで:

```bash
pnpm install && pnpm run compile
```

`dist/extension.js` が生成されれば OK です。

### 2. 拡張機能を起動

VS Code でこのフォルダを開いて **F5** を押します（`.vscode/launch.json` の "Run Extension" 設定）。
別ウィンドウで **Extension Development Host** が立ち上がります。

> 起動しない場合は、サイドバーの「実行とデバッグ」から "Run Extension" を選んで再生ボタンを押してください。

### 3. ゲームを開く

起動した Extension Development Host のウィンドウで `Cmd+Shift+P`（Windows/Linux は `Ctrl+Shift+P`）でコマンドパレットを開き、以下のいずれかを実行します。

| コマンド | 開くタブ |
| --- | --- |
| **`Super Kill Time: ブロック崩しを開始`** | "BrickBreaker" |
| **`Super Kill Time: インベーダーを開始`** | "Invaders" |

ゲームごとに独立したタブとして開くため、両方同時に開いていても互いに干渉しません。同じコマンドをもう一度実行すると、そのゲームの既に開いているタブが前面に出ます（1ゲームにつき同時に開くのは1枚だけ）。

### 4. 操作

どちらのゲームも左右移動キーは共通です。

| キー | 動作 |
| --- | --- |
| `←` / `→`、`A` / `D` | 自機（パドル / 自機）を左右に移動 |
| `Space` | ブロック崩し: ボールを発射 / リスタート。インベーダー: ゲーム開始 / 発射 / リスタート |

- **ブロック崩し**: ボールを落とすと **GAME OVER**、ブロックを全部消すと **CLEAR!**。
- **インベーダー**: 敵の弾に当たる、または敵が自機の高さまで迫ると **GAME OVER**、敵を全滅させると **CLEAR!**。
- どちらも `Space` でリスタートできます。
- 別のタブに切り替えても状態は保持されます（`retainContextWhenHidden`）。
- タブを閉じるとそのゲームは終了します。

キーが効かないときは、一度ゲーム画面をクリックしてフォーカスを当ててください。

## 開発

```bash
pnpm run watch
```

ファイルを保存するたびに再ビルドされます。`src/extension.ts` や `src/games.ts` を変更したら Extension Development Host のウィンドウで `Cmd+R`（Developer: Reload Window）を実行してください。
`media/` 配下だけの変更なら、ゲームのタブを閉じてコマンドを実行し直せば反映されます。

その他のコマンド:

| コマンド | 内容 |
| --- | --- |
| `pnpm run compile` | 1 回だけビルド |
| `pnpm run watch` | 変更を監視して再ビルド |
| `pnpm run typecheck` | 型チェックのみ（`tsc --noEmit`） |
| `pnpm run package` | 本番ビルド（minify） |

Webview のデバッグはコマンドパレットの `Developer: Open Webview Developer Tools` から行えます。

## 構成

```
src/extension.ts          コマンド登録・Webview パネル管理（GAMES を反復して汎用処理）
src/games.ts               ゲーム一覧（GameDefinition[]）。ゲームの追加はここに1件足すだけ
media/shared/base.css      Webview の共通スタイル（テーマ変数を使ったラッパー/キャンバス/ヒント）
media/shared/theme.js       VS Code のテーマ色を拾う window.SKT.themeColors()
media/shared/game-loop.js   dt クランプ付き requestAnimationFrame ループ window.SKT.runLoop()
media/brick-breaker/main.js ブロック崩し本体（Canvas 2D、状態はすべてここに集約）
media/invaders/main.js      インベーダー本体（Canvas 2D、状態はすべてここに集約）
esbuild.js                  ビルドスクリプト（src/extension.ts のみバンドル）
```

各ゲームのロジックはそれぞれの `main.js` に閉じていて、拡張ホストとのメッセージのやり取りはありません。共通処理（テーマ色取得・ゲームループ）だけ `media/shared/` に切り出し、`window.SKT` というグローバル名前空間経由で使います（バンドラを使わないため、ES モジュールではなく素の `<script nonce>` タグを順に読み込む方式）。スコアやステージなどを足すときも各ゲームの `main.js` だけで完結します。

### ゲームの追加

1. `media/<game-id>/main.js` を、既存ゲームと同じ `STATE`（`READY`/`PLAYING`/`OVER`/`CLEAR`）・IIFE パターンで新規作成する。色は `SKT.themeColors()`、ループは `SKT.runLoop({ update, draw })` を使う。
2. 共通スタイルは `media/shared/base.css` をそのまま使うので、通常は CSS の追加は不要。
3. `src/games.ts` の `GAMES` 配列に `GameDefinition` を1件追加する（id / command / commandTitle / viewType / title / mediaDir / entryScript / hint）。
4. `package.json` の `contributes.commands` に対応するコマンドを追加する。
5. `src/extension.ts` は変更不要。`GAMES` を反復してコマンド登録・パネル管理（同時に複数ゲームのタブを開けるが、各ゲームは1枚まで）が自動的に行われる。
