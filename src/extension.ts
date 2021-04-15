import {Disposable, ExtensionContext, commands, debug, env, window, workspace} from 'vscode';
import {
  GATelemetry,
  LocalTelemetry,
  StripeAnalyticsServiceTelemetry,
  TelemetryMigration,
} from './telemetry';
import {ServerOptions, TransportKind} from 'vscode-languageclient';
import {Commands} from './commands';
import {Git} from './git';
import {StripeClient} from './stripeClient';
import {StripeDashboardViewProvider} from './stripeDashboardView';
import {StripeDebugProvider} from './stripeDebugProvider';
import {StripeEventTextDocumentContentProvider} from './stripeEventTextDocumentContentProvider';
import {StripeEventsViewProvider} from './stripeEventsView';
import {StripeHelpViewProvider} from './stripeHelpView';
import {StripeLanguageClient} from './stripeLanguageServer/client';
import {StripeLinter} from './stripeLinter';
import {StripeLogsViewProvider} from './stripeLogsView';
import {StripeTerminal} from './stripeTerminal';
import {SurveyPrompt} from './surveyPrompt';
import {TelemetryPrompt} from './telemetryPrompt';
import {initializeStripeWorkspaceState} from './stripeWorkspaceState';
import path from 'path';

export function activate(this: any, context: ExtensionContext) {
  initializeStripeWorkspaceState(context);

  new TelemetryPrompt(context).activate();
  new SurveyPrompt(context).activate();

  const telemetry = getTelemetry(context);
  telemetry.sendEvent('activate');

  const stripeOutputChannel = window.createOutputChannel('Stripe');

  const stripeClient = new StripeClient(telemetry, context);

  const stripeEventsViewProvider = new StripeEventsViewProvider(stripeClient, context);
  window.createTreeView('stripeEventsView', {
    treeDataProvider: stripeEventsViewProvider,
    showCollapseAll: true,
  });

  const stripeLogsViewProvider = new StripeLogsViewProvider(stripeClient);
  window.createTreeView('stripeLogsView', {
    treeDataProvider: stripeLogsViewProvider,
    showCollapseAll: true,
  });

  window.createTreeView('stripeDashboardView', {
    treeDataProvider: new StripeDashboardViewProvider(),
    showCollapseAll: false,
  });

  const stripeHelpView = window.createTreeView('stripeHelpView', {
    treeDataProvider: new StripeHelpViewProvider(),
    showCollapseAll: false,
  });
  stripeHelpView.message = 'This extension runs with your Stripe account in test mode.';

  debug.registerDebugConfigurationProvider('stripe', new StripeDebugProvider(telemetry));

  workspace.registerTextDocumentContentProvider(
    'stripeEvent',
    new StripeEventTextDocumentContentProvider(context),
  );

  const git = new Git();
  new StripeLinter(telemetry, git).activate();

  // Start language Server for hover matching of Stripe methods
  const serverModule = context.asAbsolutePath(
    path.join('dist', 'stripeLanguageServer', 'server.js'),
  );

  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: {execArgv: ['--nolazy', '--inspect=6009']},
    },
  };

  StripeLanguageClient.activate(context, serverOptions, telemetry);

  const stripeTerminal = new StripeTerminal(stripeClient);

  const stripeCommands = new Commands(telemetry, stripeTerminal, context);

  const commandCallbackPairs: [string, (...args: any[]) => any][] = [
    ['stripe.login', stripeCommands.startLogin],
    ['stripe.openCLI', stripeCommands.openCLI],
    ['stripe.openDashboardApikeys', stripeCommands.openDashboardApikeys],
    ['stripe.openDashboardEvent', stripeCommands.openDashboardEvent],
    ['stripe.openDashboardEvents', stripeCommands.openDashboardEvents],
    ['stripe.openDashboardLogFromTreeItem', stripeCommands.openDashboardLogFromTreeItem],
    [
      'stripe.openDashboardLogFromTreeItemContextMenu',
      stripeCommands.openDashboardLogFromTreeItemContextMenu,
    ],
    ['stripe.openDashboardLogs', stripeCommands.openDashboardLogs],
    ['stripe.openDashboardWebhooks', stripeCommands.openDashboardWebhooks],
    ['stripe.openDocs', stripeCommands.openDocs],
    ['stripe.openEventDetails', stripeCommands.openEventDetails],
    ['stripe.openReportIssue', stripeCommands.openReportIssue],
    ['stripe.openSamples', stripeCommands.openSamples],
    ['stripe.openSurvey', stripeCommands.openSurvey],
    ['stripe.openTelemetryInfo', stripeCommands.openTelemetryInfo],
    [
      'stripe.openTriggerEvent',
      () => stripeCommands.openTriggerEvent(context, stripeClient, stripeOutputChannel),
    ],
    ['stripe.openWebhooksDebugConfigure', stripeCommands.openWebhooksDebugConfigure],
    ['stripe.openWebhooksListen', stripeCommands.openWebhooksListen],
    ['stripe.resendEvent', stripeCommands.resendEvent],
    [
      'stripe.startEventsStreaming',
      () => stripeCommands.startEventsStreaming(stripeEventsViewProvider),
    ],
    [
      'stripe.stopEventsStreaming',
      () => stripeCommands.stopEventsStreaming(stripeEventsViewProvider),
    ],
    ['stripe.clearRecentEvents', () => stripeCommands.clearRecentEvents(stripeEventsViewProvider)],
    ['stripe.startLogsStreaming', () => stripeCommands.startLogsStreaming(stripeLogsViewProvider)],
    ['stripe.stopLogsStreaming', () => stripeCommands.stopLogsStreaming(stripeLogsViewProvider)],
    ['stripe.clearRecentLogs', () => stripeCommands.clearRecentLogs(stripeLogsViewProvider)],
  ];

  const registeredCommands: Disposable[] = commandCallbackPairs.map(([command, callback]) =>
    commands.registerCommand(command, callback),
  );

  context.subscriptions.push(...registeredCommands);
}

export function deactivate() {}

/**
 * Checks for the explicit setting of the EXTENSION_MODE and
 * Implcitly checks by using the magic session string. This session value is used whenever an extension
 * is running on a development host. https://github.com/microsoft/vscode/issues/10272
 */
function getTelemetry(extensionContext: ExtensionContext) {
  if (process.env.EXTENSION_MODE === 'development' || env.sessionId === 'someValue.sessionId') {
    console.log('Extension is running in development mode. Using local telemetry instance');
    return new LocalTelemetry();
  } else {
    return new TelemetryMigration(
      GATelemetry.getInstance(),
      new StripeAnalyticsServiceTelemetry(extensionContext),
    );
  }
}
