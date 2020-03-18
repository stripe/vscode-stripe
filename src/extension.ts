import {
  commands,
  debug,
  window,
  ExtensionContext,
  env,
  Uri,
  workspace
} from "vscode";
import { StripeViewDataProvider } from "./stripeView";
import { StripeEventsDataProvider } from "./stripeEventsView";
import { StripeDebugProvider } from "./stripeDebugProvider";
import { lookForHardCodedAPIKeys } from "./stripeAPIKeyLinter";
import { StripeClient } from "./stripeClient";
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

export async function activate(this: any, context: ExtensionContext) {
  let stripeClient = new StripeClient();

  if (!stripeClient.isInstalled) {
    let actionText = "Read instructions on how to install Stripe CLI";
    let returnValue = await window.showErrorMessage(
      `Stripe requires the Stripe CLI to be installed on your machine`,
      {},
      ...[actionText]
    );

    if (returnValue === actionText) {
      env.openExternal(Uri.parse(`https://stripe.com/docs/stripe-cli`));
    }
  }

  // Activity bar view
  window.createTreeView("stripeView", {
    treeDataProvider: new StripeViewDataProvider(),
    showCollapseAll: false
  });

  let stripeEventsViewProvider = new StripeEventsDataProvider(stripeClient);
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

  workspace.onDidSaveTextDocument(() => {
    lookForHardCodedAPIKeys();
  });
}

export function deactivate() {}
