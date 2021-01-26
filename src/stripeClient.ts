'use strict';

import * as path from 'path';
import * as vscode from 'vscode';
import {OSType, getOSType} from './utils';
import {Telemetry} from './telemetry';

const execa = require('execa');
const fs = require('fs');

export class StripeClient {
  telemetry: Telemetry;
  isInstalled: boolean;
  cliPath: string | null;

  constructor(telemetry: Telemetry) {
    this.telemetry = telemetry;
    this.isInstalled = false;
    this.cliPath = null;
    vscode.workspace.onDidChangeConfiguration(
      this.handleDidChangeConfiguration,
      this
    );
  }

  private async execute(command: string) {
    const isInstalled = await this.detectInstalled();

    if (!isInstalled) {
      this.promptInstall();
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
    const actionText = 'Read instructions on how to install Stripe CLI';
    const returnValue = await vscode.window.showErrorMessage(
      'Welcome! Stripe is using the Stripe CLI behind the scenes, and requires it to be installed on your machine',
      {},
      ...[actionText]
    );

    if (returnValue === actionText) {
      vscode.env.openExternal(
        vscode.Uri.parse('https://stripe.com/docs/stripe-cli')
      );
    }
  }

  private async promptLogin() {
    const actionText = 'Run `stripe login` in the terminal to login';
    const returnValue = await vscode.window.showErrorMessage(
      'You need to login with the Stripe CLI for this project before you can continue',
      {},
      ...[actionText]
    );
    if (returnValue === actionText) {
      vscode.commands.executeCommand('stripe.login');
    }
  }

  async isAuthenticated(): Promise<Boolean> {
    const projectName = vscode.workspace
      .getConfiguration('stripe')
      .get('projectName', null);
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

  async detectInstalled() {
    const defaultInstallPath = (() => {
      const osType: OSType = getOSType();
      switch (osType) {
        case OSType.macOS:
          // HomeBrew install path on macOS
          return '/usr/local/bin/stripe';
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
      return true;
    }

    if (customInstallPath) {
      vscode.window.showErrorMessage(
        `You set a custom installation path for the Stripe CLI, but we couldn't find the executable in '${customInstallPath}'`,
        ...['Ok']
      );
    }
    this.cliPath = null;
    this.telemetry.sendEvent('cli.notInstalled');
    return false;
  }

  getEvents() {
    const events = this.execute('events list');
    return events;
  }

  getResourceById(id: string) {
    const resource = this.execute(`get ${id}`);
    return resource;
  }

  private async handleDidChangeConfiguration(
    e: vscode.ConfigurationChangeEvent
  ) {
    const shouldHandleConfigurationChange = e.affectsConfiguration('stripe');
    if (shouldHandleConfigurationChange) {
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
    return false;
  }
}
