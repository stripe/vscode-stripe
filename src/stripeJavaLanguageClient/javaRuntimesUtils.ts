/* eslint-disable max-depth */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-sync */

import * as _ from 'lodash';
import * as cp from 'child_process';
import * as fse from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import {ConfigurationTarget, ExtensionContext, OutputChannel, env, window, workspace} from 'vscode';

const expandHomeDir = require('expand-home-dir');
const WinReg = require('winreg-utf8');

const isWindows: boolean = process.platform.indexOf('win') === 0;
const isMac: boolean = process.platform.indexOf('darwin') === 0;
const isLinux: boolean = process.platform.indexOf('linux') === 0;

const JAVAC_FILENAME = 'javac' + (isWindows ? '.exe' : '');
const JAVA_FILENAME = 'java' + (isWindows ? '.exe' : '');

export const REQUIRED_JDK_VERSION = 11;
export const IS_WORKSPACE_JDK_ALLOWED = 'java.ls.isJdkAllowed';
export const STRIPE_JAVA_HOME = 'stripe.java.home';

export interface JDKInfo {
  javaHome: string;
  javaVersion: number;
}

interface JavaRuntime {
  javaHome: string;
  javaVersion: number;
  sources: string[];
}

export async function getJavaSDKInfo(
  context: ExtensionContext,
  outputChannel: OutputChannel,
): Promise<JDKInfo> {
  let source: string;
  let javaVersion: number = 0;
  // get java.home from vscode settings config first
  let javaHome = (await getJavaHomeFromConfig()) || '';
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
    sdkInfo = await getJavaHomeFromEnvironment();
  }

  // update vscode java.home workspace value for fast access next time
  if (sdkInfo.javaVersion >= REQUIRED_JDK_VERSION) {
    updateJavaHomeWorkspaceConfig(context, sdkInfo.javaHome);
  }

  return sdkInfo;
}

function getJavaHomeFromConfig() {
  const inspect = workspace.getConfiguration().inspect<string>(STRIPE_JAVA_HOME);
  const javaHome = inspect?.globalValue || '';
  return javaHome;
}

async function getJavaHomeFromEnvironment(): Promise<JDKInfo> {
  let javaVersion: number = 0;
  let javaHome = '';
  const javaRuntimes: JavaRuntime[] = [];
  const jdkMap = new Map<string, string[]>();

  updateJDKs(jdkMap, await fromEnv('JDK_HOME'), 'env.JDK_HOME');
  updateJDKs(jdkMap, await fromEnv('JAVA_HOME'), 'env.JAVA_HOME');
  updateJDKs(jdkMap, await fromPath(), 'env.PATH');
  updateJDKs(jdkMap, await fromWindowsRegistry(), 'WindowsRegistry');
  updateJDKs(jdkMap, await fromCommonPlaces(), 'DefaultLocation');

  for (const elem of jdkMap) {
    const javaHome = elem[0];
    const sources = elem[1];
    const javaVersion = await getJavaVersion(javaHome);
    if (javaVersion) {
      javaRuntimes.push({
        sources,
        javaHome,
        javaVersion,
      });
    } else {
      console.warn(`Unknown version of JDK ${javaHome}`);
    }
  }

  const validJdks = javaRuntimes.filter((r) => r.javaVersion >= REQUIRED_JDK_VERSION);
  if (validJdks.length > 0) {
    sortJdksBySource(validJdks);
    javaHome = validJdks[0].javaHome;
    javaVersion = validJdks[0].javaVersion;
  }

  return {javaHome, javaVersion};
}

function updateJDKs(map: Map<string, string[]>, newJdks: string[], source: string) {
  for (const newJdk of newJdks) {
    const sources = map.get(newJdk);
    if (sources !== undefined) {
      map.set(newJdk, [...sources, source]);
    } else {
      map.set(newJdk, [source]);
    }
  }
}

async function fromEnv(name: string): Promise<string[]> {
  const ret: string[] = [];
  const value = process.env[name] || '';
  if (!!value) {
    const javaHome = await verifyJavaHome(value, JAVAC_FILENAME);
    if (javaHome) {
      ret.push(javaHome);
    }
  }
  return ret;
}

