import {ExtensionContext, commands, debug, env, window, workspace} from 'vscode';
import {GATelemetry, LocalTelemetry} from './telemetry';
import {ServerOptions, TransportKind} from 'vscode-languageclient';
import {Commands} from './commands';
import {Git} from './git';
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
import {StripeTerminal} from './stripeTerminal';
import {SurveyPrompt} from './surveyPrompt';
import {TelemetryPrompt} from './telemetryPrompt';
import path from 'path';

export function activate(this: any, context: ExtensionContext) {
  // disclosure of telemetry prompt
  new TelemetryPrompt(context).activate();

  // Telemetry
  const telemetry = getTelemetry();
  telemetry.sendEvent('activate');

  // Stripe CLi client
  const stripeClient = new StripeClient(telemetry);

  // CSAT survey prompt
  new SurveyPrompt(context).activate();

  Resource.initialize(context);

  const stripeTerminal = new StripeTerminal(stripeClient);

  const stripeCommands = new Commands(telemetry, stripeTerminal);

  // Activity bar view
  window.createTreeView('stripeDashboardView', {
    treeDataProvider: new StripeDashboardViewDataProvider(),
    showCollapseAll: false,
  });

  const stripeHelpView = window.createTreeView('stripeHelpView', {
    treeDataProvider: new StripeHelpViewDataProvider(),
    showCollapseAll: false,
  });
  stripeHelpView.message = 'This extension runs with your Stripe account in test mode.';

  const stripeEventsViewProvider = new StripeEventsDataProvider(stripeClient);
  window.createTreeView('stripeEventsView', {
    treeDataProvider: stripeEventsViewProvider,
    showCollapseAll: true,
  });

  const stripeLogsViewProvider = new StripeLogsDataProvider(stripeClient);
  window.createTreeView('stripeLogsView', {
    treeDataProvider: stripeLogsViewProvider,
    showCollapseAll: true,
  });

  // Debug provider
  debug.registerDebugConfigurationProvider('stripe', new StripeDebugProvider(telemetry));

  // Virtual document content provider for displaying event data
  workspace.registerTextDocumentContentProvider(
    'stripeEvent',
    new StripeEventTextDocumentContentProvider(stripeClient),
  );

  const git = new Git();

  // Stripe Linter
  const stripeLinter = new StripeLinter(telemetry, git);
  stripeLinter.activate();

  // Language Server for hover matching of Stripe methods
  const serverModule = context.asAbsolutePath(
    path.join('out', 'stripeLanguageServer', 'server.js'),
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

  StripeLanguageClient.activate(context, serverOptions, telemetry);

  // Commands
  const subscriptions = context.subscriptions;
  const boundRefreshEventsList = stripeCommands.refreshEventsList.bind(
    this,
    stripeEventsViewProvider,
  );

  const boundStartLogsStreaming = stripeCommands.startLogsStreaming.bind(
    this,
    stripeLogsViewProvider,
  );

  const boundStopLogsStreaming = stripeCommands.stopLogsStreaming.bind(
    this,
    stripeLogsViewProvider,
  );

  context.subscriptions.push(commands.registerCommand('stripe.openCLI', stripeCommands.openCLI));

  context.subscriptions.push(commands.registerCommand('stripe.login', stripeCommands.startLogin));

  subscriptions.push(
    commands.registerCommand('stripe.openWebhooksListen', stripeCommands.openWebhooksListen),
  );

  subscriptions.push(
    commands.registerCommand('stripe.startLogsStreaming', boundStartLogsStreaming),
  );

  subscriptions.push(commands.registerCommand('stripe.stopLogsStreaming', boundStopLogsStreaming));

  subscriptions.push(
    commands.registerCommand('stripe.openDashboardEvents', stripeCommands.openDashboardEvents),
  );

  subscriptions.push(
    commands.registerCommand('stripe.openDashboardLogs', stripeCommands.openDashboardLogs),
  );

  subscriptions.push(
    commands.registerCommand('stripe.openEventDetails', stripeCommands.openEventDetails),
  );

  subscriptions.push(
    commands.registerCommand('stripe.openDashboardApikeys', stripeCommands.openDashboardApikeys),
  );

  subscriptions.push(
    commands.registerCommand('stripe.openDashboardWebhooks', stripeCommands.openDashboardWebhooks),
  );

  subscriptions.push(commands.registerCommand('stripe.refreshEventsList', boundRefreshEventsList));

  subscriptions.push(
    commands.registerCommand('stripe.openTriggerEvent', () =>
      stripeCommands.openTriggerEvent(context),
    ),
  );

  subscriptions.push(commands.registerCommand('stripe.openSurvey', stripeCommands.openSurvey));

  subscriptions.push(
    commands.registerCommand('stripe.openTelemetryInfo', stripeCommands.openTelemetryInfo),
  );

  subscriptions.push(
    commands.registerCommand('stripe.openReportIssue', stripeCommands.openReportIssue),
  );

  subscriptions.push(commands.registerCommand('stripe.openDocs', stripeCommands.openDocs));
  subscriptions.push(
    commands.registerCommand(
      'stripe.openWebhooksDebugConfigure',
      stripeCommands.openWebhooksDebugConfigure,
    ),
  );

  subscriptions.push(commands.registerCommand('stripe.resendEvent', stripeCommands.resendEvent));

  subscriptions.push(
    commands.registerCommand('stripe.openDashboardEvent', stripeCommands.openDashboardEvent),
  );

  subscriptions.push(
    commands.registerCommand(
      'stripe.openDashboardLogFromTreeItem',
      stripeCommands.openDashboardLogFromTreeItem,
    ),
  );

  subscriptions.push(
    commands.registerCommand(
      'stripe.openDashboardLogFromTreeItemContextMenu',
      stripeCommands.openDashboardLogFromTreeItemContextMenu,
    ),
  );
}

export function deactivate() {}

/**
 * Checks for the explicit setting of the EXTENSION_MODE and
 * Implcitly checks by using the magic session string. This session value is used whenever an extension
 * is running on a development host. https://github.com/microsoft/vscode/issues/10272
 */
function getTelemetry() {
  if (process.env.EXTENSION_MODE === 'development' || env.sessionId === 'someValue.sessionId') {
    console.log('Extension is running in development mode. Using local telemetry instance');
    return new LocalTelemetry();
  } else {
    return GATelemetry.getInstance();
  }
}
