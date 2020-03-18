"use strict";
const execa = require("execa");
var which = require("which");

export class StripeClient {
  isInstalled: boolean;
  isAuthenticated: boolean;

  constructor() {
    this.isInstalled = false;
    this.isAuthenticated = false;

    this.detectInstalled();
  }

  private async execute(command: string) {
    if (!this.isInstalled) {
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
