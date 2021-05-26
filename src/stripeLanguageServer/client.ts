/* eslint-disable no-warning-comments */
import * as vscode from 'vscode';
import {
  CloseAction,
  ErrorAction,
  LanguageClient,
  LanguageClientOptions,
  RevealOutputChannelOn,
  ServerOptions,
  Trace,
} from 'vscode-languageclient';

import {Telemetry} from '../telemetry';

export class StripeLanguageClient {
  static activate(
    context: vscode.ExtensionContext,
    serverOptions: ServerOptions,
    telemetry: Telemetry,
  ) {
    const outputChannel = vscode.window.createOutputChannel('Stripe Lanaguage Client');
    outputChannel.appendLine('Starting universal client');
    const universalClientOptions: LanguageClientOptions = {
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
        fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc'),
      },
    };

    const universalClient = new LanguageClient(
      'stripeLanguageServer',
      'Stripe Language Server',
      serverOptions,
      universalClientOptions,
    );

    universalClient.onTelemetry((data: any) => {
      const eventData = data.data || null;
      telemetry.sendEvent(data.name, eventData);
    });

    universalClient.start();

    // TODO: Check project contents before kicking this off.
    this.activateDotNetServer(context, outputChannel);
  }

  static async activateDotNetServer(
    context: vscode.ExtensionContext,
    outputChannel: vscode.OutputChannel,
  ) {
    // TODO: replace this with real function that can find the executable
    const dotNetExecutable = '/usr/local/share/dotnet/dotnet';
    const serverAssembly = context.asAbsolutePath(
      'src/stripeDotnetLanguageServer/bin/Debug/net5.0/stripe.LanguageServer.dll',
    );

    const serverOptions: ServerOptions = {
      command: dotNetExecutable,
      args: [serverAssembly],
    };

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
      // Register the server for plain text documents
      documentSelector: [{scheme: 'file', language: 'csharp'}],
      synchronize: {
        configurationSection: 'stripeCsharpLangaugeServer',
        fileEvents: vscode.workspace.createFileSystemWatcher('**/*.cs'),
      },
      diagnosticCollectionName: 'Stripe C# language server',
      errorHandler: {
        error: (error, message, count) => {
          console.log(message);
          console.log(error);

          return ErrorAction.Continue;
        },
        closed: () => CloseAction.Restart,
      },
      revealOutputChannelOn: RevealOutputChannelOn.Error,
    };

    // Create the language client and start the client.
    const dotnetClient = new LanguageClient(
      'stripeCsharpLangaugeServer',
      'Stripe C# Server',
      serverOptions,
      clientOptions,
    );

    dotnetClient.trace = Trace.Verbose;
    outputChannel.appendLine('Starting C# language service...');

    const disposable = dotnetClient.start();
    // Push the disposable to the context's subscriptions so that the
    // client can be deactivated on extension deactivation
    context.subscriptions.push(disposable);

    await dotnetClient.onReady();
    outputChannel.appendLine('C# language service is running.');
  }
}
