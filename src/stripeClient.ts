"use strict";
const execa = require("execa");
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { window, commands, env, Uri } from "vscode";
import { Telemetry } from "./telemetry";
import { OSType, getOSType } from "./utils";

const telemetry = Telemetry.getInstance();

export class StripeClient {
  isInstalled: boolean;
  cliPath: string;

  constructor() {
    this.isInstalled = false;
    this.cliPath = "";
  }

  private async execute(command: string) {
    this.detectInstalled();

    if (!this.isInstalled) {
      this.promptInstall();
      return;
    }

    let isAuthenticated = await this.isAuthenticated();

    if (!isAuthenticated) {
      await this.promptLogin();
      return;
    }

    let flags: object[] = [];
    if (!this.isTelemetryEnabled()) {
      flags.push({
        STRIPE_CLI_TELEMETRY_OPTOUT: true,
      });
    }

    try {
      let args: string[] = command.split(" ");
      const { stdout } = await execa(this.cliPath, args, {
        env: flags,
      });

      let json = JSON.parse(stdout);
      return json;
    } catch (err) {
      return err;
    }
  }

  private async promptInstall() {
    let actionText = "Read instructions on how to install Stripe CLI";
    let returnValue = await window.showErrorMessage(
      `Welcome! Stripe is using the Stripe CLI behind the scenes, and requires it to be installed on your machine`,
      {},
      ...[actionText]
    );

    if (returnValue === actionText) {
      env.openExternal(Uri.parse(`https://stripe.com/docs/stripe-cli`));
    }
  }

  private async promptLogin() {
    let actionText = "Run `stripe login` in the terminal to login";
    let returnValue = await window.showErrorMessage(
      `You need to login with the Stripe CLI before you can continue`,
      {},
      ...[actionText]
    );
    if (returnValue === actionText) {
      commands.executeCommand(`stripe.login`);
    }
  }

  async isAuthenticated(): Promise<Boolean> {
    try {
      const { stdout } = await execa(this.cliPath, ["config", "--list"]);
      return stdout != "";
    } catch (err) {
      telemetry.sendEvent("cli.notAuthenticated");
      return false;
    }
  }

  isTelemetryEnabled() {
    let config = vscode.workspace.getConfiguration("telemetry");
    if (config) {
      return config.get<boolean>("enableTelemetry");
    }

    return false;
  }

  detectInstalled() {
    let osType: OSType = getOSType();
    let installPaths: string[] = [];

    switch (osType) {
      case OSType.macOS:
        // HomeBrew install path on macOS
        installPaths = ["/usr/local/bin/stripe"];
        break;
      case OSType.linux:
        // apt-get install path on ubuntu + yum install path on centOS
        installPaths = ["/usr/local/bin/stripe"];
        break;
      case OSType.windows:
        // scoop install path on Windows 10
        let userProfile = process.env.USERPROFILE || "";
        installPaths = [path.join(userProfile, "scoop", "shims", "stripe.exe")];
        break;
    }

    // Handle custom CLI path setting
    let config = vscode.workspace.getConfiguration("stripe");
    if (config) {
      let cliInstallPath = config.get<string>("cliInstallPath");
      if (cliInstallPath) {
        let validInstallPath = getInstallPath([cliInstallPath]);
        if (!validInstallPath) {
          vscode.window.showErrorMessage(
            `You set a custom installation path for the Stripe CLI, but we couldn't find the executable in '${cliInstallPath}'`,
            ...["Ok"]
          );
        }
      }
    }

    let validInstallPath = getInstallPath(installPaths);

    if (validInstallPath) {
      this.isInstalled = true;
      this.cliPath = validInstallPath;
    } else {
      this.isInstalled = false;
      telemetry.sendEvent("cli.notInstalled");
    }
  }

  getEvents() {
    let events = this.execute("events list");
    return events;
  }
}

function getInstallPath(paths: string[]): string {
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    try {
      let isValidPath = fs.statSync(path).isFile();
      if (isValidPath) {
        return path;
      }
    } catch (err) {}
  }

  return "";
}
