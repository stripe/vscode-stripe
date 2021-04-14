import * as https from 'https';
import * as queryString from 'querystring';
import * as vscode from 'vscode';
import {getCliVersion, getStripeAccountId} from './stripeWorkspaceState';
import {getExtensionInfo} from './utils';
import ua from 'universal-analytics';
import {v4 as uuidv4} from 'uuid';

const osName = require('os-name');

export const areAllTelemetryConfigsEnabled = () => {
  // respect both the overall and Stripe-specific telemetry configs
  const enableTelemetry = vscode.workspace
    .getConfiguration('telemetry')
    .get('enableTelemetry', false);

  const stripeEnableTelemetry = vscode.workspace
    .getConfiguration('stripe.telemetry')
    .get('enabled', false);
  return enableTelemetry && stripeEnableTelemetry;
};

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
  private _isTelemetryEnabled: boolean;

  private constructor() {
    this.userId = vscode.env.machineId;
    this._isTelemetryEnabled = areAllTelemetryConfigsEnabled();
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

  setup() {
    if (!this.isTelemetryEnabled()) {
      return;
    }

    if (this.client) {
      return;
    }

    this.client = ua('UA-12675062-9');

    const extensionInfo = getExtensionInfo();

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
    if (!this.isTelemetryEnabled()) {
      return;
    }

    const requestParams = {
      eventCategory: 'All',
      eventAction: eventName,
      //   eventLabel: "",
      eventValue: eventValue,
      uid: this.userId,
    };

    this.client.event(requestParams).send();
  }

  private configurationChanged(e: vscode.ConfigurationChangeEvent) {
    this._isTelemetryEnabled = areAllTelemetryConfigsEnabled();
    if (this._isTelemetryEnabled) {
      this.setup();
    }
  }
}

// Temporary class that will allow us to send telemetry data to both locations
export class TelemetryMigration implements Telemetry {
  private _gaTelemetry: Telemetry;
  private _stripeTelemetry: Telemetry;

  constructor(gaTelemetry: Telemetry, stripeTelemetry: Telemetry) {
    this._gaTelemetry = gaTelemetry;
    this._stripeTelemetry = stripeTelemetry;
  }

  isTelemetryEnabled(): boolean {
    return this._gaTelemetry.isTelemetryEnabled() && this._stripeTelemetry.isTelemetryEnabled();
  }

  sendEvent(eventName: string, eventValue?: any) {
    this._gaTelemetry.sendEvent(eventName, eventValue);
    this._stripeTelemetry.sendEvent(eventName, eventValue);
  }
}

/**
 * Analytics service implementation of telemetry.
 */
export class StripeAnalyticsServiceTelemetry implements Telemetry {
  private _clientId = 'vscode-stripe';
  private _isTelemetryEnabled: boolean;
  private _extensionContext: vscode.ExtensionContext;

  constructor(extensionContext: vscode.ExtensionContext) {
    this._isTelemetryEnabled = areAllTelemetryConfigsEnabled();
    this._extensionContext = extensionContext;
    vscode.workspace.onDidChangeConfiguration(this.configurationChanged, this);
  }

  isTelemetryEnabled(): boolean {
    return this._isTelemetryEnabled;
  }

  sendEvent(eventName: string, eventValue?: any) {
    if (!this.isTelemetryEnabled()) {
      return;
    }

    const extensionInfo = getExtensionInfo();

    const params = queryString.stringify({
      event_name: eventName,
      event_value: eventValue,
      uid: vscode.env.machineId,
      event_id: uuidv4(),
      client_id: this._clientId,
      created: Date.now(),
      vscode_session_id: vscode.env.sessionId,
      language: vscode.env.language,
      vscode_version: vscode.version,
      uos: osName(),
      extension_version: extensionInfo.version,
      merchant: getStripeAccountId(this._extensionContext),
      cli_version: getCliVersion(this._extensionContext),
    });

    const options = {
      hostname: 'r.stripe.com',
      path: '/0',
      method: 'POST',
      headers: {origin: this._clientId, 'Content-Type': 'application/json'},
    };

    const req = https.request(options, (res) => {
      res.on('data', (d) => {
        process.stdout.write(d);
      });
    });

    req.on('error', (error) => {
      console.error(error);
    });

    req.write(params);
    req.end();
  }

  private configurationChanged(e: vscode.ConfigurationChangeEvent) {
    this._isTelemetryEnabled = areAllTelemetryConfigsEnabled();
  }
}
