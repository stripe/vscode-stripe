/* eslint-disable no-sync */
import * as cp from 'child_process';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as glob from 'glob';
import * as path from 'path';
import {
  ConfigurationTarget,
  ExtensionContext,
  OutputChannel,
  TextDocument,
  Uri,
  WorkspaceConfiguration,
  env,
  window,
  workspace,
} from 'vscode';
import {
  Location,
  NotificationType,
  RequestType,
  TextDocumentPositionParams,
} from 'vscode-languageclient';
import javaPatterns from '../../config/api_ref/patterns_java.json';

const expandHomeDir = require('expand-home-dir');

const isWindows: boolean = process.platform.indexOf('win') === 0;
const JAVAC_FILENAME = 'javac' + (isWindows ? '.exe' : '');
const JAVA_FILENAME = 'java' + (isWindows ? '.exe' : '');

export const ACTIVE_BUILD_TOOL_STATE = 'java.activeBuildTool';
export const DEBUG_VSCODE_JAVA = 'DEBUG_VSCODE_JAVA';
export const EXTENSION_NAME_STANDARD = 'stripeJavaLanguageServer (Standard)';
export const EXTENSION_NAME_SYNTAX = 'stripeJavaLanguageServer (Syntax)';
export const IS_WORKSPACE_JDK_ALLOWED = 'java.ls.isJdkAllowed';
export const STRIPE_JAVA_HOME = 'stripe.java.home';

export interface JDKInfo {
  javaHome: string;
  javaVersion: number;
}

export interface StatusReport {
  message: string;
  type: string;
}

export enum ClientStatus {
  Uninitialized = 'Uninitialized',
  Initialized = 'Initialized',
  Starting = 'Starting',
  Started = 'Started',
  Error = 'Error',
  Stopping = 'Stopping',
}

export enum ServerMode {
  STANDARD = 'Standard',
  LIGHTWEIGHT = 'LightWeight',
  HYBRID = 'Hybrid',
}

export namespace StatusNotification {
  export const type = new NotificationType<StatusReport>('language/status');
}

export interface FindLinksParams {
  type: string;
  position: TextDocumentPositionParams;
}

export interface LinkLocation extends Location {
  displayName: string;
  kind: string;
}

export namespace FindLinks {
  export const type = new RequestType<FindLinksParams, LinkLocation[], void>('java/findLinks');
}

export function getJavaConfiguration(): WorkspaceConfiguration {
  return workspace.getConfiguration('java');
}

export function getJavaServerLaunchMode(): ServerMode {
  return workspace.getConfiguration().get('java.server.launchMode') || ServerMode.HYBRID;
}

export async function hasNoBuildToolConflicts(
  context: ExtensionContext,
): Promise<boolean> {
  const isMavenEnabled: boolean =
    getJavaConfiguration().get<boolean>('import.maven.enabled') || false;
  const isGradleEnabled: boolean =
    getJavaConfiguration().get<boolean>('import.gradle.enabled') || false;
  if (isMavenEnabled && isGradleEnabled) {
    const activeBuildTool: string | undefined = context.workspaceState.get(ACTIVE_BUILD_TOOL_STATE);
    if (!activeBuildTool) {
      if (!(await hasBuildToolConflicts())) {
        return true;
      }
      return false;
    }
  }

  return true;
}

async function hasBuildToolConflicts(): Promise<boolean> {
  const projectConfigurationUris: Uri[] = await getBuildFilesInWorkspace();
  const projectConfigurationFsPaths: string[] = projectConfigurationUris.map((uri) => uri.fsPath);
  const eclipseDirectories = getDirectoriesByBuildFile(projectConfigurationFsPaths, [], '.project');
  // ignore the folders that already has .project file (already imported before)
  const gradleDirectories = getDirectoriesByBuildFile(
    projectConfigurationFsPaths,
    eclipseDirectories,
    '.gradle',
  );
  const gradleDirectoriesKts = getDirectoriesByBuildFile(
    projectConfigurationFsPaths,
    eclipseDirectories,
    '.gradle.kts',
  );
  gradleDirectories.concat(gradleDirectoriesKts);
  const mavenDirectories = getDirectoriesByBuildFile(
    projectConfigurationFsPaths,
    eclipseDirectories,
    'pom.xml',
  );
  return gradleDirectories.some((gradleDir) => {
    return mavenDirectories.includes(gradleDir);
  });
}

