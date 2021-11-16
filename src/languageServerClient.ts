/* eslint-disable no-warning-comments */
import * as os from 'os';
import * as path from 'path';
import {
  ACTIVE_BUILD_TOOL_STATE,
  ClientStatus,
  ServerMode,
  getJavaFilePathOfTextDocument,
  getJavaServerLaunchMode,
  hasNoBuildToolConflict,
  isPrefix,
  makeRandomHexString,
} from './stripeJavaLanguageClient/utils';
import {
  CloseAction,
  Emitter,
  ErrorAction,
  LanguageClientOptions,
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
import {
  JDKInfo,
  REQUIRED_JDK_VERSION,
  STRIPE_JAVA_HOME,
  getJavaSDKInfo
} from './stripeJavaLanguageClient/javaRuntimesUtils';
import {LanguageClient, ServerOptions} from 'vscode-languageclient/node';
import {OSType, getOSType} from './utils';
import {Commands} from './stripeJavaLanguageClient/commands';
import {StandardLanguageClient} from './stripeJavaLanguageClient/standardLanguageClient';
import {SyntaxLanguageClient} from './stripeJavaLanguageClient/syntaxLanguageClient';
import {Telemetry} from './telemetry';
import {prepareExecutable} from './stripeJavaLanguageClient/javaServerStarter';
import {registerHoverProvider} from './stripeJavaLanguageClient/hoverProvider';

const REQUIRED_DOTNET_RUNTIME_VERSION = '5.0';

const syntaxClient: SyntaxLanguageClient = new SyntaxLanguageClient();
const standardClient: StandardLanguageClient = new StandardLanguageClient();
const onDidServerModeChangeEmitter: Emitter<ServerMode> = new Emitter<ServerMode>();

export let javaServerMode: ServerMode;

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

    // start the java server if this is a java project
    const javaFiles = await this.getJavaProjectFiles();
    if (javaFiles.length > 0) {
      const jdkInfo = await getJavaSDKInfo(context, outputChannel);
      if (jdkInfo.javaVersion < REQUIRED_JDK_VERSION) {
        outputChannel.appendLine(
          `Minimum JDK version required for Java API Reference at code hover is ${REQUIRED_JDK_VERSION}. Please update the ${STRIPE_JAVA_HOME} variable in user settings.`,
        );
        telemetry.sendEvent('doesNotMeetRequiredJdkVersion');
        return;
      }
      this.activateJavaServer(context, jdkInfo, outputChannel, javaFiles, telemetry);
      return;
    }

    // start the universal server for all other languages
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
    projectFiles: string[],
    telemetry: Telemetry,
  ) {
    outputChannel.appendLine('Detected Java Project file: ' + projectFiles[0]);

    let storagePath = context.storagePath;
    if (!storagePath) {
      storagePath = path.resolve(os.tmpdir(), 'vscodesws_' + makeRandomHexString(5));
    }

    const workspacePath = path.resolve(storagePath + '/jdt_ws');
    const syntaxServerWorkspacePath = path.resolve(storagePath + '/ss_ws');

    javaServerMode = getJavaServerLaunchMode();
    commands.executeCommand('setContext', 'java:serverMode', javaServerMode);
    const requireSyntaxServer = javaServerMode !== ServerMode.STANDARD;
    const requireStandardServer = javaServerMode !== ServerMode.LIGHTWEIGHT;

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
        projectFiles,
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
      try {
        await this.startSyntaxServer(
          clientOptions,
          prepareExecutable(jdkInfo, syntaxServerWorkspacePath, context, true, outputChannel, telemetry),
          outputChannel,
          telemetry,
        );
      } catch (e) {
        outputChannel.appendLine(`${e}`);
        telemetry.sendEvent('syntaxJavaServerFailedToStart');
      }
    }

    // handle server mode changes from syntax to standard
    this.registerSwitchJavaServerModeCommand(
      context,
      jdkInfo,
      clientOptions,
      workspacePath,
      outputChannel,
      telemetry
    );

    onDidServerModeChangeEmitter.event((event: ServerMode) => {
      if (event === ServerMode.STANDARD) {
        syntaxClient.stop();
      }
      commands.executeCommand('setContext', 'java:serverMode', event);
    });

    // register hover provider
    registerHoverProvider(context);

    if (requireStandardServer) {
      try {
        await this.startStandardServer(
          context,
          clientOptions,
          prepareExecutable(jdkInfo, workspacePath, context, false, outputChannel, telemetry),
          outputChannel,
          telemetry,
        );
      } catch (e) {
        outputChannel.appendLine(`${e}`);
        telemetry.sendEvent('standardJavaServerFailedToStart');
      }
    }
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
    let activeJavaFile: string | undefined;

    if (window.activeTextEditor) {
      activeJavaFile = getJavaFilePathOfTextDocument(window.activeTextEditor.document);
      if (activeJavaFile) {
        openedJavaFiles.push(Uri.file(activeJavaFile).toString());
      }
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

  static async startSyntaxServer(
    clientOptions: LanguageClientOptions,
    serverOptions: ServerOptions,
    outputChannel: OutputChannel,
    telemetry: Telemetry,
  ) {
    await syntaxClient.initialize(clientOptions, serverOptions);
    syntaxClient.start();
    outputChannel.appendLine('Java language service (syntax) is running.');
    telemetry.sendEvent('syntaxJavaServerStarted');
  }

  static async startStandardServer(
    context: ExtensionContext,
    clientOptions: LanguageClientOptions,
    serverOptions: ServerOptions,
    outputChannel: OutputChannel,
    telemetry: Telemetry,
  ) {
    if (standardClient.getClientStatus() !== ClientStatus.Uninitialized) {
      return;
    }

    const checkConflicts: boolean = await hasNoBuildToolConflict(context);
    if (!checkConflicts) {
      outputChannel.appendLine(`Build tool conflict detected in workspace. Please set '${ACTIVE_BUILD_TOOL_STATE}' to either maven or gradle.`);
      telemetry.sendEvent('standardJavaServerHasBuildToolConflict');
      return;
    }

    if (javaServerMode === ServerMode.LIGHTWEIGHT) {
      // Before standard server is ready, we are in hybrid.
      javaServerMode = ServerMode.HYBRID;
    }

    await standardClient.initialize(clientOptions, serverOptions);
    standardClient.start();

    outputChannel.appendLine('Java language service (standard) is running.');
    telemetry.sendEvent('standardJavaServerStarted');
  }

  static async registerSwitchJavaServerModeCommand(
    context: ExtensionContext,
    jdkInfo: JDKInfo,
    clientOptions: LanguageClientOptions,
    workspacePath: string,
    outputChannel: OutputChannel,
    telemetry: Telemetry,
  ) {
    if ((await commands.getCommands()).includes(Commands.SWITCH_SERVER_MODE)) {
      return;
    }

    /**
     * Command to switch the server mode. Currently it only supports switch from lightweight to standard.
     * @param force force to switch server mode without asking
     */
    commands.registerCommand(
      Commands.SWITCH_SERVER_MODE,
      async (switchTo: ServerMode, force: boolean = false) => {
        const isWorkspaceTrusted = (workspace as any).isTrusted;
        if (isWorkspaceTrusted !== undefined && !isWorkspaceTrusted) {
          // keep compatibility for old engines < 1.56.0
          const button = 'Manage Workspace Trust';
          const choice = await window.showInformationMessage(
            'For security concern, Java language server cannot be switched to Standard mode in untrusted workspaces.',
            button,
          );
          if (choice === button) {
            commands.executeCommand('workbench.action.manageTrust');
          }
          return;
        }

        const clientStatus: ClientStatus = standardClient.getClientStatus();
        if (clientStatus === ClientStatus.Starting || clientStatus === ClientStatus.Started) {
          return;
        }

        if (javaServerMode === switchTo || javaServerMode === ServerMode.STANDARD) {
          return;
        }

        let choice: string;
        if (force) {
          choice = 'Yes';
        } else {
          choice = await window.showInformationMessage(
            'Are you sure you want to switch the Java language server to Standard mode?',
            'Yes',
            'No',
          ) || 'No';
        }

        if (choice === 'Yes') {
          telemetry.sendEvent('switchToStandardMode');

          try {
            this.startStandardServer(
              context,
              clientOptions,
              prepareExecutable(jdkInfo, workspacePath, context, false, outputChannel, telemetry),
              outputChannel,
              telemetry,
            );
          } catch (e) {
            outputChannel.appendLine(`${e}`);
            telemetry.sendEvent('failedToSwitchToStandardMode');
          }
        }
      },
    );
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

export function updateServerMode(serverMode: ServerMode) {
  javaServerMode = serverMode;
  console.log('server mode changed to ' + serverMode);
}
