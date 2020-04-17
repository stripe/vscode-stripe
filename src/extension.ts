import { commands, debug, window, ExtensionContext } from "vscode";
import { StripeViewDataProvider } from "./stripeView";
import { StripeEventsDataProvider } from "./stripeEventsView";
import { StripeHelpViewDataProvider } from "./stripeHelpView";
import { StripeDebugProvider } from "./stripeDebugProvider";
import { StripeLinter } from "./stripeLinter";
import { StripeClient } from "./stripeClient";
import { Resource } from "./resources";
import { SurveyPrompt } from "./surveyPrompt";
import {
  openWebhooksListen,
  openLogsStreaming,
  openCLI,
  openDashboardEvents,
  openDashboardApikeys,
  openDashboardWebhooks,
  openDashboardLogs,
  openDashboardEventDetails,
  refreshEventsList,
  startLogin,
  triggerEvent,
  openSurvey,
  openReportIssue,
  openDocs,
} from "./commands";

export async function activate(this: any, context: ExtensionContext) {
  // Stripe CLi client
  let stripeClient = new StripeClient();

  // CSAT survey prompt
  let survetPrompt = new SurveyPrompt(context).activate();

  Resource.initialize(context);

  // Activity bar view
  window.createTreeView("stripeView", {
    treeDataProvider: new StripeViewDataProvider(),
    showCollapseAll: false,
  });

  window.createTreeView("stripeHelpView", {
    treeDataProvider: new StripeHelpViewDataProvider(),
    showCollapseAll: false,
  });

  let stripeEventsViewProvider = new StripeEventsDataProvider(stripeClient);
  window.createTreeView("stripeEventsView", {
    treeDataProvider: stripeEventsViewProvider,
    showCollapseAll: true,
  });

  // Debug provider
  debug.registerDebugConfigurationProvider(
    "stripe",
    new StripeDebugProvider().getProvider()
  );

  // Stripe Linter
  let stripeLinter = new StripeLinter();
  stripeLinter.activate();

  // Commands
  let subscriptions = context.subscriptions;
  let boundRefreshEventsList = refreshEventsList.bind(
    this,
    stripeEventsViewProvider
  );

  context.subscriptions.push(
    commands.registerCommand("stripe.openCLI", openCLI)
  );

  context.subscriptions.push(
    commands.registerCommand("stripe.login", startLogin)
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

  subscriptions.push(
    commands.registerCommand("stripe.openTriggerEvent", triggerEvent)
  );

  subscriptions.push(commands.registerCommand("stripe.openSurvey", openSurvey));

  subscriptions.push(
    commands.registerCommand("stripe.openReportIssue", openReportIssue)
  );

  subscriptions.push(commands.registerCommand("stripe.openDocs", openDocs));
}

export function deactivate() {}
