import * as vscode from "vscode";
import StripeTreeProvider from "./stripeTreeProvider";

export function activate(context: vscode.ExtensionContext) {
  vscode.window.createTreeView("stripeView", {
    treeDataProvider: new StripeTreeProvider(),
    showCollapseAll: true
  });

  context.subscriptions.push(
    vscode.commands.registerCommand("stripe.openCLI", () => {
      let terminal = vscode.window.createTerminal("Stripe");
      terminal.sendText("stripe", false);
      terminal.show();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("stripe.openListen", () => {
      let terminal = vscode.window.createTerminal("Stripe");
      terminal.sendText("stripe listen");
      terminal.show();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("stripe.openLogs", () => {
      let terminal = vscode.window.createTerminal("Stripe");
      terminal.sendText("stripe logs tail");
      terminal.show();
    })
  );
}

export function deactivate() {}
