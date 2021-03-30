'use strict';

import * as path from 'path';
import * as vscode from 'vscode';
import {ChildProcess, spawn} from 'child_process';
import {OSType, getOSType} from './utils';
import {Telemetry} from './telemetry';

const execa = require('execa');
const fs = require('fs');
const compareVersions = require('compare-versions');

// The recommended minimum version of the CLI needed to get the full features of this extension.
const MIN_CLI_VERSION = 'v1.5.13';

export enum CLICommand {
  LogsTail,
}

const cliCommandToArgsMap: Map<CLICommand, string[]> = new Map([
  [CLICommand.LogsTail, ['logs', 'tail']],
]);

export class StripeClient {
  telemetry: Telemetry;
  private cliPath: string | null;
  cliProcesses: Map<CLICommand, ChildProcess>;

  constructor(telemetry: Telemetry) {
    this.telemetry = telemetry;
    this.cliPath = null;
    this.cliProcesses = new Map<CLICommand, ChildProcess>();
    vscode.workspace.onDidChangeConfiguration(this.handleDidChangeConfiguration, this);
  }

  private async execute(command: string) {
    const isInstalled = await this.detectInstalled();

    if (!isInstalled) {
      return;
    }

    const isAuthenticated = await this.isAuthenticated();

    if (!isAuthenticated) {
      await this.promptLogin();
      return;
    }

    const flags: object[] = [];
    if (!this.telemetry.isTelemetryEnabled()) {
      flags.push({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        STRIPE_CLI_TELEMETRY_OPTOUT: true,
      });
    }

    try {
      const args: string[] = command.split(' ');
      const {stdout} = await execa(this.cliPath, args, {
        env: flags,
      });

      const json = JSON.parse(stdout);
      return json;
    } catch (err) {
      return err;
    }
  }

  private async promptInstall() {
    const openDocsOption = 'Read instructions on how to install Stripe CLI';
    const selectedOption = await vscode.window.showErrorMessage(
      'Welcome! Stripe is using the Stripe CLI behind the scenes, and requires it to be installed on your machine',
      {modal: true},
      ...[openDocsOption],
    );
    if (selectedOption === openDocsOption) {
      vscode.env.openExternal(vscode.Uri.parse('https://stripe.com/docs/stripe-cli#install'));
    }
  }

  private async promptUpdate() {
    const actionText = 'Read instructions on how to update Stripe CLI';
    const returnValue = await vscode.window.showErrorMessage(
      'We recommend being on at least ' + MIN_CLI_VERSION + ' of the CLI for the best experience.',
      {},
      ...[actionText],
    );
    if (returnValue === actionText) {
      vscode.env.openExternal(vscode.Uri.parse('https://stripe.com/docs/stripe-cli#install'));
    }
  }

  private async promptLogin() {
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

  async isAuthenticated(): Promise<Boolean> {
    const projectName = vscode.workspace.getConfiguration('stripe').get('projectName', null);
    try {
      const {stdout} = await execa(this.cliPath, ['config', '--list']);
      const hasConfigForProject = stdout
        .split('\n')
        .some((line: string) => line === `[${projectName || 'default'}]`);
      if (hasConfigForProject) {
        return true;
      }
      this.telemetry.sendEvent('cli.notAuthenticated');
      return false;
    } catch (err) {
      this.telemetry.sendEvent('cli.notAuthenticated');
      return false;
    }
  }

  getEvents() {
    const events = this.execute('events list');
    return events;
  }

  getResourceById(id: string) {
    const resource = this.execute(`get ${id}`);
    return resource;
  }

  async getCLIPath(): Promise<string | null> {
    const isInstalled = await this.detectInstalled();
    if (!isInstalled) {
      return null;
    }
    return this.cliPath;
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
      const {stdout} = await execa(this.cliPath, ['version']);
      // Expect the output to look something like `stripe version 1.x.x`
      const version = stdout.split('\n')[0].replace('stripe version ', '');

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

  private async detectInstalled() {
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
      this.cliPath = installPath;
      this.checkCLIVersion();
      return true;
    }

    if (customInstallPath) {
      vscode.window.showErrorMessage(
        `You set a custom installation path for the Stripe CLI, but we couldn't find the executable in '${customInstallPath}'`,
        ...['Ok'],
      );
    } else {
      this.promptInstall();
    }
    this.cliPath = null;
    this.telemetry.sendEvent('cli.notInstalled');
    return false;
  }

  private async handleDidChangeConfiguration(e: vscode.ConfigurationChangeEvent) {
    const shouldHandleConfigurationChange = e.affectsConfiguration('stripe');
    if (shouldHandleConfigurationChange) {
      const isInstalled = await this.detectInstalled();
      if (isInstalled) {
        const isAuthenticated = await this.isAuthenticated();
        if (!isAuthenticated) {
          await this.promptLogin();
        }
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
    return false;
  }
}
