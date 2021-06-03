/* eslint-disable no-warning-comments */
import * as vscode from 'vscode';
import {Telemetry} from './telemetry';

export class StripeDebugProvider implements vscode.DebugConfigurationProvider {
  telemetry: Telemetry;

  constructor(telemetry: Telemetry) {
    this.telemetry = telemetry;
    vscode.debug.onDidTerminateDebugSession((e: vscode.DebugSession) => {
      if (e.name === 'Stripe: Webhooks listen') {
        // TODO: Find a way to stop the CLI from the given debug session.
      }
    });
  }

  public resolveDebugConfiguration(
    folder: vscode.WorkspaceFolder | undefined,
    config: vscode.DebugConfiguration,
    token?: vscode.CancellationToken,
  ): Promise<vscode.DebugConfiguration> {
    if (config && config.type === 'stripe') {
      if (
        config.request &&
        config.request === 'launch' &&
        config.command &&
        config.command === 'listen'
      ) {
        this.telemetry.sendEvent('debug.launch');

        vscode.commands.executeCommand('stripe.openWebhooksListen', {
          forwardTo: config.forwardTo,
          forwardConnectTo: config.forwardConnectTo,
          events: config.events,
          skipVerify: config.skipVerify,
        });
      }
    } else {
      vscode.window.showErrorMessage('No supported launch config was found.');
    }

    return Promise.resolve({
      type: '',
      name: '',
      request: '',
    });
  }
}
