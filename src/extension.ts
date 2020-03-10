import { commands, debug, window, ExtensionContext } from "vscode";
import { StripeTreeDataProvider } from "./stripeView";
import { StripeDebugProvider } from "./stripeDebugProvider";
import {
  openWebhooksListen,
  openLogsStreaming,
  openCLI,
  openDashboardEvents,
  openDashboardApikeys,
  openDashboardWebhooks,
  openDashboardLogs
} from "./commands";

export function activate(context: ExtensionContext) {
  // Activity bar view
  window.createTreeView("stripeView", {
    treeDataProvider: new StripeTreeDataProvider(),
    showCollapseAll: false
  });

  // Debug provider
  debug.registerDebugConfigurationProvider(
    "stripe",
    new StripeDebugProvider().getProvider()
  );

  // Commands
  let subscriptions = context.subscriptions;

  context.subscriptions.push(
    commands.registerCommand("stripe.openCLI", openCLI)
  );

  subscriptions.push(
    commands.registerCommand("stripe.openWebhooksListen", openWebhooksListen)
  );

  subscriptions.push(
    commands.registerCommand("stripe.openLogsStreaming", openLogsStreaming)
  );

  subscriptions.push(
    commands.registerCommand(
      "stripe.openDashboardApikeys",
      openDashboardApikeys
    )
  );

  subscriptions.push(
    commands.registerCommand("stripe.openDashboardEvents", openDashboardEvents)
  );

  subscriptions.push(
    commands.registerCommand("stripe.openDashboardLogs", openDashboardLogs)
  );

  subscriptions.push(
    commands.registerCommand(
      "stripe.openDashboardWebhooks",
      openDashboardWebhooks
    )
  );
}

export function deactivate() {}