async function getBuildFilesInWorkspace(): Promise<Uri[]> {
  const buildFiles: Uri[] = [];
  const inclusionFilePatterns: string[] = getBuildFilePatterns();
  inclusionFilePatterns.push('**/.project');
  const inclusionFolderPatterns: string[] = getInclusionPatternsFromNegatedExclusion();
  // Since VS Code API does not support put negated exclusion pattern in findFiles(),
  // here we first parse the negated exclusion to inclusion and do the search.
  if (inclusionFilePatterns.length > 0 && inclusionFolderPatterns.length > 0) {
    buildFiles.push(
      ...(await workspace.findFiles(
        convertToGlob(inclusionFilePatterns, inclusionFolderPatterns),
        null,
      )),
    );
  }

  const inclusionBlob: string = convertToGlob(inclusionFilePatterns);
  const exclusionBlob: string = getExclusionBlob();
  if (inclusionBlob) {
    buildFiles.push(...(await workspace.findFiles(inclusionBlob, exclusionBlob)));
  }

  return buildFiles;
}

function getDirectoriesByBuildFile(
  inclusions: string[],
  exclusions: string[],
  fileName: string,
): string[] {
  return inclusions
    .filter((fsPath) => fsPath.endsWith(fileName))
    .map((fsPath) => {
      return path.dirname(fsPath);
    })
    .filter((inclusion) => {
      return !exclusions.includes(inclusion);
    });
}

export function getBuildFilePatterns(): string[] {
  const config = getJavaConfiguration();
  const isMavenImporterEnabled: boolean = config.get<boolean>('import.maven.enabled') || false;
  const isGradleImporterEnabled: boolean = config.get<boolean>('import.gradle.enabled') || false;
  const patterns: string[] = [];
  if (isMavenImporterEnabled) {
    patterns.push('**/pom.xml');
  }
  if (isGradleImporterEnabled) {
    patterns.push('**/*.gradle');
    patterns.push('**/*.gradle.kts');
  }

  return patterns;
}

export function getInclusionPatternsFromNegatedExclusion(): string[] {
  const config = getJavaConfiguration();
  const exclusions: string[] = config.get<string[]>('import.exclusions', []);
  const patterns: string[] = [];
  for (const exclusion of exclusions) {
    if (exclusion.startsWith('!')) {
      patterns.push(exclusion.substr(1));
    }
  }
  return patterns;
}

export function convertToGlob(filePatterns: string[], basePatterns?: string[]): string {
  if (!filePatterns || filePatterns.length === 0) {
    return '';
  }

  if (!basePatterns || basePatterns.length === 0) {
    return parseToStringGlob(filePatterns);
  }

  const patterns: string[] = [];
  for (const basePattern of basePatterns) {
    for (const filePattern of filePatterns) {
      patterns.push(path.join(basePattern, `/${filePattern}`).replace(/\\/g, '/'));
    }
  }
  return parseToStringGlob(patterns);
}

export function getExclusionBlob(): string {
  const config = getJavaConfiguration();
  const exclusions: string[] = config.get<string[]>('import.exclusions', []);
  const patterns: string[] = [];
  for (const exclusion of exclusions) {
    if (exclusion.startsWith('!')) {
      continue;
    }

    patterns.push(exclusion);
  }
  return parseToStringGlob(patterns);
}

function parseToStringGlob(patterns: string[]): string {
  if (!patterns || patterns.length === 0) {
    return '';
  }

  return `{${patterns.join(',')}}`;
}

export function ensureExists(folder: string) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
}

