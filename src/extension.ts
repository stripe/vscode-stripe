import {
  Disposable,
  ExtensionContext,
  commands,
  debug,
  env,
  languages,
  window,
  workspace,
} from 'vscode';
import {EVENT_ID_REGEXP, LOG_ID_REGEXP} from './resourceIDs';
import {NoOpTelemetry, StripeAnalyticsServiceTelemetry} from './telemetry';
import {ServerOptions, TransportKind} from 'vscode-languageclient';
import {
  initializeStripeWorkspaceState,
  retrieveEventDetails,
  retrieveLogDetails,
} from './stripeWorkspaceState';
import {Commands} from './commands';
import {Git} from './git';
import {StripeClient} from './stripeClient';
import {StripeDaemon} from './daemon/stripeDaemon';
import {StripeDebugProvider} from './stripeDebugProvider';
import {StripeEventsViewProvider} from './stripeEventsView';
import {StripeHelpViewProvider} from './stripeHelpView';
import {StripeLanguageClient} from './languageServerClient';
import {StripeLinter} from './stripeLinter';
import {StripeLogsDashboardLinkProvider} from './stripeLogsDashboardLinkProvider';
import {StripeLogsViewProvider} from './stripeLogsView';
import {StripeQuickLinksViewProvider} from './stripeQuickLinksView';
import {StripeResourceDocumentContentProvider} from './stripeResourceDocumentContentProvider';
import {StripeSamples} from './stripeSamples';
import {StripeSamplesViewProvider} from './stripeSamplesView';
import {StripeTerminal} from './stripeTerminal';
import {SurveyPrompt} from './surveyPrompt';
import {TelemetryPrompt} from './telemetryPrompt';
import path from 'path';

export function activate(this: any, context: ExtensionContext) {
  initializeStripeWorkspaceState(context);

  new TelemetryPrompt(context).activate();
  const surveyPrompt: SurveyPrompt = new SurveyPrompt(context);
  surveyPrompt.activate();

  const telemetry = getTelemetry(context);
  telemetry.sendEvent('activate');

  const stripeOutputChannel = window.createOutputChannel('Stripe');

  const stripeClient = new StripeClient(telemetry, context);
  const stripeDaemon = new StripeDaemon(stripeClient);
  const stripeSamples = new StripeSamples(stripeClient, stripeDaemon);

  const stripeEventsViewProvider = new StripeEventsViewProvider(
    stripeClient,
    stripeDaemon,
    context,
  );
  window.createTreeView('stripeEventsView', {
    treeDataProvider: stripeEventsViewProvider,
    showCollapseAll: true,
  });

  const stripeLogsViewProvider = new StripeLogsViewProvider(stripeClient, stripeDaemon, context);
  window.createTreeView('stripeLogsView', {
    treeDataProvider: stripeLogsViewProvider,
    showCollapseAll: true,
  });

  window.createTreeView('stripeSamplesView', {
    treeDataProvider: new StripeSamplesViewProvider(),
    showCollapseAll: false,
  });

  window.createTreeView('stripeQuickLinksView', {
    treeDataProvider: new StripeQuickLinksViewProvider(),
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
    new StripeResourceDocumentContentProvider(context, EVENT_ID_REGEXP, retrieveEventDetails),
  );

  workspace.registerTextDocumentContentProvider(
    'stripeLog',
    new StripeResourceDocumentContentProvider(context, LOG_ID_REGEXP, retrieveLogDetails),
  );

  languages.registerDocumentLinkProvider(
    {scheme: 'stripeLog'},
    new StripeLogsDashboardLinkProvider(),
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
    ['stripe.createStripeSample', () => stripeCommands.createStripeSample(stripeSamples)],
    ['stripe.login', stripeCommands.startLogin],
    ['stripe.openCLI', stripeCommands.openCLI],
    ['stripe.openDashboardApikeys', stripeCommands.openDashboardApikeys],
    ['stripe.openDashboardEvent', stripeCommands.openDashboardEvent],
    ['stripe.openDashboardEvents', stripeCommands.openDashboardEvents],
    ['stripe.openDashboardLog', stripeCommands.openDashboardLog],
    ['stripe.openDashboardLogs', stripeCommands.openDashboardLogs],
    ['stripe.openDashboardWebhooks', stripeCommands.openDashboardWebhooks],
    ['stripe.openDocs', stripeCommands.openDocs],
    ['stripe.openEventDetails', stripeCommands.openEventDetails],
    ['stripe.openLogDetails', stripeCommands.openLogDetails],
    ['stripe.openReportIssue', stripeCommands.openReportIssue],
    ['stripe.openSamples', stripeCommands.openSamples],
    ['stripe.openSurvey', () => stripeCommands.openSurvey(surveyPrompt)],
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
    console.log('Extension is running in development mode. Not emitting Telemetry');
    return new NoOpTelemetry();
  } else {
    return new StripeAnalyticsServiceTelemetry(extensionContext);
  }
}
