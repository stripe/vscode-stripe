import { env } from "vscode";
import * as path from "path";
import * as vscode from "vscode";

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
            type: "stripe",
            name: "Stripe: Listen",
            request: "launch",
            command: "listen",
            localPort: 3000
          }
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
            vscode.commands.executeCommand(
              `stripe.openWebhooksListen`,
              config.localUrl
            );
          }
        } else {
          vscode.window.showErrorMessage(
            "No supported launch config was found."
          );
        }
        return;
      }
    };
  }
}
