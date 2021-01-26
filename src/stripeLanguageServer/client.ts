import {ExtensionContext, workspace} from 'vscode';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
} from 'vscode-languageclient';

import {Telemetry} from '../telemetry';

export class StripeLanguageClient {
  static activate(context: ExtensionContext, serverOptions: ServerOptions, telemetry: Telemetry) {
    const clientOptions: LanguageClientOptions = {
      // Register the server for javascript (more languages to come)
      documentSelector: [{scheme: 'file', language: 'javascript'}, {scheme: 'file', language: 'typescript'}],
      synchronize: {
        fileEvents: workspace.createFileSystemWatcher('**/.clientrc'),
      },
    };

    const client = new LanguageClient(
      'stripeLanguageServer',
      'Stripe Language Server',
      serverOptions,
      clientOptions
    );

    client.onTelemetry((data: any) => {
      const eventData = data.data || null;
      telemetry.sendEvent(data.name, eventData);
    });

    client.start();
  }
}