export function deleteDirectory(dir: string) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((child) => {
      const entry = path.join(dir, child);
      if (fs.lstatSync(entry).isDirectory()) {
        deleteDirectory(entry);
      } else {
        fs.unlinkSync(entry);
      }
    });
    fs.rmdirSync(dir);
  }
}

export function getTimestamp(file: string) {
  if (!fs.existsSync(file)) {
    return -1;
  }
  const stat = fs.statSync(file);
  return stat.mtimeMs;
}

// see https://github.com/redhat-developer/vscode-java/blob/master/src/extension.ts
export function makeRandomHexString(length: number) {
  const chars = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '6',
    '7',
    '8',
    '9',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
  ];
  let result = '';
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(chars.length * Math.random());
    result += chars[idx];
  }
  return result;
}

export function getJavaFilePathOfTextDocument(document: TextDocument): string | undefined {
  if (document) {
    const resource = document.uri;
    if (resource.scheme === 'file' && resource.fsPath.endsWith('.java')) {
      return path.normalize(resource.fsPath);
    }
  }

  return undefined;
}

export function isPrefix(parentPath: string, childPath: string): boolean {
  if (!childPath) {
    return false;
  }
  const relative = path.relative(parentPath, childPath);
  return !!relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

export async function getJavaSDKInfo(
  context: ExtensionContext,
  outputChannel: OutputChannel,
): Promise<JDKInfo> {
  let source: string;
  let javaVersion: number = 0;
  // get java.home from vscode settings config first
  let javaHome = await getJavaHomeFromConfig() || '';
  let sdkInfo = {javaVersion, javaHome};

  if (javaHome) {
    source = `${STRIPE_JAVA_HOME} variable defined in ${env.appName} settings`;
    javaHome = expandHomeDir(javaHome);
    if (!(await fse.pathExists(javaHome))) {
      outputChannel.appendLine(
        `The ${source} points to a missing or inaccessible folder (${javaHome})`,
      );
    } else if (!(await fse.pathExists(path.resolve(javaHome, 'bin', JAVAC_FILENAME)))) {
      let msg: string;
      if (await fse.pathExists(path.resolve(javaHome, JAVAC_FILENAME))) {
        msg = `'bin' should be removed from the ${source} (${javaHome})`;
      } else {
        msg = `The ${source} (${javaHome}) does not point to a JDK.`;
      }
      outputChannel.appendLine(msg);
    }
    javaVersion = (await getJavaVersion(javaHome)) || 0;
    sdkInfo = {javaHome, javaVersion};
  } else {
    // java.home not defined, search valid JDKs from env.JAVA_HOME, env.PATH, Registry(Window), Common directories
    sdkInfo = getJavaHomeFromEnvironment();
  }

  // update vscode java.home workspace value for fast access next time
  updateJavaHomeWorkspaceConfig(context, sdkInfo.javaHome);

  return sdkInfo;
}

function getJavaHomeFromConfig() {
  const inspect = workspace.getConfiguration().inspect<string>(STRIPE_JAVA_HOME);
  // workspace value takes precedence over global value
  const javaHome = inspect?.workspaceValue || inspect?.globalValue || '';
  return javaHome;
}

function getJavaHomeFromEnvironment(): JDKInfo {
  // TO-DO: DX6965
  return {javaHome: '', javaVersion: 0};
}

async function updateJavaHomeWorkspaceConfig(context: ExtensionContext, javaHome: string) {
  if (!javaHome) {
    return;
  }

  const allow = 'Allow';
  const disallow = 'Disallow';

  const key = getKey(IS_WORKSPACE_JDK_ALLOWED, context.storagePath, javaHome);
  const globalState = context.globalState;
  const allowWorkspaceEdit = globalState.get(key);

  if (allowWorkspaceEdit === undefined) {
    await window.showErrorMessage(
      `Do you allow this workspace to set the ${STRIPE_JAVA_HOME} variable? \n ${STRIPE_JAVA_HOME}: ${javaHome}`,
      disallow,
      allow,
    )
    .then(async (selection) => {
      if (selection === allow) {
        globalState.update(key, true);
        await workspace
          .getConfiguration()
          .update(STRIPE_JAVA_HOME, javaHome, ConfigurationTarget.Workspace);
      } else if (selection === disallow) {
        globalState.update(key, false);
        await workspace
          .getConfiguration()
          .update(STRIPE_JAVA_HOME, undefined, ConfigurationTarget.Workspace);
      }
    });
  } else if (allowWorkspaceEdit) {
    const inspect = workspace.getConfiguration().inspect<string>(STRIPE_JAVA_HOME);
    if (inspect?.workspaceValue !== javaHome) {
      await workspace.getConfiguration().update(STRIPE_JAVA_HOME, javaHome, ConfigurationTarget.Workspace);
    }
  }
}

async function getJavaVersion(javaHome: string): Promise<number | undefined> {
  let javaVersion = await checkVersionInReleaseFile(javaHome);
  if (!javaVersion) {
    javaVersion = await checkVersionByCLI(javaHome);
  }
  return javaVersion;
}

/**
 * Get version by checking file JAVA_HOME/release
 * see https://github.com/redhat-developer/vscode-java/blob/master/src/requirements.ts
 */
async function checkVersionInReleaseFile(javaHome: string): Promise<number> {
  const releaseFile = path.join(javaHome, 'release');

  try {
    const content = await fse.readFile(releaseFile);
    const regexp = /^JAVA_VERSION="(.*)"/gm;
    const match = regexp.exec(content.toString());
    if (!match) {
      return 0;
    }
    const majorVersion = parseMajorVersion(match[1]);
    return majorVersion;
  } catch (error) {
    // ignore
  }
  return 0;
}

/**
 * Get version by parsing `JAVA_HOME/bin/java -version`
 * see https://github.com/redhat-developer/vscode-java/blob/master/src/requirements.ts
 */
function checkVersionByCLI(javaHome: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const javaBin = path.join(javaHome, 'bin', JAVA_FILENAME);
    cp.execFile(javaBin, ['-version'], {}, (error: any, stdout: any, stderr: string) => {
      const regexp = /version "(.*)"/g;
      const match = regexp.exec(stderr);
      if (!match) {
        return resolve(0);
      }
      const javaVersion = parseMajorVersion(match[1]);
      resolve(javaVersion);
    });
  });
}

