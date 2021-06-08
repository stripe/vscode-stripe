import * as vscode from 'vscode';
import {retrieveLogDetails} from './stripeWorkspaceState';

export class StripeLogTextDocumentContentProvider implements vscode.TextDocumentContentProvider {
  private static LOG_ID_REGEXP = /req_[\w]+/;

  private extensionContext: vscode.ExtensionContext;

  constructor(extensionContext: vscode.ExtensionContext) {
    this.extensionContext = extensionContext;
  }

  provideTextDocumentContent(uri: vscode.Uri): string | null {
    const logId = this.getResourceIdFromUri(uri);
    if (!logId) {
      return null;
    }

    const eventResource = retrieveLogDetails(this.extensionContext, logId);

    // respect workspace tab settings, or default to 2 spaces
    const editorConfig = vscode.workspace.getConfiguration('editor');
    const insertSpaces = editorConfig.get('insertSpaces', true);
    const tabSize = editorConfig.get('tabSize', 2);
    const space = insertSpaces ? tabSize : '\t';

    const logDataJsonString = JSON.stringify(eventResource, undefined, space);
    return logDataJsonString;
  }

  private getResourceIdFromUri(uri: vscode.Uri): string | null {
    const {path} = uri;
    const match = path.match(StripeLogTextDocumentContentProvider.LOG_ID_REGEXP);
    if (!match || match.length < 1) {
      return null;
    }
    const [id] = match;
    return id;
  }
}
