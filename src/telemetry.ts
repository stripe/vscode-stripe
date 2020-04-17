import ua from "universal-analytics";
import * as vscode from "vscode";
import { getExtensionInfo } from "./utils";
const osName = require("os-name");
const publicIp = require("public-ip");

export class Telemetry {
  private static instance: Telemetry;

  client: any;
  userId: string;
  ip: string;
  isTelemetryEnabled: boolean;

  private constructor() {
    this.userId = vscode.env.machineId;
    this.isTelemetryEnabled = false;
    this.ip = "";

    this.getSettingFromConfig();
    this.setup();
    vscode.workspace.onDidChangeConfiguration(this.configurationChanged, this);
  }

  public static getInstance(): Telemetry {
    if (!Telemetry.instance) {
      Telemetry.instance = new Telemetry();
    }

    return Telemetry.instance;
  }

  async setup() {
    if (!this.isTelemetryEnabled) {
      return;
    }

    if (this.client) {
      return;
    }

    this.client = ua("UA-12675062-9");

    let extensionInfo = getExtensionInfo();

    // Store
    this.ip = await publicIp.v4();

    // User custom dimensions to store user metadata
    this.client.set("cd[1]", vscode.env.sessionId);
    this.client.set("cd[2]", vscode.env.language);
    this.client.set("cd[3]", vscode.version);
    this.client.set("cd[4]", osName());
    this.client.set("cd[5]", extensionInfo.version);

    // Set userID
    this.client.set("uid", this.userId);
  }

  sendEvent(eventName: string, eventValue?: any) {
    if (!this.isTelemetryEnabled) {
      return;
    }

    let requestParams = {
      eventCategory: "All",
      eventAction: eventName,
      //   eventLabel: "",
      eventValue: eventValue,
      uip: this.ip,
      uid: this.userId,
    };

    this.client.event(requestParams).send();
  }

  private configurationChanged(e: vscode.ConfigurationChangeEvent) {
    this.getSettingFromConfig();
  }

  private getSettingFromConfig() {
    let config = vscode.workspace.getConfiguration("telemetry");
    if (config) {
      let enableTelemetry = config.get<boolean>("enableTelemetry");
      this.isTelemetryEnabled = !!enableTelemetry;
    }
    if (this.isTelemetryEnabled) {
      this.setup();
    }
  }
}
