import * as vscode from 'vscode';
import { MessageEnvelope, isKnownMessage } from '../bridge/messages';
import { validateIncoming } from '../bridge/messageValidator';
import { WorkspaceStore } from '../storage/workspaceStore';
import { handleCommand } from '../services/commandRouter';
import { seedSampleData } from '../storage/seed';

export class AgentForgeViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'agentforge.webview';

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext,
    private readonly _store: WorkspaceStore
  ) {}

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview')],
    };

    webviewView.webview.html = this._getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data: unknown) => {
      let envelope: MessageEnvelope;
      try {
        envelope = validateIncoming(data);
      } catch {
        return; // unvalidated or malformed message: drop silently
      }
      if (!isKnownMessage(envelope.type)) {
        return;
      }
      void handleCommand(this._store, webviewView.webview, envelope);
    });
  }

  private _getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'assets', 'index.js')
    );
    const stylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'assets', 'index.css')
    );
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; font-src ${webview.cspSource}; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data:; style-src-attr 'unsafe-inline'; connect-src 'none';" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="${stylesUri}" rel="stylesheet" />
    <title>AgentForge</title>
  </head>
  <body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>`;
  }
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 32; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
