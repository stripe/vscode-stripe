import {ExtensionContext, workspace} from 'vscode';

import {LanguageClient, LanguageClientOptions, ServerOptions} from 'vscode-languageclient';

import {Telemetry} from '../telemetry';

export class StripeLanguageClient {
  static activate(context: ExtensionContext, serverOptions: ServerOptions, telemetry: Telemetry) {
    const clientOptions: LanguageClientOptions = {
      // Register the server for stripe-supported languages. dotnet is not yet supported.
      documentSelector: [
        {scheme: 'file', language: 'javascript'},
        {scheme: 'file', language: 'typescript'},
        {scheme: 'file', language: 'go'},
        {scheme: 'file', language: 'java'},
        {scheme: 'file', language: 'php'},
        {scheme: 'file', language: 'python'},
        {scheme: 'file', language: 'ruby'},
      ],
      synchronize: {
        fileEvents: workspace.createFileSystemWatcher('**/.clientrc'),
      },
    };

    const client = new LanguageClient(
      'stripeLanguageServer',
      'Stripe Language Server',
      serverOptions,
      clientOptions,
    );

    client.onTelemetry((data: any) => {
      const eventData = data.data || null;
      telemetry.sendEvent(data.name, eventData);
    });

    client.start();
  }
}
