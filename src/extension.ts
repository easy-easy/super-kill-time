import * as vscode from 'vscode';

const VIEW_TYPE = 'arcadeBrickBreaker';

/** 同時に開くパネルは 1 枚だけにする */
let currentPanel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('super-kill-time.startBrickBreaker', () => {
    const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;

    if (currentPanel) {
      currentPanel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(VIEW_TYPE, 'BrickBreaker', column, {
      enableScripts: true,
      // タブを切り替えてもゲームの状態を保つ
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
    });

    panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);

    panel.onDidDispose(
      () => {
        currentPanel = undefined;
      },
      null,
      context.subscriptions
    );

    currentPanel = panel;
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {
  // 何もしない（パネルは VS Code 側で破棄される）
}

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'main.js'));
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'style.css'));
  const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${styleUri}" rel="stylesheet">
  <title>BrickBreaker</title>
</head>
<body>
  <div class="wrap">
    <canvas id="game" width="640" height="480"></canvas>
    <p class="hint">← → / A D : パドル移動　　Space : 発射・リスタート</p>
  </div>
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
