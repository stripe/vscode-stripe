/* eslint-disable no-warning-comments */

import * as os from 'os';
import * as path from 'path';
import {
  ClientStatus,
  JDKInfo,
  JDTLS_CLIENT_PORT,
  SYNTAXLS_CLIENT_PORT,
  ServerMode,
  ensureNoBuildToolConflicts,
  getJavaFilePathOfTextDocument,
  getJavaSDKInfo,
  getTriggerFiles,
  isPrefix,
  makeRandomHexString,
  prepareExecutable,
} from './stripeJavaLanguageClient/utils';
import {
  CloseAction,
  ErrorAction,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  Trace,
} from 'vscode-languageclient';
import {
  ExtensionContext,
  OutputChannel,
  RelativePattern,
  Uri,
  commands,
  window,
  workspace,
} from 'vscode';
import {OSType, getOSType} from './utils';
import {StandardLanguageClient} from './stripeJavaLanguageClient/standardLanguageClient';
import {SyntaxLanguageClient} from './stripeJavaLanguageClient/syntaxLanguageClient';
import {Telemetry} from './telemetry';
import {registerClientProviders} from './stripeJavaLanguageClient/providerDispatcher';

const REQUIRED_DOTNET_RUNTIME_VERSION = '5.0';
const REQUIRED_JDK_VERSION = 11;

const syntaxClient: SyntaxLanguageClient = new SyntaxLanguageClient();
const standardClient: StandardLanguageClient = new StandardLanguageClient();

export let javaServerMode =
  workspace.getConfiguration().get('java.server.launchMode') || ServerMode.HYBRID;

export class StripeLanguageClient {
  static async activate(
    context: ExtensionContext,
    serverOptions: ServerOptions,
    telemetry: Telemetry,
  ) {
    const outputChannel = window.createOutputChannel('Stripe Language Client');

    // start the csharp server if this is a dotnet project
    const dotnetProjectFile = await this.getDotnetProjectFiles();
    if (dotnetProjectFile.length > 0) {
      this.activateDotNetServer(context, outputChannel, dotnetProjectFile[0], telemetry);
      return;
    }

    const javaFiles = await this.getJavaProjectFiles();
    if (javaFiles.length > 0) {
      const jdkInfo = await getJavaSDKInfo(context, outputChannel);
      if (jdkInfo.javaVersion < REQUIRED_JDK_VERSION) {
        outputChannel.appendLine(
          `Minimum JDK version required is ${REQUIRED_JDK_VERSION}. Please update the java.home setup in VSCode user settings.`,
        );
        return;
      }
      this.activateJavaServer(context, jdkInfo, outputChannel, javaFiles[0], telemetry);
      return;
    }

    this.activateUniversalServer(context, outputChannel, serverOptions, telemetry);
  }

