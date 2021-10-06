/* eslint-disable no-warning-comments */
import * as cp from 'child_process';
import * as fse from 'fs-extra';
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

const expandHomeDir = require('expand-home-dir');
const isWindows: boolean = process.platform.indexOf('win') === 0;
const JAVAC_FILENAME = 'javac' + (isWindows ? '.exe' : '');
const JAVA_FILENAME = 'java' + (isWindows ? '.exe' : '');

const REQUIRED_DOTNET_RUNTIME_VERSION = '5.0';
const REQUIRED_JDK_VERSION = 11;
const IS_WORKSPACE_JDK_ALLOWED = 'java.ls.isJdkAllowed';

export interface JavaRuntime {
    home: string;
    version: number;
    sources: string[];
}

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
      return;
    }

    const javaFiles = await this.getJavaProjectFiles();
    if (javaFiles.length > 0) {
      const meetsJavaReq = this.checkJavaServerRequirement(context, outputChannel);
      if (!meetsJavaReq) {
        outputChannel.appendLine('Minimum JDK version required is 11. Please update the java.home setup in VSCode user settings.');
        return;
      }
      this.activateJavaServer(outputChannel);
      return;
    }

    this.activateUniversalServer(context, outputChannel, serverOptions, telemetry);
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
        // {scheme: 'file', language: 'java'},
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

    // Applie Silicon is not supported for dotnet < 6.0:
    // https://github.com/dotnet/core/issues/4879#issuecomment-729046912
    if (getOSType() === OSType.macOSarm) {
      outputChannel.appendLine(`.NET runtime v${REQUIRED_DOTNET_RUNTIME_VERSION} is not supported for M1`);
      telemetry.sendEvent('dotnetRuntimeAcquisitionSkippedForM1');
      return;
    }

    const result = await vscode.commands.executeCommand<{dotnetPath: string}>('dotnet.acquire', {
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

  static activateJavaServer(outputChannel: vscode.OutputChannel) {
    outputChannel.appendLine('Establishing connection with java lang server.');
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

  static async getJavaProjectFiles() {
    const openedJavaFiles = [];
    if (!vscode.window.activeTextEditor) {
      return [];
    }

    const activeJavaFile = this.getJavaFilePathOfTextDocument(vscode.window.activeTextEditor.document);
    if (activeJavaFile) {
      openedJavaFiles.push(vscode.Uri.file(activeJavaFile).toString());
    }

    if (!vscode.workspace.workspaceFolders) {
      return openedJavaFiles;
    }

    await Promise.all(vscode.workspace.workspaceFolders.map(async (rootFolder) => {
      if (rootFolder.uri.scheme !== 'file') {
        return;
      }

      const rootPath = path.normalize(rootFolder.uri.fsPath);
      if (activeJavaFile && this.isPrefix(rootPath, activeJavaFile)) {
        return;
      }

      for (const textEditor of vscode.window.visibleTextEditors) {
        const javaFileInTextEditor = this.getJavaFilePathOfTextDocument(textEditor.document);
        if (javaFileInTextEditor && this.isPrefix(rootPath, javaFileInTextEditor)) {
          openedJavaFiles.push(vscode.Uri.file(javaFileInTextEditor).toString());
          return;
        }
      }

      for (const textDocument of vscode.workspace.textDocuments) {
        const javaFileInTextDocument = this.getJavaFilePathOfTextDocument(textDocument);
        if (javaFileInTextDocument && this.isPrefix(rootPath, javaFileInTextDocument)) {
          openedJavaFiles.push(vscode.Uri.file(javaFileInTextDocument).toString());
          return;
        }
      }

      const javaFilesUnderRoot: vscode.Uri[] = await vscode.workspace.findFiles(new vscode.RelativePattern(rootFolder, '*.java'), undefined, 1);
      for (const javaFile of javaFilesUnderRoot) {
        if (this.isPrefix(rootPath, javaFile.fsPath)) {
          openedJavaFiles.push(javaFile.toString());
          return;
        }
      }

      const javaFilesInCommonPlaces: vscode.Uri[] = await vscode.workspace.findFiles(new vscode.RelativePattern(rootFolder, '{src, test}/**/*.java'), undefined, 1);
      for (const javaFile of javaFilesInCommonPlaces) {
        if (this.isPrefix(rootPath, javaFile.fsPath)) {
          openedJavaFiles.push(javaFile.toString());
          return;
        }
      }
    }));

    return openedJavaFiles;
  }

  static getJavaFilePathOfTextDocument(document: vscode.TextDocument): string | undefined {
    if (document) {
      const resource = document.uri;
      if (resource.scheme === 'file' && resource.fsPath.endsWith('.java')) {
        return path.normalize(resource.fsPath);
      }
    }

    return undefined;
  }

  static isPrefix(parentPath: string, childPath: string): boolean {
    if (!childPath) {
      return false;
    }
    const relative = path.relative(parentPath, childPath);
    return !!relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  }

  static async checkJavaServerRequirement(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): Promise<boolean> {
    let source: string;
    let javaVersion: number = 0;
    let javaHome = await this.checkJavaPreferences(context) || '';
    if (javaHome) {
      source = `java.home variable defined in ${vscode.env.appName} settings`;
      javaHome = expandHomeDir(javaHome);
      if (!await fse.pathExists(javaHome)) {
          outputChannel.appendLine(`The ${source} points to a missing or inaccessible folder (${javaHome})`);
          return false;
      } else if (!await fse.pathExists(path.resolve(javaHome, 'bin', JAVAC_FILENAME))) {
          let msg: string;
          if (await fse.pathExists(path.resolve(javaHome, JAVAC_FILENAME))) {
              msg = `'bin' should be removed from the ${source} (${javaHome})`;
          } else {
              msg = `The ${source} (${javaHome}) does not point to a JDK.`;
          }
          outputChannel.appendLine(msg);
          return false;
      }
      javaVersion = await this.getJavaVersion(javaHome) || 0;
    }
    return javaVersion >= REQUIRED_JDK_VERSION;
  }

  static async checkJavaPreferences(context: vscode.ExtensionContext) {
    const allow = 'Allow';
    const disallow = 'Disallow';
    let inspect = vscode.workspace.getConfiguration().inspect<string>('java.home');
    let javaHome = inspect && inspect.workspaceValue;
    let isVerified = javaHome === undefined || javaHome === null;
    if (isVerified) {
      javaHome = vscode.workspace.getConfiguration('java').get('home');
    }
    const key = this.getKey(IS_WORKSPACE_JDK_ALLOWED, context.storagePath, javaHome);
    const globalState = context.globalState;
    if (!isVerified) {
      isVerified = globalState.get(key) || false;
      if (isVerified === undefined) {
        await vscode.window.showErrorMessage(`Do you allow this workspace to set the java.home variable? \n java.home: ${javaHome}`, disallow, allow).then(async (selection) => {
          if (selection === allow) {
            globalState.update(key, true);
          } else if (selection === disallow) {
            globalState.update(key, false);
            await vscode.workspace.getConfiguration().update('java.home', undefined, vscode.ConfigurationTarget.Workspace);
          }
        });
        isVerified = globalState.get(key) || false;
      }
    }

    if (!isVerified) {
      inspect = vscode.workspace.getConfiguration().inspect<string>('java.home');
      javaHome = inspect && inspect.globalValue;
    }

    return javaHome;
  }

  static async getJavaVersion(javaHome: string): Promise<number | undefined> {
    let javaVersion = await this.checkVersionInReleaseFile(javaHome);
    if (!javaVersion) {
        javaVersion = await this.checkVersionByCLI(javaHome);
    }
    return javaVersion;
  }

  /**
   * Get version by checking file JAVA_HOME/release
   */
  static async checkVersionInReleaseFile(javaHome: string): Promise<number> {
      const releaseFile = path.join(javaHome, 'release');

      try {
          const content = await fse.readFile(releaseFile);
          const regexp = /^JAVA_VERSION="(.*)"/gm;
          const match = regexp.exec(content.toString());
          if (!match) {
              return 0;
          }
          const majorVersion = this.parseMajorVersion(match[1]);
          return majorVersion;
      } catch (error) {
          // ignore
      }
      return 0;
  }

  /**
   * Get version by parsing `JAVA_HOME/bin/java -version`
   */
  static checkVersionByCLI(javaHome: string): Promise<number> {
      return new Promise((resolve, reject) => {
          const javaBin = path.join(javaHome, 'bin', JAVA_FILENAME);
          cp.execFile(javaBin, ['-version'], {}, (error: any, stdout: any, stderr: string) => {
              const regexp = /version "(.*)"/g;
              const match = regexp.exec(stderr);
              if (!match) {
                  return resolve(0);
              }
              const javaVersion = this.parseMajorVersion(match[1]);
              resolve(javaVersion);
          });
      });
  }

  static parseMajorVersion(version: string): number {
    if (!version) {
        return 0;
    }
    // Ignore '1.' prefix for legacy Java versions
    if (version.startsWith('1.')) {
        version = version.substring(2);
    }
    // look into the interesting bits now
    const regexp = /\d+/g;
    const match = regexp.exec(version);
    let javaVersion = 0;
    if (match) {
        javaVersion = parseInt(match[0], 10);
    }
    return javaVersion;
  }

  static getKey(prefix: string, storagePath: any, value: any) {
    const workspacePath = path.resolve(storagePath + '/jdt_ws');
    if (vscode.workspace.name !== undefined) {
      return `${prefix}::${workspacePath}::${value}`;
    } else {
      return `${prefix}::${value}`;
    }
  }
}

