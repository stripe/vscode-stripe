"use strict";
const execa = require("execa");
var which = require("which");
import { window, commands, env, Uri } from "vscode";
import { Telemetry } from "./telemetry";

const telemetry = Telemetry.getInstance();

export class StripeClient {
  isInstalled: boolean;

  constructor() {
    this.isInstalled = false;
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

    try {
      let args: string[] = command.split(" ");
      const { stdout } = await execa("stripe", args);
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
      const { stdout } = await execa("stripe", ["config", "--list"]);
      return stdout != "";
    } catch (err) {
      telemetry.sendEvent("cli.notAuthenticated");
      return false;
    }
  }

  detectInstalled() {
    try {
      var resolvedPath = which.sync("stripe");
      this.isInstalled = true;
    } catch (err) {
      this.isInstalled = false;
      telemetry.sendEvent("cli.notInstalled");
    }
  }

  getEvents() {
    let events = this.execute("events list");
    return events;
  }
}
