import * as vscode from 'vscode';

import {StripeCLIClient} from './rpc/commands_grpc_pb';

export class StripeResourceDocumentContentProvider implements vscode.TextDocumentContentProvider {
  private extensionContext: vscode.ExtensionContext;
  private resourceIdRegexp: RegExp;
  private retrieveResourceFromContext: ((context: vscode.ExtensionContext, id: string) => any) | undefined;
  private asyncRetrieveResourceFromContext: ((context: vscode.ExtensionContext, id: string, daemonClient: StripeCLIClient) => any) | undefined;
  private daemonClient: StripeCLIClient | undefined;
  private isAsync: boolean;

  constructor(
    extensionContext: vscode.ExtensionContext,
    resourceIdRegexp: RegExp,
    retrieveResourceFromContext: ((context: vscode.ExtensionContext, id: string) => any) | undefined,
    asyncRetrieveResourceFromContext: ((context: vscode.ExtensionContext, id: string, daemonClient: StripeCLIClient) => any) | undefined,
    daemonClient: StripeCLIClient | undefined,
    isAsync: boolean,
  ) {
    this.extensionContext = extensionContext;
    this.resourceIdRegexp = resourceIdRegexp;
    this.retrieveResourceFromContext = retrieveResourceFromContext;
    this.asyncRetrieveResourceFromContext = asyncRetrieveResourceFromContext;
    this.daemonClient = daemonClient;
    this.isAsync = isAsync;
  }

  async provideTextDocumentContent(uri: vscode.Uri): Promise<string | null> {
    const resourceId = this.getResourceIdFromUri(uri);
    if (!resourceId) {
      return null;
    }

    let resource = '';
    if (this.isAsync && !!this.asyncRetrieveResourceFromContext && !!this.daemonClient) {
      resource = await this.asyncRetrieveResourceFromContext(this.extensionContext, resourceId, this.daemonClient);
    } else if (!!this.retrieveResourceFromContext) {
      resource = this.retrieveResourceFromContext(this.extensionContext, resourceId);
    } else {
      return null;
    }

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
