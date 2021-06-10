import * as vscode from 'vscode';

export class StripeResourceDocumentContentProvider implements vscode.TextDocumentContentProvider {
  private extensionContext: vscode.ExtensionContext;
  private resourceIdRegexp: RegExp;
  private retrieveResourceFromContext: (context: vscode.ExtensionContext, id: string) => any;

  constructor(
    extensionContext: vscode.ExtensionContext,
    resourceIdRegexp: RegExp,
    retrieveResourceFromContext: (context: vscode.ExtensionContext, id: string) => any,
  ) {
    this.extensionContext = extensionContext;
    this.resourceIdRegexp = resourceIdRegexp;
    this.retrieveResourceFromContext = retrieveResourceFromContext;
  }

  provideTextDocumentContent(uri: vscode.Uri): string | null {
    const resourceId = this.getResourceIdFromUri(uri);
    if (!resourceId) {
      return null;
    }

    const resource = this.retrieveResourceFromContext(this.extensionContext, resourceId);

    // respect workspace tab settings, or default to 2 spaces
    const editorConfig = vscode.workspace.getConfiguration('editor');
    const insertSpaces = editorConfig.get('insertSpaces', true);
    const tabSize = editorConfig.get('tabSize', 2);
    const space = insertSpaces ? tabSize : '\t';

    const resourceJsonString = JSON.stringify(resource, undefined, space);
    return resourceJsonString;
  }

  private getResourceIdFromUri(uri: vscode.Uri): string | null {
    const {path} = uri;
    const match = path.match(this.resourceIdRegexp);
    if (!match || match.length < 1) {
      return null;
    }
    const [id] = match;
    return id;
  }
}
