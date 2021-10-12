/* eslint-disable no-warning-comments */
/* eslint-disable no-sync */
import * as fs from 'fs';
import * as glob from 'glob';
import * as net from 'net';
import * as path from 'path';
import {DEBUG_VSCODE_JAVA, JDKInfo, deleteDirectory, ensureExists, getJavaEncoding, getTimestamp} from './utils';
import {Executable, ExecutableOptions, StreamInfo} from 'vscode-languageclient';
import {ExtensionContext, OutputChannel} from 'vscode';


declare var v8debug: any;
const DEBUG = typeof v8debug === 'object' || startedInDebugMode();
const javaServerPath = '../out/src/stripeJavaLanguageServer'; // TODO: need to move to dist folders at release

export function prepareExecutable(
  jdkInfo: JDKInfo,
  workspacePath: string,
  context: ExtensionContext,
  isSyntaxServer: boolean,
  outputChannel: OutputChannel,
): Executable {
  const executable: Executable = Object.create(null);
  const options: ExecutableOptions = Object.create(null);
  options.env = Object.assign({syntaxserver: isSyntaxServer}, process.env);
  executable.options = options;
  executable.command = path.resolve(jdkInfo.javaHome + '/bin/java');
  executable.args = prepareParams(jdkInfo, workspacePath, context, isSyntaxServer);
  outputChannel.appendLine(`Starting Java server with: ${executable.command} ${executable.args.join(' ')}`);
  return executable;
}

export function awaitServerConnection(port: string, outputChannel: OutputChannel): Thenable<StreamInfo> {
  const addr = parseInt(port, 10);
  return new Promise((res, rej) => {
    const server = net.createServer((stream) => {
      server.close();
      outputChannel.appendLine('JDT LS connection established on port ' + addr);
      res({reader: stream, writer: stream});
    });
    server.on('error', rej);
    server.listen(addr, () => {
      server.removeListener('error', rej);
      outputChannel.appendLine('Awaiting JDT LS connection on port ' + addr);
    });
    return server;
  });
}

function prepareParams(
  jdkInfo: JDKInfo,
  workspacePath: string,
  context: ExtensionContext,
  isSyntaxServer: boolean,
): string[] {
  const params: string[] = [];

  if (DEBUG) {
    const port = isSyntaxServer ? 1047 : 1046;
    params.push(`-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=${port},quiet=y`);
  }

  if (jdkInfo.javaVersion > 8) {
    params.push(
      '--add-modules=ALL-SYSTEM',
      '--add-opens',
      'java.base/java.util=ALL-UNNAMED',
      '--add-opens',
      'java.base/java.lang=ALL-UNNAMED',
    );
  }

  params.push(
    '-Declipse.application=org.eclipse.jdt.ls.core.id1',
    '-Dosgi.bundles.defaultStartLevel=4',
    '-Declipse.product=org.eclipse.jdt.ls.core.product',
  );

  if (DEBUG) {
    params.push('-Dlog.level=ALL');
  }

  const encodingKey = '-Dfile.encoding=';
  params.push(encodingKey + getJavaEncoding());

  const serverHome: string = path.resolve(__dirname, javaServerPath);
  const launchersFound: Array<string> = glob.sync('**/plugins/org.eclipse.equinox.launcher_*.jar', {
    cwd: serverHome,
  });

  if (launchersFound.length) {
    params.push('-jar');
    params.push(path.resolve(serverHome, launchersFound[0]));
  } else {
    return [];
  }

  // select configuration directory according to OS
  let configDir = isSyntaxServer ? 'config_ss_win' : 'config_win';
  if (process.platform === 'darwin') {
    configDir = isSyntaxServer ? 'config_ss_mac' : 'config_mac';
  } else if (process.platform === 'linux') {
    configDir = isSyntaxServer ? 'config_ss_linux' : 'config_linux';
  }
  params.push('-configuration');
  if (startedFromSources()) {
    // Dev Mode: keep the config.ini in the installation location
    console.log(
      `Starting jdt.ls ${isSyntaxServer ? '(syntax)' : '(standard)'} from vscode-java sources`,
    );
    params.push(path.resolve(__dirname, javaServerPath, configDir));
  } else {
    params.push(resolveConfiguration(context, configDir));
  }
  params.push('-data');
  params.push(workspacePath);
  return params;
}

function resolveConfiguration(context: ExtensionContext, configDir: string) {
  ensureExists(context.globalStoragePath);
  const extensionPath = path.resolve(context.extensionPath, 'package.json');
  const packageFile = JSON.parse(fs.readFileSync(extensionPath, 'utf8'));
  let version;
  if (packageFile) {
    version = packageFile.version;
  } else {
    version = '0.0.0';
  }
  let configuration = path.resolve(context.globalStoragePath, version);
  ensureExists(configuration);
  configuration = path.resolve(configuration, configDir);
  ensureExists(configuration);
  const configIniName = 'config.ini';
  const configIni = path.resolve(configuration, configIniName);
  const ini = path.resolve(__dirname, javaServerPath, configDir, configIniName);
  if (!fs.existsSync(configIni)) {
    fs.copyFileSync(ini, configIni);
  } else {
    const configIniTime = getTimestamp(configIni);
    const iniTime = getTimestamp(ini);
    if (iniTime > configIniTime) {
      deleteDirectory(configuration);
      resolveConfiguration(context, configDir);
    }
  }
  return configuration;
}

function startedInDebugMode(): boolean {
  const args = (process as any).execArgv as string[];
  return hasDebugFlag(args);
}

function startedFromSources(): boolean {
  return process.env[DEBUG_VSCODE_JAVA] === 'true';
}

// exported for tests
export function hasDebugFlag(args: string[]): boolean {
  if (args) {
    // See https://nodejs.org/en/docs/guides/debugging-getting-started/
    return args.some((arg) => /^--inspect/.test(arg) || /^--debug/.test(arg));
  }
  return false;
}
