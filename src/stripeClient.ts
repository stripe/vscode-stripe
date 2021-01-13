'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import {OSType, getOSType} from './utils';
import {Telemetry} from './telemetry';

const execa = require('execa');

const telemetry = Telemetry.getInstance();

export class StripeClient {
  isInstalled: boolean;
  cliPath: string;

  constructor() {
    this.isInstalled = false;
    this.cliPath = '';
    vscode.workspace.onDidChangeConfiguration(this.handleDidChangeConfiguration, this);
  }

  private async execute(command: string) {
    this.detectInstalled();

    if (!this.isInstalled) {
      this.promptInstall();
      return;
    }

    const isAuthenticated = await this.isAuthenticated();

    if (!isAuthenticated) {
      await this.promptLogin();
      return;
    }

    const flags: object[] = [];
    if (!telemetry.isTelemetryEnabled) {
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
      vscode.env.openExternal(vscode.Uri.parse('https://stripe.com/docs/stripe-cli'));
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
      telemetry.sendEvent('cli.notAuthenticated');
      return false;
    } catch (err) {
      telemetry.sendEvent('cli.notAuthenticated');
      return false;
    }
  }

  detectInstalled() {
    const osType: OSType = getOSType();
    let installPaths: string[] = [];

    switch (osType) {
      case OSType.macOS:
        // HomeBrew install path on macOS
        installPaths = ['/usr/local/bin/stripe'];
        break;
      case OSType.linux:
        // apt-get install path on ubuntu + yum install path on centOS
        installPaths = ['/usr/local/bin/stripe'];
        break;
      case OSType.windows:
        // scoop install path on Windows 10
        const userProfile = process.env.USERPROFILE || '';
        installPaths = [path.join(userProfile, 'scoop', 'shims', 'stripe.exe')];
        break;
    }

    // Handle custom CLI path setting
    const config = vscode.workspace.getConfiguration('stripe');
    if (config) {
      const cliInstallPath = config.get<string>('cliInstallPath');
      if (cliInstallPath) {
        const validInstallPath = getInstallPath([cliInstallPath]);
        if (!validInstallPath) {
          vscode.window.showErrorMessage(
            `You set a custom installation path for the Stripe CLI, but we couldn't find the executable in '${cliInstallPath}'`,
            ...['Ok']
          );
        }
      }
    }

    const validInstallPath = getInstallPath(installPaths);

    if (validInstallPath) {
      this.isInstalled = true;
      this.cliPath = validInstallPath;
    } else {
      this.isInstalled = false;
      telemetry.sendEvent('cli.notInstalled');
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

  private async handleDidChangeConfiguration(e: vscode.ConfigurationChangeEvent) {
    const shouldHandleConfigurationChange = e.affectsConfiguration('stripe');
    if (shouldHandleConfigurationChange) {
      const isAuthenticated = await this.isAuthenticated();
      if (!isAuthenticated) {
        await this.promptLogin();
      }
    }
  }
}

function getInstallPath(paths: string[]): string {
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    try {
      // eslint-disable-next-line no-sync
      const isValidPath = fs.statSync(path).isFile();
      if (isValidPath) {
        return path;
      }
    } catch (err) {}
  }

  return '';
}
