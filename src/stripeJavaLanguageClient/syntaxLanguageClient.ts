import {ClientStatus, EXTENSION_NAME_SYNTAX, StatusNotification} from './utils';
import {CloseAction, ErrorAction, LanguageClientOptions} from 'vscode-languageclient';
import {LanguageClient, ServerOptions} from 'vscode-languageclient/node';

/**
 * Syntax java client based off generic language client
 * Inspired by https://github.com/redhat-developer/vscode-java/blob/master/src/syntaxLanguageClient.ts
 */
export class SyntaxLanguageClient {
  private languageClient: LanguageClient | undefined;
  private status: ClientStatus = ClientStatus.Uninitialized;

  public initialize(
    clientOptions: LanguageClientOptions,
    serverOptions: ServerOptions,
  ) {
    if (!serverOptions) {
      return;
    }

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

    this.status = ClientStatus.Initialized;
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
