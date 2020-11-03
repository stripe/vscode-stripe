import * as vscode from "vscode";
import { StripeClient } from "./stripeClient";

export class StripeEventTextDocumentContentProvider implements vscode.TextDocumentContentProvider {
  private static EVENT_ID_REGEX = /evt_[\w]+/;

  private stripeClient: StripeClient;

  constructor(stripeClient: StripeClient) {
    this.stripeClient = stripeClient;
  }

  async provideTextDocumentContent(uri: vscode.Uri): Promise<string | null> {
    const eventId = this.getResourceIdFromUri(uri);
    if (!eventId) {
      return null;
    }

    const eventResource = await this.stripeClient.getResourceById(eventId);

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
    const match = path.match(StripeEventTextDocumentContentProvider.EVENT_ID_REGEX);
    if (!match || match.length < 1) {
      return null;
    }
    const [id] = match;
    return id;
  }
}
