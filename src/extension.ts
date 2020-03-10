import * as vscode from "vscode";
import { StripeTreeDataProvider } from "./stripeView";
import { StripeDebugProvider } from "./stripeDebugProvider";

export function activate(context: vscode.ExtensionContext) {
  // Activity bar view
  vscode.window.createTreeView("stripeView", {
    treeDataProvider: new StripeTreeDataProvider(),
    showCollapseAll: false
  });

  // Debug provider
  vscode.debug.registerDebugConfigurationProvider(
    "stripe",
    new StripeDebugProvider().getProvider()
  );

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand("stripe.openCLI", () => {
      let terminal = vscode.window.createTerminal("Stripe");
      terminal.sendText("stripe ", false);
      terminal.show();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("stripe.openWebhooksListen", localUrl => {
      let terminal = vscode.window.createTerminal("Stripe");

      let commandArgs = ["stripe listen"];

      if (localUrl) {
        commandArgs.push(`--forward-to=${localUrl}`);
      }

      let command = commandArgs.join(" ");
      terminal.sendText(command);
      terminal.show();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("stripe.openLogsStreaming", () => {
      let terminal = vscode.window.createTerminal("Stripe");
      terminal.sendText("stripe logs tail");
      terminal.show();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("stripe.openDashboardApikeys", () => {
      vscode.env.openExternal(
        vscode.Uri.parse("https://dashboard.stripe.com/test/apikeys")
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("stripe.openDashboardEvents", () => {
      vscode.env.openExternal(
        vscode.Uri.parse("https://dashboard.stripe.com/test/events")
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("stripe.openDashboardLogs", () => {
      vscode.env.openExternal(
        vscode.Uri.parse("https://dashboard.stripe.com/test/logs")
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("stripe.openDashboardWebhooks", () => {
      vscode.env.openExternal(
        vscode.Uri.parse("https://dashboard.stripe.com/test/webhooks")
      );
    })
  );
}

export function deactivate() {}
