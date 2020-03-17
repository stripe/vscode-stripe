"use strict";
const execa = require("execa");

export class StripeClient {
  constructor() {}

  private async execute(command: string) {
    // todo: detect CLI installed
    try {
      let args: string[] = command.split(" ");
      const { stdout } = await execa("stripe", args);
      let json = JSON.parse(stdout);
      return json;
    } catch (err) {
      return err;
    }
  }

  getEvents() {
    let events = this.execute("events list");
    return events;
  }
}
