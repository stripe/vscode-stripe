'use strict';

import {
  CancellationToken,
  Command,
  Hover,
  HoverProvider,
  MarkdownString,
  MarkedString,
  Position,
  ProviderResult,
  TextDocument,
} from 'vscode';
import {HoverRequest, TextDocumentPositionParams} from 'vscode-languageclient';
import {FindLinks} from './utils';
import {LanguageClient} from 'vscode-languageclient/node';
import {Commands as javaCommands} from './commands';

export type provideHoverCommandFn = (params: TextDocumentPositionParams, token: CancellationToken) => ProviderResult<Command[] | undefined>;

export function createClientHoverProvider(languageClient: LanguageClient): JavaHoverProvider {
  const hoverProvider: JavaHoverProvider = new JavaHoverProvider(languageClient);
  registerHoverCommand(async (params: TextDocumentPositionParams, token: CancellationToken) => {
    const command = await provideHoverCommand(languageClient, params, token);
    return command;
  });

  return hoverProvider;
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

function encodeBase64(text: string): string {
  return Buffer.from(text).toString('base64');
}

const hoverCommandRegistry: provideHoverCommandFn[] = [];
export function registerHoverCommand(callback: provideHoverCommandFn): void {
  hoverCommandRegistry.push(callback);
}

class JavaHoverProvider implements HoverProvider {
  constructor(readonly languageClient: LanguageClient) {
    this.languageClient = languageClient;
  }

  async provideHover(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
  ): Promise<Hover | undefined> {
    const params = {
      textDocument: this.languageClient.code2ProtocolConverter.asTextDocumentIdentifier(document),
      position: this.languageClient.code2ProtocolConverter.asPosition(position),
    };

    // Fetch the javadoc from Java language server.
    const hoverResponse = await this.languageClient.sendRequest(HoverRequest.type, params, token);
    if (hoverResponse &&
        hoverResponse.contents &&
        Array.isArray(hoverResponse.contents) &&
        hoverResponse.contents[0].toString().includes('com.stripe.model')) {
      const apiKey = hoverResponse.contents[0].toString();
      let url = 'https://stripe.com/docs/api';
      url = url + '/' + apiKey;
      return new Hover([new MarkdownString('[Stripe API Reference](' + url + ')')], undefined);
    }

    const serverHover = this.languageClient.protocol2CodeConverter.asHover(hoverResponse);

    // Fetch the contributed hover commands from third party extensions.
    const contributedCommands: Command[] = await this.getContributedHoverCommands(params, token);
    if (!contributedCommands.length) {
      return serverHover;
    }

    const contributed = new MarkdownString(
      contributedCommands.map((command) => this.convertCommandToMarkdown(command)).join(' | '),
    );
    contributed.isTrusted = true;
    let contents: MarkedString[] = [contributed];
    let range;
    if (serverHover && serverHover.contents) {
      contents = contents.concat(serverHover.contents);
      range = serverHover.range;
    }
    return new Hover(contents, range);
  }

  private async getContributedHoverCommands(
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