async function fromPath(): Promise<string[]> {
  const ret: string[] = [];

  const paths = process.env.PATH ? process.env.PATH.split(path.delimiter).filter(Boolean) : [];
  for (const p of paths) {
    const proposed = path.dirname(p); // remove "bin"
    const javaHome = await verifyJavaHome(proposed, JAVAC_FILENAME);
    if (javaHome) {
      ret.push(javaHome);
    }

    if (isMac) {
      let dir = expandHomeDir(p);
      dir = await findLinkedFile(dir);
      // on mac, java install has a utility script called java_home
      const macUtility = path.join(dir, 'java_home');
      if (await fse.pathExists(macUtility)) {
        let buffer;
        try {
          buffer = cp.execSync(macUtility, {cwd: dir});
          const absoluteJavaHome = '' + buffer.toString().replace(/\n$/, '');
          const verified = await verifyJavaHome(absoluteJavaHome, JAVAC_FILENAME);
          if (verified) {
            ret.push(absoluteJavaHome);
          }
        } catch (error) {
          // do nothing
        }
      }
    }
  }

  if (isMac) {
    // Exclude /usr, because in macOS Big Sur /usr/bin/javac is no longer symlink.
    // See https://github.com/redhat-developer/vscode-java/issues/1700#issuecomment-729478810
    return ret.filter((item) => item !== '/usr');
  } else {
    return ret;
  }
}

async function fromWindowsRegistry(): Promise<string[]> {
  if (!isWindows) {
    return [];
  }

  const keyPaths: string[] = [
    '\\SOFTWARE\\JavaSoft\\JDK',
    '\\SOFTWARE\\JavaSoft\\Java Development Kit',
  ];

  const promisifyFindPossibleRegKey = (
    keyPath: string,
    regArch: string,
  ): Promise<Winreg.Registry[]> => {
    return new Promise<Winreg.Registry[]>((resolve) => {
      const winreg: Winreg.Registry = new WinReg({
        hive: WinReg.HKLM,
        key: keyPath,
        arch: regArch,
      });
      winreg.keys((err: any, result: any[] | PromiseLike<any[]>) => {
        if (err) {
          return resolve([]);
        }
        resolve(result);
      });
    });
  };

  const promisifyFindJavaHomeInRegKey = (reg: Winreg.Registry): Promise<string | null> => {
    return new Promise<string | null>((resolve) => {
      reg.get('JavaHome', (err: any, home: {value: string | PromiseLike<string | null> | null}) => {
        if (err || !home) {
          return resolve(null);
        }
        resolve(home.value);
      });
    });
  };

  const promises = [];
  for (const arch of ['x64', 'x86']) {
    for (const keyPath of keyPaths) {
      promises.push(promisifyFindPossibleRegKey(keyPath, arch));
    }
  }

  const keysFoundSegments: Winreg.Registry[][] = await Promise.all(promises);
  const keysFound: Winreg.Registry[] = Array.prototype.concat.apply([], keysFoundSegments);
  if (!keysFound.length) {
    return [];
  }

  const sortedKeysFound = keysFound.sort((a, b) => {
    const aVer = parseFloat(a.key);
    const bVer = parseFloat(b.key);
    return bVer - aVer;
  });

  const javaHomes: string[] = [];
  for (const key of sortedKeysFound) {
    const candidate = await promisifyFindJavaHomeInRegKey(key);
    if (candidate) {
      javaHomes.push(candidate);
    }
  }

  const ret: string[] = [];
  for (const proposed of javaHomes) {
    const javaHome = await verifyJavaHome(proposed, JAVAC_FILENAME);
    if (javaHome) {
      ret.push(javaHome);
    }
  }
  return ret;
}

