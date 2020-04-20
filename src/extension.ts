
import {
  commands,
  debug,
  window,
  ExtensionContext,
} from "vscode";

import {
	ServerOptions,
	TransportKind,
} from 'vscode-languageclient';

import path from 'path'
import { StripeViewDataProvider } from "./stripeView";
import { StripeEventsDataProvider } from "./stripeEventsView";
import { StripeHelpViewDataProvider } from "./stripeHelpView";
import { StripeDebugProvider } from "./stripeDebugProvider";
import { StripeLinter } from "./stripeLinter";
import { StripeLanguageClient } from "./languageServer/client";
import { StripeClient } from "./stripeClient";
import { Resource } from "./resources";
import { SurveyPrompt } from "./surveyPrompt";
import { Telemetry } from "./telemetry";

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
  openTriggerEvent,
  openSurvey,
  openReportIssue,
  openDocs,
} from "./commands";

export async function activate(this: any, context: ExtensionContext) {
  // Stripe CLi client
  let stripeClient = new StripeClient();

  // Telemetry
  const telemetry = Telemetry.getInstance();
  telemetry.sendEvent("activate");

  // CSAT survey prompt
  let surveyPrompt = new SurveyPrompt(context).activate();

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

  // Language Server for hover matching of Stripe methods
  let serverModule = context.asAbsolutePath(
    path.join("out", "languageServer", "stripeLanguageServer.js")
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
    commands.registerCommand("stripe.openReportIssue", openReportIssue)
  );

  subscriptions.push(commands.registerCommand("stripe.openDocs", openDocs));
}

export function deactivate() {}
