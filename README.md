# Super Kill Time

VS Code のエディタタブでブロック崩しを遊べる拡張機能です。

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

起動した Extension Development Host のウィンドウで:

1. `Cmd+Shift+P`（Windows/Linux は `Ctrl+Shift+P`）でコマンドパレットを開く
2. **`Super Kill Time: ブロック崩しを開始`** を実行

エディタタブとして "BrickBreaker" が開きます。

### 4. 操作

| キー | 動作 |
| --- | --- |
| `←` / `→`、`A` / `D` | パドルを左右に移動 |
| `Space` | ボールを発射 / ゲームオーバー・クリア後にリスタート |

- ボールを落とすと **GAME OVER**、ブロックを全部消すと **CLEAR!** が表示されます。どちらも `Space` でリスタートできます。
- 別のタブに切り替えても状態は保持されます（`retainContextWhenHidden`）。
- タブを閉じるとゲームは終了します。同じコマンドをもう一度実行すると、既に開いているタブが前面に出ます（同時に開くのは 1 枚だけ）。

キーが効かないときは、一度ゲーム画面をクリックしてフォーカスを当ててください。

## 開発

```bash
pnpm run watch
```

ファイルを保存するたびに再ビルドされます。`src/extension.ts` を変更したら Extension Development Host のウィンドウで `Cmd+R`（Developer: Reload Window）を実行してください。
`media/main.js` や `media/style.css` だけの変更なら、ゲームのタブを閉じてコマンドを実行し直せば反映されます。

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
src/extension.ts   コマンド登録と Webview パネルの生成
media/main.js      ゲーム本体（Canvas 2D、状態はすべてここに集約）
media/style.css    Webview のスタイル
esbuild.js         ビルドスクリプト
```

ゲームロジックは `media/main.js` に閉じていて、拡張ホストとのメッセージのやり取りはありません。スコアやステージなどを足すときもこのファイルだけで完結します。
