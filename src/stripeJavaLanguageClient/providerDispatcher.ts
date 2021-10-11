import {
  CancellationToken,
  ExtensionContext,
  Hover,
  HoverProvider,
  Position,
  TextDocument,
  languages,
} from 'vscode';
import {HoverRequest, LanguageClient} from 'vscode-languageclient';
import {getActiveJavaLanguageClient, javaServerMode} from '../languageServerClient';
import {ServerMode} from './utils';
import {createClientHoverProvider} from './hoverAction';

export interface ProviderHandle {
  handles: any[];
}

export function registerClientProviders(context: ExtensionContext): ProviderHandle {
  const hoverProvider = new ClientHoverProvider();
  context.subscriptions.push(languages.registerHoverProvider('java', hoverProvider));
  return {
    handles: [hoverProvider],
  };
}

export class ClientHoverProvider implements HoverProvider {
  private delegateProvider: any;

  async provideHover(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
  ): Promise<Hover | undefined> {
    const languageClient: LanguageClient | undefined = await getActiveJavaLanguageClient();

    if (!languageClient) {
      return undefined;
    }

    if (javaServerMode === ServerMode.STANDARD) {
      if (!this.delegateProvider) {
        this.delegateProvider = createClientHoverProvider(languageClient);
      }
      return this.delegateProvider.provideHover(document, position, token);
    } else {
      const params = {
        textDocument: languageClient.code2ProtocolConverter.asTextDocumentIdentifier(document),
        position: languageClient.code2ProtocolConverter.asPosition(position),
      };
      const hoverResponse = await languageClient.sendRequest(HoverRequest.type, params, token);
      return languageClient.protocol2CodeConverter.asHover(hoverResponse);
    }
  }
}