function parseMajorVersion(version: string): number {
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

function getKey(prefix: string, storagePath: any, value: any) {
  const workspacePath = path.resolve(storagePath + '/jdt_ws');
  if (workspace.name !== undefined) {
    return `${prefix}::${workspacePath}::${value}`;
  } else {
    return `${prefix}::${value}`;
  }
}

export function getJavaEncoding(): string {
  const config = workspace.getConfiguration();
  const languageConfig: any = config.get('[java]');
  let javaEncoding = null;
  if (languageConfig) {
    javaEncoding = languageConfig['files.encoding'];
  }
  if (!javaEncoding) {
    javaEncoding = config.get<string>('files.encoding', 'UTF-8');
  }
  return javaEncoding;
}

export function getJavaApiDocLink(namespace: string): string {
  const baseUrl = 'https://stripe.com/docs/api';
  const patterns = Object.entries(javaPatterns);
  const found = patterns.filter((item) => item[0] === namespace);
  if (found) {
    const apiUrl = found[0][1];
    return baseUrl + apiUrl;
  }
  return '';
 }

 export function getServerLauncher(serverHome: string): Array<string> {
  return glob.sync('**/plugins/org.eclipse.equinox.launcher_*.jar', {
    cwd: serverHome,
  });
}

export function checkPathExists(filepath: string) {
  return fs.existsSync(filepath);
}

export function startedInDebugMode(): boolean {
  const args = (process as any).execArgv as string[];
  if (args) {
    // See https://nodejs.org/en/docs/guides/debugging-getting-started/
    return args.some((arg) => /^--inspect/.test(arg) || /^--debug/.test(arg));
  }
  return false;
}

export function startedFromSources(): boolean {
  return process.env[DEBUG_VSCODE_JAVA] === 'true';
}