  static activateUniversalServer(
    context: ExtensionContext,
    outputChannel: OutputChannel,
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
        // {scheme: 'file', language: 'java'},
        {scheme: 'file', language: 'php'},
        {scheme: 'file', language: 'python'},
        {scheme: 'file', language: 'ruby'},
      ],
      synchronize: {
        fileEvents: workspace.createFileSystemWatcher('**/.clientrc'),
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
    context: ExtensionContext,
    outputChannel: OutputChannel,
    projectFile: string,
    telemetry: Telemetry,
  ) {
    outputChannel.appendLine('Detected C# Project file: ' + projectFile);

    // Applie Silicon is not supported for dotnet < 6.0:
    // https://github.com/dotnet/core/issues/4879#issuecomment-729046912
    if (getOSType() === OSType.macOSarm) {
      outputChannel.appendLine(
        `.NET runtime v${REQUIRED_DOTNET_RUNTIME_VERSION} is not supported for M1`,
      );
      telemetry.sendEvent('dotnetRuntimeAcquisitionSkippedForM1');
      return;
    }

    const result = await commands.executeCommand<{dotnetPath: string}>('dotnet.acquire', {
      version: REQUIRED_DOTNET_RUNTIME_VERSION,
      requestingExtensionId: 'stripe.vscode-stripe',
    });

    if (!result) {
      outputChannel.appendLine(
        `Failed to install .NET runtime v${REQUIRED_DOTNET_RUNTIME_VERSION}. Unable to start language server`,
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
        fileEvents: workspace.createFileSystemWatcher('**/*.cs'),
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

  static async activateJavaServer(
    context: ExtensionContext,
    jdkInfo: JDKInfo,
    outputChannel: OutputChannel,
    projectFile: string,
    telemetry: Telemetry,
  ) {
    outputChannel.appendLine('Detected Java Project file: ' + projectFile);

    let storagePath = context.storagePath;
    if (!storagePath) {
      storagePath = path.resolve(os.tmpdir(), 'vscodesws_' + makeRandomHexString(5));
    }

    const workspacePath = path.resolve(storagePath + '/jdt_ws');
    const syntaxServerWorkspacePath = path.resolve(storagePath + '/ss_ws');

    const isWorkspaceTrusted = (workspace as any).isTrusted; // TODO: use workspace.isTrusted directly when other clients catch up to adopt 1.56.0
    if (isWorkspaceTrusted !== undefined && !isWorkspaceTrusted) {
      // keep compatibility for old engines < 1.56.0
      javaServerMode = ServerMode.LIGHTWEIGHT;
    }
    commands.executeCommand('setContext', 'java:serverMode', javaServerMode);
    const isDebugModeByClientPort =
      !!process.env[SYNTAXLS_CLIENT_PORT] || !!process.env[JDTLS_CLIENT_PORT];
    const requireSyntaxServer =
      javaServerMode !== ServerMode.STANDARD &&
      (!isDebugModeByClientPort || !!process.env[SYNTAXLS_CLIENT_PORT]);
    const requireStandardServer =
      javaServerMode !== ServerMode.LIGHTWEIGHT &&
      (!isDebugModeByClientPort || !!process.env[JDTLS_CLIENT_PORT]);

    const triggerFiles = getTriggerFiles();

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
      // Register the server for java
      documentSelector: [{scheme: 'file', language: 'java'}],
      synchronize: {
        configurationSection: ['java', 'editor.insertSpaces', 'editor.tabSize'],
      },
      initializationOptions: {
        extendedClientCapabilities: {
          classFileContentsSupport: true,
          clientHoverProvider: true,
          clientDocumentSymbolProvider: true,
          shouldLanguageServerExitOnShutdown: true,
        },
        triggerFiles,
      },
      revealOutputChannelOn: 4, // never
      errorHandler: {
        error: (error, message, count) => {
          console.log(message);
          console.log(error);

          return ErrorAction.Continue;
        },
        closed: () => CloseAction.DoNotRestart,
      },
    };

    if (requireSyntaxServer) {
      this.startSyntaxServer(
        context,
        jdkInfo,
        clientOptions,
        syntaxServerWorkspacePath,
        outputChannel,
      );
    }

    registerClientProviders(context);

    if (requireStandardServer) {
      await this.startStandardServer(context, jdkInfo, clientOptions, workspacePath, outputChannel);
    }

    outputChannel.appendLine('Establishing connection with Java lang service');
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
    const workspaceFolders = workspace.workspaceFolders;
    if (!workspaceFolders) {
      return [];
    }

    const projectFiles = await Promise.all(
      workspaceFolders.map(async (w) => {
        const workspacePath = w.uri.fsPath;

        // First look for solutions files. We only expect one solutions file to be present in a workspace.
        const pattern = new RelativePattern(workspacePath, '**/*.sln');

        // Files and folders to exclude
        // There may be more we want to exclude but starting with the same set omnisharp uses:
        // https://github.com/OmniSharp/omnisharp-vscode/blob/master/src/omnisharp/launcher.ts#L66
        const exclude = '{**/node_modules/**,**/.git/**,**/bower_components/**}';
        const sln = await workspace.findFiles(pattern, exclude, 1);
        if (sln && sln.length === 1) {
          return sln[0].fsPath;
        } else {
          // If there was no solutions file, look for a csproj file.
          const pattern = new RelativePattern(workspacePath, '**/*.csproj');
          const csproj = await workspace.findFiles(pattern, exclude, 1);
          if (csproj && csproj.length === 1) {
            return csproj[0].fsPath;
          }
        }
      }),
    );

    return projectFiles.filter((file): file is string => Boolean(file));
  }

  static async getJavaProjectFiles() {
    const openedJavaFiles = [];
    if (!window.activeTextEditor) {
      return [];
    }

    const activeJavaFile = getJavaFilePathOfTextDocument(window.activeTextEditor.document);
    if (activeJavaFile) {
      openedJavaFiles.push(Uri.file(activeJavaFile).toString());
    }

    if (!workspace.workspaceFolders) {
      return openedJavaFiles;
    }

    await Promise.all(
      workspace.workspaceFolders.map(async (rootFolder) => {
        if (rootFolder.uri.scheme !== 'file') {
          return;
        }

        const rootPath = path.normalize(rootFolder.uri.fsPath);
        if (activeJavaFile && isPrefix(rootPath, activeJavaFile)) {
          return;
        }

        for (const textEditor of window.visibleTextEditors) {
          const javaFileInTextEditor = getJavaFilePathOfTextDocument(textEditor.document);
          if (javaFileInTextEditor && isPrefix(rootPath, javaFileInTextEditor)) {
            openedJavaFiles.push(Uri.file(javaFileInTextEditor).toString());
            return;
          }
        }

        for (const textDocument of workspace.textDocuments) {
          const javaFileInTextDocument = getJavaFilePathOfTextDocument(textDocument);
          if (javaFileInTextDocument && isPrefix(rootPath, javaFileInTextDocument)) {
            openedJavaFiles.push(Uri.file(javaFileInTextDocument).toString());
            return;
          }
        }

        const javaFilesUnderRoot: Uri[] = await workspace.findFiles(
          new RelativePattern(rootFolder, '*.java'),
          undefined,
          1,
        );
        for (const javaFile of javaFilesUnderRoot) {
          if (isPrefix(rootPath, javaFile.fsPath)) {
            openedJavaFiles.push(javaFile.toString());
            return;
          }
        }

        const javaFilesInCommonPlaces: Uri[] = await workspace.findFiles(
          new RelativePattern(rootFolder, '{src, test}/**/*.java'),
          undefined,
          1,
        );
        for (const javaFile of javaFilesInCommonPlaces) {
          if (isPrefix(rootPath, javaFile.fsPath)) {
            openedJavaFiles.push(javaFile.toString());
            return;
          }
        }
      }),
    );

    return openedJavaFiles;
  }

  static startSyntaxServer(
    context: ExtensionContext,
    jdkInfo: JDKInfo,
    clientOptions: LanguageClientOptions,
    syntaxServerWorkspacePath: string,
    outputChannel: OutputChannel,
  ) {
    syntaxClient.initialize(
      outputChannel,
      clientOptions,
      prepareExecutable(jdkInfo, syntaxServerWorkspacePath, context, true),
    );
    syntaxClient.start();
  }

  static async startStandardServer(
    context: ExtensionContext,
    jdkInfo: JDKInfo,
    clientOptions: LanguageClientOptions,
    workspacePath: string,
    outputChannel: OutputChannel,
  ) {
    if (standardClient.getClientStatus() !== ClientStatus.Uninitialized) {
      return;
    }

    const checkConflicts: boolean = await ensureNoBuildToolConflicts(context, outputChannel);
    if (!checkConflicts) {
      return;
    }

    if (javaServerMode === ServerMode.LIGHTWEIGHT) {
      // Before standard server is ready, we are in hybrid.
      javaServerMode = ServerMode.HYBRID;
    }

    await standardClient.initialize(context, jdkInfo, clientOptions, workspacePath, outputChannel);
    standardClient.start();
  }
}

export async function getActiveJavaLanguageClient(): Promise<LanguageClient | undefined> {
  let languageClient: LanguageClient | undefined;

  if (javaServerMode === ServerMode.STANDARD) {
    languageClient = standardClient.getClient();
  } else {
    languageClient = syntaxClient.getClient();
  }

  if (!languageClient) {
    return undefined;
  }

  await languageClient.onReady();

  return languageClient;
}
