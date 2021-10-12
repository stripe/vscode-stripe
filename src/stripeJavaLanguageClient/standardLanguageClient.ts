import {ClientStatus, EXTENSION_NAME_STANDARD, JDKInfo, SERVER_PORT, ServerMode, StatusNotification, StatusReport} from './utils';
import {ExtensionContext, OutputChannel} from 'vscode';
import {LanguageClient, LanguageClientOptions, ServerOptions} from 'vscode-languageclient';
import {awaitServerConnection, prepareExecutable} from './javaServerStarter';
import {updateServerMode} from '../languageServerClient';

export class StandardLanguageClient {
  private languageClient: LanguageClient | undefined;
  private status: ClientStatus = ClientStatus.Uninitialized;

  public initialize(
    context: ExtensionContext,
    jdkInfo: JDKInfo,
    clientOptions: LanguageClientOptions,
    workspacePath: string,
    outputChannel: OutputChannel,
  ) {
    if (this.status !== ClientStatus.Uninitialized) {
      return;
    }

    let serverOptions;
    const port = process.env[SERVER_PORT];
    if (!port) {
      serverOptions = prepareExecutable(jdkInfo, workspacePath, context, false, outputChannel);
    } else {
      // used during development
      serverOptions = awaitServerConnection.bind(null, port);
    }

    this.languageClient = new LanguageClient(
      'java',
      EXTENSION_NAME_STANDARD,
      serverOptions as ServerOptions,
      clientOptions,
    );

    this.languageClient.onReady().then(() => {
      if (!this.languageClient) {
        return;
      }

      this.languageClient.onNotification(StatusNotification.type, (report: StatusReport) => {
        switch (report.type) {
          case 'ServiceReady':
            updateServerMode(ServerMode.STANDARD);
            break;
          case 'Started':
            this.status = ClientStatus.Started;
            break;
          case 'Error':
            this.status = ClientStatus.Error;
            break;
          case 'Starting':
          case 'Message':
            // message goes to progress report instead
            break;
        }
      });
    });

    this.status = ClientStatus.Initialized;
    outputChannel.appendLine('Java language service (standard) is running.');
  }

  public start(): void {
    if (this.languageClient && this.status === ClientStatus.Initialized) {
      this.languageClient.start();
      this.status = ClientStatus.Starting;
    }
  }

  public stop() {
    if (this.languageClient) {
      this.languageClient.stop();
      this.status = ClientStatus.Stopping;
    }
  }

  public getClient(): LanguageClient | undefined {
    return this.languageClient;
  }

  public getClientStatus(): ClientStatus {
    return this.status;
  }
}
