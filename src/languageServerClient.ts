/* eslint-disable no-warning-comments */
import * as path from 'path';
import * as vscode from 'vscode';
import {
  CloseAction,
  ErrorAction,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  Trace,
} from 'vscode-languageclient';
import {OSType, getOSType} from './utils';
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
      this.activateDotNetServer(context, outputChannel, dotnetProjectFile[0], telemetry);
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
    outputChannel.appendLine('Starting universal language server');
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
    outputChannel.appendLine('Universal language server is running');
    telemetry.sendEvent('universalLanguageServerStarted');
  }

  static async activateDotNetServer(
    context: vscode.ExtensionContext,
    outputChannel: vscode.OutputChannel,
    projectFile: string,
    telemetry: Telemetry,
  ) {
    outputChannel.appendLine('Detected C# Project file: ' + projectFile);
    const dotnetRuntimeVersion = '5.0';

    // Applie Silicon is not supported for dotnet < 6.0:
    // https://github.com/dotnet/core/issues/4879#issuecomment-729046912
    if (getOSType() === OSType.macOSarm) {
      outputChannel.appendLine(`.NET runtime v${dotnetRuntimeVersion} is not supported for M1`);
      telemetry.sendEvent('dotnetRuntimeAcquisitionSkippedForM1');
      return;
    }

    const result = await vscode.commands.executeCommand<{dotnetPath: string}>('dotnet.acquire', {
      version: dotnetRuntimeVersion,
      requestingExtensionId: 'stripe.vscode-stripe',
    });

    if (!result) {
      outputChannel.appendLine(
        `Failed to install .NET runtime v${dotnetRuntimeVersion}. Unable to start language server`,
      );

      telemetry.sendEvent('dotnetRuntimeAcquisitionFailed');
      return;
    }

    const dotNetExecutable = path.resolve(result.dotnetPath);
    outputChannel.appendLine('dotnet runtime acquired: ' + dotNetExecutable);

    const serverAssembly = context.asAbsolutePath(
      'dist/stripeDotnetLanguageServer/stripe.LanguageServer.dll',
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
        closed: () => CloseAction.DoNotRestart,
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
    outputChannel.appendLine('Starting C# language service for ' + projectFile);

    const disposable = dotnetClient.start();
    // Push the disposable to the context's subscriptions so that the
    // client can be deactivated on extension deactivation
    context.subscriptions.push(disposable);

    await dotnetClient.onReady();
    outputChannel.appendLine('C# language service is running.');
    telemetry.sendEvent('dotnetServerStarted');
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

        // Files and folders to exclude
        // There may be more we want to exclude but starting with the same set omnisharp uses:
        // https://github.com/OmniSharp/omnisharp-vscode/blob/master/src/omnisharp/launcher.ts#L66
        const exclude = '{**/node_modules/**,**/.git/**,**/bower_components/**}';
        const sln = await vscode.workspace.findFiles(pattern, exclude, 1);
        if (sln && sln.length === 1) {
          return sln[0].fsPath;
        } else {
          // If there was no solutions file, look for a csproj file.
          const pattern = new vscode.RelativePattern(workspacePath, '**/*.csproj');
          const csproj = await vscode.workspace.findFiles(pattern, exclude, 1);
          if (csproj && csproj.length === 1) {
            return csproj[0].fsPath;
          }
        }
      }),
    );

    return projectFiles.filter((file): file is string => Boolean(file));
  }
}
