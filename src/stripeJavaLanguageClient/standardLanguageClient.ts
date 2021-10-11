import {ClientStatus, EXTENSION_NAME_STANDARD, JDKInfo, SERVER_PORT} from './utils';
import {ExtensionContext, OutputChannel} from 'vscode';
import {LanguageClient, ServerOptions} from 'vscode-languageclient/node';
import {awaitServerConnection, prepareExecutable} from './javaServerStarter';
import {LanguageClientOptions} from 'vscode-languageclient';

export class StandardLanguageClient {
  private languageClient: LanguageClient | undefined;
  private status: ClientStatus = ClientStatus.Uninitialized;

  public async initialize(
    context: ExtensionContext,
    jdkInfo: JDKInfo,
    clientOptions: LanguageClientOptions,
    workspacePath: string,
    outputChannel: OutputChannel,
  ): Promise<void> {
    if (this.status !== ClientStatus.Uninitialized) {
      return;
    }

    let serverOptions;
    const port = process.env[SERVER_PORT];
    if (!port) {
        serverOptions = prepareExecutable(
            jdkInfo,
            workspacePath,
            context,
            false,
            outputChannel,
        );
    } else {
      // used during development
      serverOptions = awaitServerConnection.bind(null, port);
    }

    this.languageClient = new LanguageClient('java', EXTENSION_NAME_STANDARD, serverOptions as ServerOptions, clientOptions);
    await this.languageClient.onReady();
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

