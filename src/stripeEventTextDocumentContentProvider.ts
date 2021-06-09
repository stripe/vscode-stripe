import * as vscode from 'vscode';
import {EVENT_ID_REGEXP} from './resourceIDs';
import {retrieveEventDetails} from './stripeWorkspaceState';

export class StripeEventTextDocumentContentProvider implements vscode.TextDocumentContentProvider {
  private extensionContext: vscode.ExtensionContext;

  constructor(extensionContext: vscode.ExtensionContext) {
    this.extensionContext = extensionContext;
  }

  provideTextDocumentContent(uri: vscode.Uri): string | null {
    const eventId = this.getResourceIdFromUri(uri);
    if (!eventId) {
      return null;
    }

    const eventResource = retrieveEventDetails(this.extensionContext, eventId);

    // respect workspace tab settings, or default to 2 spaces
    const editorConfig = vscode.workspace.getConfiguration('editor');
    const insertSpaces = editorConfig.get('insertSpaces', true);
    const tabSize = editorConfig.get('tabSize', 2);
    const space = insertSpaces ? tabSize : '\t';

    const eventDataJsonString = JSON.stringify(eventResource, undefined, space);
    return eventDataJsonString;
  }

  private getResourceIdFromUri(uri: vscode.Uri): string | null {
    const {path} = uri;
    const match = path.match(EVENT_ID_REGEXP);
    if (!match || match.length < 1) {
      return null;
    }
    const [id] = match;
    return id;
  }
}
