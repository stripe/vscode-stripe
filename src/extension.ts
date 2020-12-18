import {ExtensionContext, commands, debug, window, workspace} from 'vscode';
import {ServerOptions, TransportKind} from 'vscode-languageclient';
import {
  openCLI,
  openDashboardApikeys,
  openDashboardEvents,
  openDashboardLogs,
  openDashboardWebhooks,
  openDocs,
  openEventDetails,
  openLogsStreaming,
  openReportIssue,
  openSurvey,
  openTelemetryInfo,
  openTriggerEvent,
  openWebhooksDebugConfigure,
  openWebhooksListen,
  refreshEventsList,
  startLogin,
} from './commands';
import {Resource} from './resources';
import {StripeClient} from './stripeClient';
import {StripeDashboardViewDataProvider} from './stripeDashboardView';
import {StripeDebugProvider} from './stripeDebugProvider';
import {StripeEventTextDocumentContentProvider} from './stripeEventTextDocumentContentProvider';
import {StripeEventsDataProvider} from './stripeEventsView';
import {StripeHelpViewDataProvider} from './stripeHelpView';
import {StripeLanguageClient} from './stripeLanguageServer/client';
import {StripeLinter} from './stripeLinter';
import {StripeLogsDataProvider} from './stripeLogsView';
import {SurveyPrompt} from './surveyPrompt';
import {Telemetry} from './telemetry';
import {TelemetryPrompt} from './telemetryPrompt';
import path from 'path';

export function activate(this: any, context: ExtensionContext) {
  // Stripe CLi client
  const stripeClient = new StripeClient();

  // disclosure of telemetry prompt
  new TelemetryPrompt(context).activate();

  // Telemetry
  const telemetry = Telemetry.getInstance();
  telemetry.sendEvent('activate');

  // CSAT survey prompt
  new SurveyPrompt(context).activate();

  Resource.initialize(context);

  // Activity bar view
  window.createTreeView('stripeDashboardView', {
    treeDataProvider: new StripeDashboardViewDataProvider(),
    showCollapseAll: false,
  });

  window.createTreeView('stripeHelpView', {
    treeDataProvider: new StripeHelpViewDataProvider(),
    showCollapseAll: false,
  });

  const stripeEventsViewProvider = new StripeEventsDataProvider(stripeClient);
  window.createTreeView('stripeEventsView', {
    treeDataProvider: stripeEventsViewProvider,
    showCollapseAll: true,
  });

  const stripeLogsViewProvider = new StripeLogsDataProvider();
  window.createTreeView('stripeLogsView', {
    treeDataProvider: stripeLogsViewProvider,
    showCollapseAll: true,
  });

  // Debug provider
  debug.registerDebugConfigurationProvider('stripe', new StripeDebugProvider());

  // Virtual document content provider for displaying event data
  workspace.registerTextDocumentContentProvider(
    'stripeEvent',
    new StripeEventTextDocumentContentProvider(stripeClient)
  );

  // Stripe Linter
  const stripeLinter = new StripeLinter();
  stripeLinter.activate();

  // Language Server for hover matching of Stripe methods
  const serverModule = context.asAbsolutePath(
    path.join('out', 'stripeLanguageServer', 'server.js')
  );

  const debugOptions = {execArgv: ['--nolazy', '--inspect=6009']};

  const serverOptions: ServerOptions = {
    run: {module: serverModule, transport: TransportKind.ipc},
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  StripeLanguageClient.activate(context, serverOptions);

  // Commands
  const subscriptions = context.subscriptions;
  const boundRefreshEventsList = refreshEventsList.bind(
    this,
    stripeEventsViewProvider
  );

  context.subscriptions.push(
    commands.registerCommand('stripe.openCLI', openCLI)
  );

  context.subscriptions.push(
    commands.registerCommand('stripe.login', startLogin)
  );

  subscriptions.push(
    commands.registerCommand('stripe.openWebhooksListen', openWebhooksListen)
  );

  subscriptions.push(
    commands.registerCommand('stripe.openLogsStreaming', openLogsStreaming)
  );

  subscriptions.push(
    commands.registerCommand('stripe.openDashboardEvents', openDashboardEvents)
  );

  subscriptions.push(
    commands.registerCommand('stripe.openDashboardLogs', openDashboardLogs)
  );

  subscriptions.push(
    commands.registerCommand(
      'stripe.openEventDetails',
      openEventDetails
    )
  );

  subscriptions.push(
    commands.registerCommand(
      'stripe.openDashboardApikeys',
      openDashboardApikeys
    )
  );

  subscriptions.push(
    commands.registerCommand(
      'stripe.openDashboardWebhooks',
      openDashboardWebhooks
    )
  );

  subscriptions.push(
    commands.registerCommand('stripe.refreshEventsList', boundRefreshEventsList)
  );

  subscriptions.push(
    commands.registerCommand('stripe.openTriggerEvent', openTriggerEvent)
  );

  subscriptions.push(commands.registerCommand('stripe.openSurvey', openSurvey));

  subscriptions.push(
    commands.registerCommand('stripe.openTelemetryInfo', openTelemetryInfo)
  );

  subscriptions.push(
    commands.registerCommand('stripe.openReportIssue', openReportIssue)
  );

  subscriptions.push(commands.registerCommand('stripe.openDocs', openDocs));
  subscriptions.push(
    commands.registerCommand(
      'stripe.openWebhooksDebugConfigure',
      openWebhooksDebugConfigure
    )
  );
}

export function deactivate() {}
