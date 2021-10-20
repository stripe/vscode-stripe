/* eslint-disable no-warning-comments */
/* eslint-disable no-sync */
/**
 * Inspired by https://github.com/redhat-developer/vscode-java/blob/master/src/javaServerStarter.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import {Executable, ExecutableOptions} from 'vscode-languageclient';
import {ExtensionContext, OutputChannel} from 'vscode';
import {
  JDKInfo,
  checkPathExists,
  deleteDirectory,
  ensureExists,
  getJavaEncoding,
  getServerLauncher,
  getTimestamp,
  startedFromSources,
  startedInDebugMode,
} from './utils';
import {Telemetry} from '../telemetry';

export const javaServerPath = '../out/src/stripeJavaLanguageServer'; // TODO: need to move to dist folders at release

export function prepareExecutable(
  jdkInfo: JDKInfo,
  workspacePath: string,
  context: ExtensionContext,
  isSyntaxServer: boolean,
  outputChannel: OutputChannel,
  telemetry: Telemetry,
): Executable {
  try {
    const executable: Executable = Object.create(null);
    const options: ExecutableOptions = Object.create(null);
    options.env = Object.assign({syntaxserver: isSyntaxServer}, process.env);
    executable.options = options;
    executable.command = path.resolve(jdkInfo.javaHome + '/bin/java');
    executable.args = prepareParams(jdkInfo, workspacePath, context, isSyntaxServer, outputChannel, telemetry);
    console.log(`Starting Java server with: ${executable.command} ${executable.args.join(' ')}`);
    return executable;
  } catch (e) {
    const serverType = isSyntaxServer ? 'Syntax' : 'Standard';
    throw new Error(`Failed to start Java ${serverType} server. ${e}`);
  }
}

/**
 * See https://www.eclipse.org/community/eclipse_newsletter/2017/may/article4.php
 * for required paramters to run the Eclipse JDT server
 */
export function prepareParams(
  jdkInfo: JDKInfo,
  workspacePath: string,
  context: ExtensionContext,
  isSyntaxServer: boolean,
  outputChannel: OutputChannel,
  telemetry: Telemetry,
): string[] {
  const params: string[] = [];
  const inDebug = startedInDebugMode();

  if (inDebug) {
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

  if (inDebug) {
    params.push('-Dlog.level=ALL');
  }

  const encodingKey = '-Dfile.encoding=';
  params.push(encodingKey + getJavaEncoding());

  const serverHome: string = path.resolve(__dirname, javaServerPath);
  const launchersFound: Array<string> = getServerLauncher(serverHome);

  if (launchersFound && launchersFound.length) {
    params.push('-jar');
    params.push(path.resolve(serverHome, launchersFound[0]));
  } else {
   throw new Error('Server jar not found');
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
    // dev mode
    params.push(path.resolve(__dirname, javaServerPath, configDir));
  } else {
    const config = resolveConfiguration(context, configDir, outputChannel, telemetry);
    if (config) {
      params.push(config);
    } else {
      throw new Error('Failed to get server configuration file.');
    }
  }

  params.push('-data');
  params.push(workspacePath);

  return params;
}

export function resolveConfiguration(
  context: ExtensionContext,
  configDir: string,
  outputChannel: OutputChannel,
  telemetry: Telemetry
): string {
  ensureExists(context.globalStoragePath);
  let version = '0.0.0';
  try {
    const extensionPath = path.resolve(context.extensionPath, 'package.json');
    const packageFile = JSON.parse(fs.readFileSync(extensionPath, 'utf8'));
    if (packageFile) {
      version = packageFile.version;
    }
  } catch {
    outputChannel.appendLine('Cannot locate package.json to parse for extension version. Default to 0.0.0');
    telemetry.sendEvent('cannotParseForExtensionVersion');
  }

  let configuration = path.resolve(context.globalStoragePath, version);
  ensureExists(configuration);
  configuration = path.resolve(configuration, configDir);
  ensureExists(configuration);

  const configIniName = 'config.ini';
  const configIni = path.resolve(configuration, configIniName);
  const ini = path.resolve(__dirname, javaServerPath, configDir, configIniName);
  if (!checkPathExists(configIni)) {
    fs.copyFileSync(ini, configIni);
  } else {
    const configIniTime = getTimestamp(configIni);
    const iniTime = getTimestamp(ini);
    if (iniTime > configIniTime) {
      deleteDirectory(configuration);
      resolveConfiguration(context, configDir, outputChannel, telemetry);
    }
  }

  return configuration;
}

