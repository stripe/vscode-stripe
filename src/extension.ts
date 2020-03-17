import { commands, debug, window, ExtensionContext } from "vscode";
import { StripeViewDataProvider } from "./stripeView";
import { StripeEventsDataProvider } from "./stripeEventsView";
import { StripeDebugProvider } from "./stripeDebugProvider";
import {
  openWebhooksListen,
  openLogsStreaming,
  openCLI,
  openDashboardEvents,
  openDashboardApikeys,
  openDashboardWebhooks,
  openDashboardLogs,
  openDashboardEventDetails,
  refreshEventsList
} from "./commands";

export function activate(this: any, context: ExtensionContext) {
  // Activity bar view
  window.createTreeView("stripeView", {
    treeDataProvider: new StripeViewDataProvider(),
    showCollapseAll: false
  });

  let stripeEventsViewProvider = new StripeEventsDataProvider();
  window.createTreeView("stripeEventsView", {
    treeDataProvider: stripeEventsViewProvider,
    showCollapseAll: true
  });

  // Debug provider
  debug.registerDebugConfigurationProvider(
    "stripe",
    new StripeDebugProvider().getProvider()
  );

  // Commands
  let subscriptions = context.subscriptions;
  let boundRefreshEventsList = refreshEventsList.bind(
    this,
    stripeEventsViewProvider
  );

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
    commands.registerCommand("stripe.openDashboardEvents", openDashboardEvents)
  );

  subscriptions.push(
    commands.registerCommand("stripe.openDashboardLogs", openDashboardLogs)
  );

  subscriptions.push(
    commands.registerCommand(
      "stripe.openDashboardEventDetails",
      openDashboardEventDetails
    )
  );

  subscriptions.push(
    commands.registerCommand(
      "stripe.openDashboardApikeys",
      openDashboardApikeys
    )
  );

  subscriptions.push(
    commands.registerCommand(
      "stripe.openDashboardWebhooks",
      openDashboardWebhooks
    )
  );

  subscriptions.push(
    commands.registerCommand("stripe.refreshEventsList", boundRefreshEventsList)
  );
}

export function deactivate() {}
