/* eslint-disable no-sync */
import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import {
  ExtensionContext,
  TextDocument,
  Uri,
  workspace,
} from 'vscode';
import {
  Location,
  NotificationType,
  RequestType,
  TextDocumentPositionParams,
} from 'vscode-languageclient';
import javaPatterns from '../../config/api_ref/patterns_java.json';

export const ACTIVE_BUILD_TOOL_STATE = 'java.activeBuildTool';
export const DEBUG_VSCODE_JAVA = 'DEBUG_VSCODE_JAVA';
export const EXTENSION_NAME_STANDARD = 'stripeJavaLanguageServer (Standard)';
export const EXTENSION_NAME_SYNTAX = 'stripeJavaLanguageServer (Syntax)';
export const IMPORT_MAVEN = 'stripe.java.import.maven';
export const IMPORT_GRADLE = 'stripe.java.import.gradle';
export const LAUNCH_SERVER_MODE = 'stripe.java.server.mode';
export const JAVA_IMPORT_EXCLUSIONS = 'stripe.java.import.exclusions';

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

export function getJavaServerLaunchMode(): ServerMode {
  return workspace.getConfiguration().get(LAUNCH_SERVER_MODE) || ServerMode.HYBRID;
}

export async function hasNoBuildToolConflict(
  context: ExtensionContext,
): Promise<boolean> {
  const isMavenEnabled: boolean = workspace.getConfiguration().get<boolean>(IMPORT_MAVEN) || false;
  const isGradleEnabled: boolean = workspace.getConfiguration().get<boolean>(IMPORT_GRADLE) || false;
  if (isMavenEnabled && isGradleEnabled) {
    // user has both build tools enabled. check project build files
    if (!(await hasBuildToolConflicts())) {
      return true;
    }
    return false;
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
  const isMavenImporterEnabled: boolean = workspace.getConfiguration().get<boolean>(IMPORT_MAVEN) || false;
  const isGradleImporterEnabled: boolean = workspace.getConfiguration().get<boolean>(IMPORT_GRADLE) || false;
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
  const exclusions: string[] = workspace.getConfiguration().get<string[]>(JAVA_IMPORT_EXCLUSIONS) || [];
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
  const exclusions: string[] = workspace.getConfiguration().get<string[]>(JAVA_IMPORT_EXCLUSIONS) || [];
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
