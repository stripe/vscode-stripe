import * as vscode from 'vscode';
import {getExtensionInfo} from './utils';
import ua from 'universal-analytics';
const osName = require('os-name');
const publicIp = require('public-ip');

export interface Telemetry {
  sendEvent(eventName: string, eventValue?: any): void;
  isTelemetryEnabled(): boolean;
}

// A NoOp implementation of telemetry
export class NoOpTelemetry implements Telemetry {
  sendEvent(eventName: string, eventValue?: any) {}

  isTelemetryEnabled() {
    return true;
  }
}

// A Local implementation of telemetry
export class LocalTelemetry implements Telemetry {
  sendEvent(eventName: string, eventValue?: any) {
    console.log('[TelemetryEvent] %s: %s', eventName, eventValue);
  }

  isTelemetryEnabled() {
    return true;
  }
}

// Google Auth Implementation of Telemetry
export class GATelemetry implements Telemetry {
  private static INSTANCE: GATelemetry;

  client: any;
  userId: string;
  ip: string;
  private _isTelemetryEnabled: boolean;

  private constructor() {
    this.userId = vscode.env.machineId;
    this.ip = '';
    this._isTelemetryEnabled = this.areAllTelemetryConfigsEnabled();
    this.setup();
    vscode.workspace.onDidChangeConfiguration(this.configurationChanged, this);
  }

  public static getInstance(): Telemetry {
    if (!GATelemetry.INSTANCE) {
      GATelemetry.INSTANCE = new GATelemetry();
    }

    return GATelemetry.INSTANCE;
  }

  isTelemetryEnabled(): boolean {
    return this._isTelemetryEnabled;
  }

  async setup() {
    if (!this.isTelemetryEnabled) {
      return;
    }

    if (this.client) {
      return;
    }

    this.client = ua('UA-12675062-9');

    const extensionInfo = getExtensionInfo();

    // Store
    this.ip = await publicIp.v4();

    // User custom dimensions to store user metadata
    this.client.set('cd1', vscode.env.sessionId);
    this.client.set('cd2', vscode.env.language);
    this.client.set('cd3', vscode.version);
    this.client.set('cd4', osName());
    this.client.set('cd5', extensionInfo.version);

    // Set userID
    this.client.set('uid', this.userId);
  }

  sendEvent(eventName: string, eventValue?: any) {
    if (!this.isTelemetryEnabled) {
      return;
    }

    const requestParams = {
      eventCategory: 'All',
      eventAction: eventName,
      //   eventLabel: "",
      eventValue: eventValue,
      uip: this.ip,
      uid: this.userId,
    };

    this.client.event(requestParams).send();
  }

  private configurationChanged(e: vscode.ConfigurationChangeEvent) {
    this._isTelemetryEnabled = this.areAllTelemetryConfigsEnabled();
    if (this._isTelemetryEnabled) {
      this.setup();
    }
  }

  private areAllTelemetryConfigsEnabled() {
    // respect both the overall and Stripe-specific telemetry configs
    const enableTelemetry = vscode.workspace.getConfiguration('telemetry').get('enableTelemetry', false);
    const stripeEnableTelemetry = vscode.workspace.getConfiguration('stripe.telemetry').get('enabled', false);
    return enableTelemetry && stripeEnableTelemetry;
  }
}
