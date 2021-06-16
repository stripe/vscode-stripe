/* eslint-disable no-warning-comments */
import * as vscode from 'vscode';
import {
  CloseAction,
  ErrorAction,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  Trace,
} from 'vscode-languageclient';
import {Telemetry} from './telemetry';

export class StripeLanguageClient {
  static async activate(
    context: vscode.ExtensionContext,
    serverOptions: ServerOptions,
    telemetry: Telemetry,
  ) {
    const outputChannel = vscode.window.createOutputChannel('Stripe Language Client');

    // start the csharp server if this is a dotnet project
    const dotnetProjectFile = await this.getDotnetProjectFiles();
    if (dotnetProjectFile.length > 0) {
      this.activateDotNetServer(context, outputChannel, dotnetProjectFile[0]);
    } else {
      this.activateUniversalServer(context, outputChannel, serverOptions, telemetry);
    }
  }

  static activateUniversalServer(
    context: vscode.ExtensionContext,
    outputChannel: vscode.OutputChannel,
    serverOptions: ServerOptions,
    telemetry: Telemetry,
  ) {
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
  }

  static async activateDotNetServer(
    context: vscode.ExtensionContext,
    outputChannel: vscode.OutputChannel,
    projectFile: string,
  ) {
    // TODO: replace this with real function that can find the executable
    const dotNetExecutable = '/usr/local/share/dotnet/dotnet';
    const serverAssembly = context.asAbsolutePath(
      'src/stripeDotnetLanguageServer/stripe.LanguageServer/bin/Debug/net5.0/stripe.LanguageServer.dll',
    );

    const serverOptions: ServerOptions = {
      command: dotNetExecutable,
      args: [serverAssembly, projectFile],
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
    };

    // Create the language client and start the client.
    const dotnetClient = new LanguageClient(
      'stripeCsharpLanguageServer',
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

  /**
   * Returns a solutions file or project file if it exists in the workspace.
   *
   * If the user is working with multiple workspaces that contain C# projects, we don't know which one to run the server on, so we'll return the first one we find.
   * In the future, we may want to prompt the user to pick one, or expose a command that let's the user change the tracking project and restart.
   *
   * Returns [] if none of the workspaces are .NET projects.
   */
  static async getDotnetProjectFiles(): Promise<string[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return [];
    }

    const projectFiles = await Promise.all(
      workspaceFolders.map(async (w) => {
        const workspacePath = w.uri.fsPath;

        // First look for solutions files. We only expect one solutions file to be present in a workspace.
        const pattern = new vscode.RelativePattern(workspacePath, '**/*.sln');
        const sln = await vscode.workspace.findFiles(pattern, null, 1);
        if (sln && sln.length === 1) {
          return sln[0].fsPath;
        } else {
          // If there was no solutions file, look for a csproj file.
          const pattern = new vscode.RelativePattern(workspacePath, '**/*.csproj');
          const csproj = await vscode.workspace.findFiles(pattern, null, 1);
          if (csproj && csproj.length === 1) {
            return csproj[0].fsPath;
          }
        }
      }),
    );

    return projectFiles.filter((file): file is string => Boolean(file));
  }
}
