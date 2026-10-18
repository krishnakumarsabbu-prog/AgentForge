import * as vscode from 'vscode';
import { AgentForgeViewProvider } from './providers/AgentForgeViewProvider';
import { registerCommands } from './commands';
import { SchemaVersion, migrate } from './storage/migrations';
import { seedSampleData, clearSampleData } from './storage/seed';
import { WorkspaceStore } from './storage/workspaceStore';

export function activate(context: vscode.ExtensionContext): void {
  const store = new WorkspaceStore(context);
  const provider = new AgentForgeViewProvider(context.extensionUri, context, store);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('agentforge.webview', provider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  registerCommands(context, store);

  if (store.readSchemaVersion() !== SchemaVersion.CURRENT) {
    migrate(store);
    vscode.window.showInformationMessage('AgentForge: local data upgraded to the latest schema.');
  }

  if (store.isEmpty()) {
    seedSampleData(store);
  }
}

export function deactivate(): void {
  clearSampleData();
}