async function fromCommonPlaces(): Promise<string[]> {
  const ret: string[] = [];

  // common place for mac
  if (isMac) {
    const jvmStore = '/Library/Java/JavaVirtualMachines';
    const subfolder = 'Contents/Home';
    let jvms: string[] = [];
    try {
      jvms = await fse.readdir(jvmStore);
    } catch (error) {
      // ignore
    }
    for (const jvm of jvms) {
      const proposed = path.join(jvmStore, jvm, subfolder);
      const javaHome = await verifyJavaHome(proposed, JAVAC_FILENAME);
      if (javaHome) {
        ret.push(javaHome);
      }
    }
  }

  // common place for Windows
  if (isWindows) {
    const localAppDataFolder = process.env.LOCALAPPDATA
      ? process.env.LOCALAPPDATA
      : path.join(os.homedir(), 'AppData', 'Local');
    const possibleLocations: string[] = [
      process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'Java'), // Oracle JDK per machine
      process.env.ProgramW6432 && path.join(process.env.ProgramW6432, 'Java'), // Oracle JDK per machine
      process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'AdoptOpenJDK'), // AdoptOpenJDK per machine
      process.env.ProgramW6432 && path.join(process.env.ProgramW6432, 'AdoptOpenJDK'), // AdoptOpenJDK per machine
      path.join(localAppDataFolder, 'Programs', 'AdoptOpenJDK'), // AdoptOpenJDK per user
    ].filter(Boolean) as string[];
    const jvmStores = _.uniq(possibleLocations);
    for (const jvmStore of jvmStores) {
      let jvms: string[] = [];
      try {
        jvms = await fse.readdir(jvmStore);
      } catch (error) {
        // ignore
      }
      for (const jvm of jvms) {
        const proposed = path.join(jvmStore, jvm);
        const javaHome = await verifyJavaHome(proposed, JAVAC_FILENAME);
        if (javaHome) {
          ret.push(javaHome);
        }
      }
    }
  }

  // common place for Linux
  if (isLinux) {
    const jvmStore = '/usr/lib/jvm';
    let jvms: string[] = [];
    try {
      jvms = await fse.readdir(jvmStore);
    } catch (error) {
      // ignore
    }
    for (const jvm of jvms) {
      const proposed = path.join(jvmStore, jvm);
      const javaHome = await verifyJavaHome(proposed, JAVAC_FILENAME);
      if (javaHome) {
        ret.push(javaHome);
      }
    }
  }

  return ret;
}

async function verifyJavaHome(raw: string, javaFilename: string): Promise<string | undefined> {
  const dir = expandHomeDir(raw);
  const targetJavaFile = await findLinkedFile(path.resolve(dir, 'bin', javaFilename));
  const proposed = path.dirname(path.dirname(targetJavaFile));
  if (
    (await fse.pathExists(proposed)) &&
    (await fse.pathExists(path.resolve(proposed, 'bin', javaFilename)))
  ) {
    return proposed;
  }
  return undefined;
}

// iterate through symbolic links until file is found
async function findLinkedFile(file: string): Promise<string> {
  if (!(await fse.pathExists(file)) || !(await fse.lstat(file)).isSymbolicLink()) {
    return file;
  }
  return findLinkedFile(await fse.readlink(file));
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
    await window
      .showErrorMessage(
        `Do you allow Stripe extention to set the ${STRIPE_JAVA_HOME} variable? \n ${STRIPE_JAVA_HOME}: ${javaHome}`,
        disallow,
        allow,
      )
      .then(async (selection) => {
        if (selection === allow) {
          globalState.update(key, true);
          await workspace
            .getConfiguration()
            .update(STRIPE_JAVA_HOME, javaHome, ConfigurationTarget.Global);
        } else if (selection === disallow) {
          globalState.update(key, false);
          // leave the settings unchanged, in case user had manually set it before
        }
      });
  } else if (allowWorkspaceEdit) {
    const inspect = workspace.getConfiguration().inspect<string>(STRIPE_JAVA_HOME);
    if (inspect?.globalValue !== javaHome) {
      await workspace
        .getConfiguration()
        .update(STRIPE_JAVA_HOME, javaHome, ConfigurationTarget.Global);
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

function sortJdksBySource(jdks: JavaRuntime[]) {
  const rankedJdks = jdks as Array<JavaRuntime & {rank: number}>;
  const sources = ['env.JDK_HOME', 'env.JAVA_HOME', 'env.PATH'];
  for (const [index, source] of sources.entries()) {
    for (const jdk of rankedJdks) {
      if (jdk.rank === undefined && jdk.sources.includes(source)) {
        jdk.rank = index;
      }
    }
  }
  rankedJdks.filter((jdk) => jdk.rank === undefined).forEach((jdk) => (jdk.rank = sources.length));
  rankedJdks.sort((a, b) => a.rank - b.rank);
}
