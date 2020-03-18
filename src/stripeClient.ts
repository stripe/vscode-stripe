"use strict";
const execa = require("execa");
var which = require("which");
import { window, commands } from "vscode";

export class StripeClient {
  isInstalled: boolean;

  constructor() {
    this.isInstalled = false;

    this.detectInstalled();
  }

  private async execute(command: string) {
    if (!this.isInstalled) {
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

  private async promptLogin() {
    let actionText = "Run `stripe login`";
    let returnValue = await window.showErrorMessage(
      `You aren't authenticated in the Stripe CLI. Please login first`,
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
      console.log("isAuthenticated", stdout != "");
      return stdout != "";
    } catch (err) {
      return false;
    }
  }

  detectInstalled() {
    try {
      var resolvedPath = which.sync("stripe");
      this.isInstalled = true;
    } catch (err) {
      this.isInstalled = false;
    }
  }

  getEvents() {
    let events = this.execute("events list");
    return events;
  }
}
