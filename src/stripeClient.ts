'use strict';

import * as path from 'path';
import * as toml from 'toml';
import * as vscode from 'vscode';
import {ChildProcess, spawn} from 'child_process';
import {OSType, getOSType} from './utils';
import {setCliVersion, setStripeAccountId} from './stripeWorkspaceState';
import {Telemetry} from './telemetry';

const execa = require('execa');
const fs = require('fs');
const compareVersions = require('compare-versions');

// The recommended minimum version of the CLI needed to get the full features of this extension.
const MIN_CLI_VERSION = 'v1.5.13';

// The minimum version for of the CLI to that has the `stripe daemon` command.
const MIN_CLI_VERSION_FOR_DAEMON = 'v1.6.0';

export enum CLICommand {
  Trigger,
}

const cliCommandToArgsMap: Map<CLICommand, string[]> = new Map([[CLICommand.Trigger, ['trigger']]]);

export class StripeClient {
  telemetry: Telemetry;
  private cliPath: Promise<string | null>;
  cliProcesses: Map<CLICommand, ChildProcess>;
  private extensionContext: vscode.ExtensionContext;

  constructor(telemetry: Telemetry, extensionContext: vscode.ExtensionContext) {
    this.telemetry = telemetry;
    this.cliPath = StripeClient.detectInstallation(telemetry);
    this.cliProcesses = new Map<CLICommand, ChildProcess>();
    this.extensionContext = extensionContext;
    vscode.workspace.onDidChangeConfiguration(this.handleDidChangeConfiguration, this);
  }

  static promptInstall() {
    vscode.commands.executeCommand('stripeInstallCLIView.focus');
  }

  static async detectInstallation(telemetry: Telemetry) {
    const defaultInstallPath = (() => {
      const osType: OSType = getOSType();
      switch (osType) {
        case OSType.macOSintel:
          // HomeBrew install path on macOS Intel
          return '/usr/local/bin/stripe';
        case OSType.macOSarm:
          // ARM installs go into a separate path
          return '/opt/homebrew/bin/stripe';
        case OSType.linux:
          // apt-get install path on ubuntu + yum install path on centOS
          return '/usr/local/bin/stripe';
        case OSType.windows:
          // scoop install path on Windows 10
          const userProfile = process.env.USERPROFILE || '';
          return path.join(userProfile, 'scoop', 'shims', 'stripe.exe');
        default:
          return null;
      }
    })();

    const config = vscode.workspace.getConfiguration('stripe');
    const customInstallPath = config.get('cliInstallPath', null);

    const installPath = customInstallPath || defaultInstallPath;

    if (installPath && (await isFile(installPath))) {
      // This context tells TreeViews if they should be rendered. It is negative ("is not ...")
      // because we want to assume the CLI is installed on startup (when undefined, it implies CLI
      // is installed).
      vscode.commands.executeCommand('setContext', 'stripe.isNotCLIInstalled', false);
      return Promise.resolve(installPath);
    }

    vscode.commands.executeCommand('setContext', 'stripe.isNotCLIInstalled', true);
    telemetry.sendEvent('cli.notInstalled');
    return Promise.resolve(null);
  }

  private async promptUpdate() {
    const actionText = 'Read instructions on how to update Stripe CLI';
    const returnValue = await vscode.window.showErrorMessage(
      'Stripe for VS Code requires a newer version of the Stripe CLI. Please update your Stripe CLI to the newest version.',
      {},
      ...[actionText],
    );
    if (returnValue === actionText) {
      vscode.env.openExternal(vscode.Uri.parse('https://stripe.com/docs/stripe-cli#upgrade'));
    }
  }

  async promptUpdateForDaemon() {
    const actionText = 'Read instructions on how to update Stripe CLI';
    const returnValue = await vscode.window.showErrorMessage(
      `This command requires ${MIN_CLI_VERSION_FOR_DAEMON} of the Stripe CLI.`,
      {},
      ...[actionText],
    );
    if (returnValue === actionText) {
      vscode.env.openExternal(vscode.Uri.parse('https://stripe.com/docs/stripe-cli#upgrade'));
    }
  }

  async promptLogin() {
    const actionText = 'Run `stripe login` in the terminal to login';
    const returnValue = await vscode.window.showErrorMessage(
      'You need to login with the Stripe CLI for this project before you can continue',
      {},
      ...[actionText],
    );
    if (returnValue === actionText) {
      vscode.commands.executeCommand('stripe.login');
    }
  }

