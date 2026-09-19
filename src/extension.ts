import * as vscode from 'vscode';
import { GAMES, type GameDefinition } from './games';

/** ゲームIDごとに開いているパネルを1枚まで保持する */
const panels = new Map<string, vscode.WebviewPanel>();

export function activate(context: vscode.ExtensionContext) {
  for (const game of GAMES) {
    const disposable = vscode.commands.registerCommand(game.command, () => {
      const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;

      const existing = panels.get(game.id);
      if (existing) {
        existing.reveal(column);
        return;
      }

      const panel = vscode.window.createWebviewPanel(game.viewType, game.title, column, {
        enableScripts: true,
        // タブを切り替えてもゲームの状態を保つ
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
      });

      panel.webview.html = getWebviewContent(panel.webview, context.extensionUri, game);

      panel.onDidDispose(
        () => {
          panels.delete(game.id);
        },
        null,
        context.subscriptions
      );

      panels.set(game.id, panel);
    });

    context.subscriptions.push(disposable);
  }
}

export function deactivate() {
  // 何もしない（パネルは VS Code 側で破棄される）
}

function getWebviewContent(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  game: GameDefinition
): string {
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'shared', 'base.css'));
  const themeUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'shared', 'theme.js'));
  const loopUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'shared', 'game-loop.js'));
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'media', game.mediaDir, game.entryScript)
  );
  const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${styleUri}" rel="stylesheet">
  <title>${game.title}</title>
</head>
<body>
  <div class="wrap">
    <canvas id="game" width="640" height="480"></canvas>
    <p class="hint">${game.hint}</p>
  </div>
  <script nonce="${nonce}" src="${themeUri}"></script>
  <script nonce="${nonce}" src="${loopUri}"></script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
