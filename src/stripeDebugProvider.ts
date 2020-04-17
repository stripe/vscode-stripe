import { env } from "vscode";
import * as path from "path";
import * as vscode from "vscode";
import { Telemetry } from "./telemetry";

const telemetry = Telemetry.getInstance();

export class StripeDebugProvider {
  constructor() {
    vscode.debug.onDidTerminateDebugSession((e: vscode.DebugSession) => {
      if (e.name === `Stripe: Listen`) {
        // TODO: Find a way to stop the CLI from the given debug session.
      }
    });
  }

  getProvider(): vscode.DebugConfigurationProvider {
    return {
      provideDebugConfigurations(
        folder: vscode.WorkspaceFolder | undefined,
        token?: vscode.CancellationToken
      ): vscode.ProviderResult<vscode.DebugConfiguration[]> {
        return Promise.resolve([
          {
            name: "Stripe: Webhooks Forward",
            type: "stripe",
            request: "launch",
            command: "listen",
            localUrl: "http://localhost:3000/stripe-events",
          },
        ]);
      },
      resolveDebugConfiguration(
        folder: vscode.WorkspaceFolder | undefined,
        config: vscode.DebugConfiguration,
        token?: vscode.CancellationToken
      ): vscode.ProviderResult<vscode.DebugConfiguration> {
        if (config && config.type === "stripe") {
          if (
            config.request &&
            config.request === `launch` &&
            config.command &&
            config.command === "listen"
          ) {
            telemetry.sendEvent("openDebug");

            vscode.commands.executeCommand(
              `stripe.openWebhooksListen`,
              config.localUrl,
              config.events
            );
          }
        } else {
          vscode.window.showErrorMessage(
            "No supported launch config was found."
          );
        }
        return;
      },
    };
  }
}
