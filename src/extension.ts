import * as vscode from "vscode";
import { StripeTreeDataProvider } from "./stripeView";

export function activate(context: vscode.ExtensionContext) {
  vscode.window.createTreeView("stripeView", {
    treeDataProvider: new StripeTreeDataProvider(),
    showCollapseAll: false
  });

  context.subscriptions.push(
    vscode.commands.registerCommand("stripe.openCLI", () => {
      let terminal = vscode.window.createTerminal("Stripe");
      terminal.sendText("stripe ", false);
      terminal.show();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("stripe.openWebhooksListen", () => {
      let terminal = vscode.window.createTerminal("Stripe");
      terminal.sendText("stripe listen");
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
