import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('aiWhack.startGame', () => {
    const panel = vscode.window.createWebviewPanel(
      'aiWhackGame',
      'Whack-A-Mole: AI Mode',
      vscode.ViewColumn.Two,
      { enableScripts: true }
    );

    const scriptUri = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, 'media', 'game.js')
    );
    const styleUri = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, 'media', 'game.css')
    );

    const nonce = getNonce();

    panel.webview.html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy"
              content="default-src 'none'; style-src ${panel.webview.cspSource}; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleUri}" rel="stylesheet">
        <title>Whack-A-Mole</title>
      </head>
      <body>
        <canvas id="gameCanvas"></canvas>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  });

  context.subscriptions.push(disposable);
}

function getNonce() {
  return Math.random().toString(36).substring(2, 15);
}