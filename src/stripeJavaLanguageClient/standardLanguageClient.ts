import {ClientStatus, EXTENSION_NAME_STANDARD, ServerMode, StatusNotification, StatusReport} from './utils';
import {LanguageClient, LanguageClientOptions, ServerOptions} from 'vscode-languageclient';
import {updateServerMode} from '../languageServerClient';

export class StandardLanguageClient {
  private languageClient: LanguageClient | undefined;
  private status: ClientStatus = ClientStatus.Uninitialized;

  public initialize(
    clientOptions: LanguageClientOptions,
    serverOptions: ServerOptions,
  ) {
    if (!serverOptions || this.status !== ClientStatus.Uninitialized) {
      return;
    }

    this.languageClient = new LanguageClient(
      'java',
      EXTENSION_NAME_STANDARD,
      serverOptions,
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
