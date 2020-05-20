import * as vscode from "vscode";
import { Telemetry } from "./telemetry";

const telemetry = Telemetry.getInstance();

export class StripeDebugProvider implements vscode.DebugConfigurationProvider {
  constructor() {
    vscode.debug.onDidTerminateDebugSession((e: vscode.DebugSession) => {
      if (e.name === `Stripe: Listen`) {
        // TODO: Find a way to stop the CLI from the given debug session.
      }
    });
  }

  public async provideDebugConfigurations(
    folder: vscode.WorkspaceFolder | undefined,
    token?: vscode.CancellationToken
  ): Promise<vscode.DebugConfiguration[]> {
    return Promise.resolve([
      {
        name: "Stripe: Webhooks Forward",
        type: "stripe",
        request: "launch",
        command: "listen",
        localUrl: "http://localhost:3000/stripe-events",
      },
    ]);
  }

  public async resolveDebugConfiguration(
    folder: vscode.WorkspaceFolder | undefined,
    config: vscode.DebugConfiguration,
    token?: vscode.CancellationToken
  ): Promise<vscode.DebugConfiguration> {
    if (config && config.type === "stripe") {
      if (
        config.request &&
        config.request === `launch` &&
        config.command &&
        config.command === "listen"
      ) {
        telemetry.sendEvent("debug.launch");

        if (!config.localUrl) {
          let action = await showLocaUrlPrompt();
          if (action === "Yes") {
            let localUrl = await vscode.window.showInputBox({
              prompt: "Enter local server url",
              placeHolder: "http://localhost:3000",
            });

            if (localUrl) {
              config.localUrl = localUrl;
            }
          }
        }

        vscode.commands.executeCommand(
          `stripe.openWebhooksListen`,
          config.localUrl,
          config.events
        );
      }
    } else {
      vscode.window.showErrorMessage("No supported launch config was found.");
    }

    return {
      type: "",
      name: "",
      request: "",
    };
  }
}

async function showLocaUrlPrompt() {
  return new Promise((resolve, reject) => {
    const input = vscode.window.createQuickPick();
    input.placeholder = "Do you want to forward traffic to your local server?";
    input.items = [{ label: "Yes" }, { label: "No" }];

    input.onDidAccept(() => {
      let value = input.selectedItems[0].label;
      resolve(value);
    });

    input.show();
  });
}
