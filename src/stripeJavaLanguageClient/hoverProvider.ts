'use strict';

import {
  CancellationToken,
  Command,
  ExtensionContext,
  Hover,
  HoverProvider,
  MarkdownString,
  MarkedString,
  Position,
  ProviderResult,
  TextDocument,
  languages,
} from 'vscode';
import {FindLinks, ServerMode, getJavaApiDocLink} from './utils';
import {HoverRequest, LanguageClient, TextDocumentPositionParams} from 'vscode-languageclient';
import {getActiveJavaLanguageClient, javaServerMode} from '../languageServerClient';
import {Commands as javaCommands} from './commands';

export type provideHoverCommandFn = (
  params: TextDocumentPositionParams,
  token: CancellationToken,
) => ProviderResult<Command[] | undefined>;
const hoverCommandRegistry: provideHoverCommandFn[] = [];

export function registerHoverProvider(context: ExtensionContext) {
  const hoverProvider = new ClientHoverProvider();
  context.subscriptions.push(languages.registerHoverProvider('java', hoverProvider));
}

function registerHoverCommand(callback: provideHoverCommandFn): void {
  hoverCommandRegistry.push(callback);
}

function createClientHoverProvider(languageClient: LanguageClient): JavaHoverProvider {
  const hoverProvider: JavaHoverProvider = new JavaHoverProvider(languageClient);
  registerHoverCommand(async (params: TextDocumentPositionParams, token: CancellationToken) => {
    const command = await provideHoverCommand(languageClient, params, token);
    return command;
  });

  return hoverProvider;
}

function encodeBase64(text: string): string {
  return Buffer.from(text).toString('base64');
}

async function provideHoverCommand(
  languageClient: LanguageClient,
  params: TextDocumentPositionParams,
  token: CancellationToken,
): Promise<Command[] | undefined> {
  const response = await languageClient.sendRequest(
    FindLinks.type,
    {
      type: 'superImplementation',
      position: params,
    },
    token,
  );
  if (response && response.length) {
    const location = response[0];
    let tooltip;
    if (location.kind === 'method') {
      tooltip = `Go to super method '${location.displayName}'`;
    } else {
      tooltip = `Go to super implementation '${location.displayName}'`;
    }

    return [
      {
        title: 'Go to Super Implementation',
        command: javaCommands.NAVIGATE_TO_SUPER_IMPLEMENTATION_COMMAND,
        tooltip,
        arguments: [
          {
            uri: encodeBase64(location.uri),
            range: location.range,
          },
        ],
      },
    ];
  }
}

class ClientHoverProvider implements HoverProvider {
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

export class JavaHoverProvider implements HoverProvider {
  constructor(readonly languageClient: LanguageClient) {
    this.languageClient = languageClient;
  }

  async provideHover(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
  ): Promise<Hover | undefined> {
    let contents: MarkedString[] = [];
    let range;

    const params = {
      textDocument: this.languageClient.code2ProtocolConverter.asTextDocumentIdentifier(document),
      position: this.languageClient.code2ProtocolConverter.asPosition(position),
    };

    // get javs doc convent from server
    const hoverResponse = await this.languageClient.sendRequest(HoverRequest.type, params, token);

    // parse for stripe api hover content
    let stripeApiHoverContent;
    if (hoverResponse && hoverResponse.contents && Array.isArray(hoverResponse.contents)) {
      const stripeFullClassPath = Object.entries(hoverResponse.contents[0])
        .filter((item) => item[0] === 'value')
        .filter((item) => item[1].includes('com.stripe.model'));
      if (stripeFullClassPath.length > 0) {
        const stripeMethod = stripeFullClassPath[0][1].split(' ')[1].split('(')[0];
        const url = getJavaApiDocLink(stripeMethod);
        if (url) {
          stripeApiHoverContent = new MarkdownString(
            'See this method in the [Stripe API Reference](' + url + ')',
          );
          stripeApiHoverContent.isTrusted = true;
        }
      }
    }

    if (!!stripeApiHoverContent) {
      contents = contents.concat([stripeApiHoverContent] as MarkedString[]);
    }

    // get contributed hover commands from third party extensions.
    const contributedCommands: Command[] = await this.getContributedHoverCommands(params, token);

    if (contributedCommands.length > 0) {
      const contributedContent = new MarkdownString(
        contributedCommands.map((command) => this.convertCommandToMarkdown(command)).join(' | '),
      );
      contributedContent.isTrusted = true;
      contents = contents.concat([contributedContent] as MarkedString[]);
    }

    // combine all hover contents with java docs from server
    const serverHover = this.languageClient.protocol2CodeConverter.asHover(hoverResponse);
    if (serverHover && serverHover.contents) {
      contents = contents.concat(serverHover.contents);
      range = serverHover.range;
    }

    return new Hover(contents, range);
  }

  async getContributedHoverCommands(
    params: TextDocumentPositionParams,
    token: CancellationToken,
  ): Promise<Command[]> {
    const contributedCommands: Command[] = [];
    for (const provideFn of hoverCommandRegistry) {
      try {
        if (token.isCancellationRequested) {
          break;
        }

        // eslint-disable-next-line no-await-in-loop
        const commands = (await provideFn(params, token)) || [];
        commands.forEach((command: Command) => {
          contributedCommands.push(command);
        });
      } catch (error) {
        return [];
      }
    }

    return contributedCommands;
  }

  private convertCommandToMarkdown(command: Command): string {
    return `[${command.title}](command:${command.command}?${encodeURIComponent(
      JSON.stringify(command.arguments || []),
    )} "${command.tooltip || command.command}")`;
  }
}