  /**
   * Wrapper around the CLIPath. We have multiple clients using the cliPath to execute commands
   * both within this class and the stripeTerminal class. This function cosolidates all the things
   * we need to do before venfing out the path.
   */
  async getCLIPath(): Promise<string | null> {
    // Check again in case the user removed the executable since we last checked.
    this.cliPath = StripeClient.detectInstallation(this.telemetry);
    const cliPath = await this.cliPath;
    if (cliPath) {
      this.checkCLIVersion();
    } else {
      const config = vscode.workspace.getConfiguration('stripe');
      const customInstallPath = config.get('cliInstallPath', null);

      if (customInstallPath) {
        vscode.window.showErrorMessage(
          `You set a custom installation path for the Stripe CLI, but we couldn't find the executable in '${customInstallPath}'`,
          ...['Ok'],
        );
      } else {
        StripeClient.promptInstall();
      }
    }

    return cliPath;
  }

  async isAuthenticated(): Promise<Boolean> {
    const projectName =
      vscode.workspace.getConfiguration('stripe').get('projectName', null) || 'default';
    try {
      const {stdout} = await execa(await this.cliPath, ['config', '--list']);
      const data = toml.parse(stdout);

      const hasConfigForProject = projectName in data;
      if (hasConfigForProject) {
        const accountId = data[projectName]?.account_id || '';
        setStripeAccountId(this.extensionContext, accountId);
        return true;
      }
      this.telemetry.sendEvent('cli.notAuthenticated');
      return false;
    } catch (err) {
      console.log('Error fetching stripe config file. ', err);
      this.telemetry.sendEvent('cli.notAuthenticated');
      return false;
    }
  }

  async getOrCreateCLIProcess(
    cliCommand: CLICommand,
    flags: string[] = [],
  ): Promise<ChildProcess | null> {
    const existingCLIProcess = this.cliProcesses.get(cliCommand);
    if (existingCLIProcess) {
      return existingCLIProcess;
    }

    const cliPath = await this.getCLIPath();
    if (!cliPath) {
      return null;
    }

    const isAuthenticated = await this.isAuthenticated();
    if (!isAuthenticated) {
      await this.promptLogin();
      return null;
    }

    const commandArgs = cliCommandToArgsMap.get(cliCommand);
    if (!commandArgs) {
      return null;
    }

    const projectName = vscode.workspace.getConfiguration('stripe').get('projectName', null);

    const allFlags = [...(projectName ? ['--project-name', projectName] : []), ...flags];

    const newCLIProcess = spawn(cliPath, [...commandArgs, ...allFlags]);
    this.cliProcesses.set(cliCommand, newCLIProcess);

    newCLIProcess.on('exit', () => this.cleanupCLIProcess(cliCommand));
    newCLIProcess.on('error', () => this.cleanupCLIProcess(cliCommand));

    return newCLIProcess;
  }

  endCLIProcess(cliCommand: CLICommand): void {
    const cliProcess = this.cliProcesses.get(cliCommand);
    if (cliProcess) {
      cliProcess.kill();
    }
  }

  private cleanupCLIProcess = (cliCommand: CLICommand) => {
    this.cliProcesses.delete(cliCommand);
  };

  /**
   * Prompts the user to update the version of the stripe CLI if it's lower than the min recommended version.
   * Does not do anything if we cannot tell for certain that they are behind.
   */
  async checkCLIVersion() {
    try {
      const {stdout} = await execa(await this.cliPath, ['version']);
      // Expect the output to look something like `stripe version 1.x.x`
      const version = stdout.split('\n')[0].replace('stripe version ', '');
      setCliVersion(this.extensionContext, version);

      // This will happen for versions that are built directly from the source. We can't tell in this case what version they're on.
      if (version === 'master') {
        return;
      }

      // the compare-versions module takes care of comparing the semantic versions (as well as ignoring the leading v)
      if (compareVersions(version, MIN_CLI_VERSION) < 0) {
        this.promptUpdate();
      }
    } catch (err) {
      // If we fail to fetch the user's CLI version, don't prompt
      console.log('Error fetching CLI version', err);
    }
  }

  private async handleDidChangeConfiguration(e: vscode.ConfigurationChangeEvent) {
    const shouldHandleConfigurationChange = e.affectsConfiguration('stripe');
    if (shouldHandleConfigurationChange) {
      // kick off cliPath check
      await this.getCLIPath();
      const isAuthenticated = await this.isAuthenticated();
      if (!isAuthenticated) {
        await this.promptLogin();
      }
    }
  }
}

async function isFile(path: string): Promise<boolean> {
  try {
    const resolvedPath = await fs.promises.realpath(path);
    const fileStat = await fs.promises.stat(resolvedPath);
    return fileStat.isFile();
  } catch (err) {
    console.error(`Error looking for CLI at ${path}`, err);
    return false;
  }
}
