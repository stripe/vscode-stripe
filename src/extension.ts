import { commands, debug, window, ExtensionContext } from "vscode";

import { ServerOptions, TransportKind } from "vscode-languageclient";

import path from "path";
import { StripeDashboardViewDataProvider } from "./stripeDashboardView";
import { StripeEventsDataProvider } from "./stripeEventsView";
import { StripeHelpViewDataProvider } from "./stripeHelpView";
import { StripLogsDataProvider } from "./stripeLogsView";
import { StripeDebugProvider } from "./stripeDebugProvider";
import { StripeLinter } from "./stripeLinter";
import { StripeLanguageClient } from "./stripeLanguageServer/client";
import { StripeClient } from "./stripeClient";
import { Resource } from "./resources";
import { SurveyPrompt } from "./surveyPrompt";
import { TelemetryPrompt } from "./telemetryPrompt";
import { Telemetry } from "./telemetry";

import {
  openWebhooksListen,
  openWebhooksDebugConfigure,
  openLogsStreaming,
  openCLI,
  openDashboardEvents,
  openDashboardApikeys,
  openDashboardWebhooks,
  openDashboardLogs,
  openDashboardEventDetails,
  refreshEventsList,
  startLogin,
  openTriggerEvent,
  openSurvey,
  openTelemetryInfo,
  openReportIssue,
  openDocs,
} from "./commands";

export async function activate(this: any, context: ExtensionContext) {
  // Stripe CLi client
  let stripeClient = new StripeClient();

  // disclosure of telemetry prompt
  let telemetryPrompt = new TelemetryPrompt(context).activate();

  // Telemetry
  const telemetry = Telemetry.getInstance();
  telemetry.sendEvent("activate");

  // CSAT survey prompt
  let surveyPrompt = new SurveyPrompt(context).activate();

  Resource.initialize(context);

  // Activity bar view
  window.createTreeView("stripeDashboardView", {
    treeDataProvider: new StripeDashboardViewDataProvider(),
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

  let stripeLogsViewProvider = new StripLogsDataProvider(stripeClient);
  window.createTreeView("stripeLogsView", {
    treeDataProvider: stripeLogsViewProvider,
    showCollapseAll: true,
  });

  // Debug provider
  debug.registerDebugConfigurationProvider("stripe", new StripeDebugProvider());

  // Stripe Linter
  let stripeLinter = new StripeLinter();
  stripeLinter.activate();

  // Language Server for hover matching of Stripe methods
  let serverModule = context.asAbsolutePath(
    path.join("out", "stripeLanguageServer", "server.js")
  );

  let debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

  let serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  StripeLanguageClient.activate(context, serverOptions);

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
    commands.registerCommand("stripe.openTriggerEvent", openTriggerEvent)
  );

  subscriptions.push(commands.registerCommand("stripe.openSurvey", openSurvey));

  subscriptions.push(
    commands.registerCommand("stripe.openTelemetryInfo", openTelemetryInfo)
  );

  subscriptions.push(
    commands.registerCommand("stripe.openReportIssue", openReportIssue)
  );

  subscriptions.push(commands.registerCommand("stripe.openDocs", openDocs));
  subscriptions.push(
    commands.registerCommand(
      "stripe.openWebhooksDebugConfigure",
      openWebhooksDebugConfigure
    )
  );
}

export function deactivate() {}
