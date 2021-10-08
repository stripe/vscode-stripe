'use strict';

import * as net from 'net';
import {ClientErrorHandler, OutputInfoCollector, getJavaConfig} from './extension';
import {ExtensionAPI, ClientStatus} from './extension.api';
import {DidChangeConfigurationNotification, LanguageClientOptions} from 'vscode-languageclient';
import {LanguageClient, ServerOptions, StreamInfo} from 'vscode-languageclient/node';
import {apiManager} from './apiManager';
import {logger} from './log';
import {StatusNotification} from './protocol';
import {ServerMode} from './settings';
import {JDKInfo, SYNTAXLS_CLIENT_PORT} from './javaClient';

const extensionName = 'Language Support for Java (Syntax Server)';

export class SyntaxLanguageClient {
  private languageClient: LanguageClient;
  private status: ClientStatus = ClientStatus.Uninitialized;

  public initialize(
    jdkInfo: JDKInfo,
    clientOptions: LanguageClientOptions,
    serverOptions?: ServerOptions,
  ) {
    const newClientOptions: LanguageClientOptions = Object.assign({}, clientOptions, {
      middleware: {
        workspace: {
          didChangeConfiguration: () => {
            this.languageClient.sendNotification(DidChangeConfigurationNotification.type, {
              settings: {
                java: getJavaConfig(jdkInfo.javaHome),
              },
            });
          },
        },
      },
      errorHandler: new ClientErrorHandler(extensionName),
      initializationFailedHandler: (error: any) => {
        logger.error(`Failed to initialize ${extensionName} due to ${error && error.toString()}`);
        return true;
      },
      outputChannel: new OutputInfoCollector(extensionName),
      outputChannelName: extensionName,
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
        extensionName,
        serverOptions,
        newClientOptions,
      );

      this.languageClient.onReady().then(() => {
        this.languageClient.onNotification(StatusNotification.type, (report: {type: any}) => {
          switch (report.type) {
            case 'Started':
              this.status = ClientStatus.Started;
              apiManager.updateStatus(ClientStatus.Started);
              break;
            case 'Error':
              this.status = ClientStatus.Error;
              apiManager.updateStatus(ClientStatus.Error);
              break;
            default:
              break;
          }
        });
      });
    }

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
      this.languageClient = null;
    }
  }

  public isAlive(): boolean {
    return !!this.languageClient && this.status !== ClientStatus.Stopping;
  }

  public getClient(): LanguageClient {
    return this.languageClient;
  }
}
