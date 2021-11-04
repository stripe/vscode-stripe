import * as https from 'https';
import * as queryString from 'querystring';
import * as vscode from 'vscode';
import {getCliVersion, getStripeAccountId} from './stripeWorkspaceState';
import {getExtensionInfo} from './utils';
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

/**
 * Analytics service implementation of telemetry.
 */
export class StripeAnalyticsServiceTelemetry implements Telemetry {
  private _clientId = 'vscode-stripe';
  private _isTelemetryEnabled: boolean;
  private _extensionContext: vscode.ExtensionContext;
  private _osName: string;

  constructor(extensionContext: vscode.ExtensionContext) {
    this._isTelemetryEnabled = areAllTelemetryConfigsEnabled();
    this._extensionContext = extensionContext;
    this._osName = osName();
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
      uos: this._osName,
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
