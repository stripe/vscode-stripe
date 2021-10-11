import * as net from 'net';
import {ClientStatus, EXTENSION_NAME_SYNTAX, SYNTAXLS_CLIENT_PORT, StatusNotification} from './utils';
import {
  CloseAction,
  ErrorAction,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  StreamInfo,
} from 'vscode-languageclient/node';
import {OutputChannel} from 'vscode';

export class SyntaxLanguageClient {
  private languageClient: LanguageClient | undefined;
  private status: ClientStatus = ClientStatus.Uninitialized;

  public initialize(
    outputChannel: OutputChannel,
    clientOptions: LanguageClientOptions,
    serverOptions?: ServerOptions,
  ) {
    const newClientOptions: LanguageClientOptions = Object.assign({}, clientOptions, {
      errorHandler: {
        error: (error: string, message: string) => {
          console.log(message);
          console.log(error);

          return ErrorAction.Continue;
        },
        closed: () => CloseAction.DoNotRestart,
      },
    });

    const lsPort = process.env[SYNTAXLS_CLIENT_PORT];
    if (!serverOptions && lsPort) {
      serverOptions = () => {
        const socket = net.connect(lsPort);
        const result: StreamInfo = {
          writer: socket,
          reader: socket,
        };
        return Promise.resolve(result);
      };
    }

    if (serverOptions) {
      this.languageClient = new LanguageClient(
        'java',
        EXTENSION_NAME_SYNTAX,
        serverOptions,
        newClientOptions,
      );

      this.languageClient.onReady().then(() => {
        if (this.languageClient) {
          this.languageClient.onNotification(StatusNotification.type, (report: {type: any}) => {
            switch (report.type) {
              case 'Started':
                this.status = ClientStatus.Started;
                break;
              case 'Error':
                this.status = ClientStatus.Error;
                break;
              default:
                break;
            }
          });
        }
      });
    }

    this.status = ClientStatus.Initialized;
    outputChannel.appendLine('Java language service (syntax) is running.');
  }

  public start(): void {
    if (this.languageClient) {
      this.languageClient.start();
      this.status = ClientStatus.Starting;
    }
  }

  public stop() {
    this.status = ClientStatus.Stopping;
    if (this.languageClient) {
      this.languageClient.stop();
    }
  }

  public isAlive(): boolean {
    return !!this.languageClient && this.status !== ClientStatus.Stopping;
  }

  public getClient(): LanguageClient | undefined {
    return this.languageClient;
  }
}
