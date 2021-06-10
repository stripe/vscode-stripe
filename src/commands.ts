import * as querystring from 'querystring';
import * as vscode from 'vscode';
import {CLICommand, StripeClient} from './stripeClient';
import {
  getConnectWebhookEndpoint,
  getRecentEvents,
  getWebhookEndpoint,
  recordEvent,
  setConnectWebhookEndpoint,
  setWebhookEndpoint,
} from './stripeWorkspaceState';
import {getExtensionInfo, showQuickPickWithItems} from './utils';
import osName = require('os-name');
import {StripeEventsViewProvider} from './stripeEventsView';
import {StripeLogsViewProvider} from './stripeLogsView';
import {StripeSamples} from './stripeSamples';
import {StripeTerminal} from './stripeTerminal';
import {StripeTreeItem} from './stripeTreeItem';
import {SurveyPrompt} from './surveyPrompt';
import {Telemetry} from './telemetry';

export class Commands {
  telemetry: Telemetry;
  terminal: StripeTerminal;
  context: vscode.ExtensionContext;

  supportedEvents: string[] = [
    'account.updated',
    'balance.available',
    'charge.captured',
    'charge.dispute.created',
    'charge.failed',
    'charge.refunded',
    'charge.succeeded',
    'checkout.session.async_payment_failed',
    'checkout.session.async_payment_succeeded',
    'checkout.session.completed',
    'customer.created',
    'customer.deleted',
    'customer.source.created',
    'customer.source.updated',
    'customer.subscription.created',
    'customer.subscription.deleted',
    'customer.subscription.updated',
    'customer.updated',
    'invoice.created',
    'invoice.finalized',
    'invoice.payment_failed',
    'invoice.payment_succeeded',
    'invoice.updated',
    'issuing_authorization.request',
    'issuing_card.created',
    'issuing_cardholder.created',
    'payment_intent.amount_capturable_updated',
    'payment_intent.canceled',
    'payment_intent.created',
    'payment_intent.payment_failed',
    'payment_intent.succeeded',
    'payment_method.attached',
    'plan.created',
    'plan.deleted',
    'plan.updated',
    'product.created',
    'product.deleted',
    'product.updated',
    'setup_intent.canceled',
    'setup_intent.created',
    'setup_intent.setup_failed',
    'setup_intent.succeeded',
    'subscription_schedule.canceled',
    'subscription_schedule.created',
    'subscription_schedule.released',
    'subscription_schedule.updated',
  ];

  constructor(
    telemetry: Telemetry,
    terminal: StripeTerminal,
    context: vscode.ExtensionContext,
    supportedEvents?: string[],
  ) {
    this.telemetry = telemetry;
    this.terminal = terminal;
    this.context = context;
    if (supportedEvents) {
      this.supportedEvents = supportedEvents;
    }
  }

  openWebhooksListen = async (options: any) => {
    this.telemetry.sendEvent('openWebhooksListen');

    const shouldPromptForURL = !options?.forwardTo && !options?.forwardConnectTo;

    const [forwardTo, forwardConnectTo] = await (async () => {
      if (!shouldPromptForURL) {
        return [options?.forwardTo, options?.forwardConnectTo];
      }

      const defaultForwardToURL = 'http://localhost:3000';

      const forwardToInput = await vscode.window.showInputBox({
        prompt:
          '[Account events] Enter local server URL to forward webhook events from your account',
        value: getWebhookEndpoint(this.context) || defaultForwardToURL,
      });
      const forwardConnectToInput = await vscode.window.showInputBox({
        prompt:
          '[Connect events] Enter local server URL to forward events from Connect applications (default: same URL as normal events)',
        value: getConnectWebhookEndpoint(this.context) || forwardToInput,
      });

      // save values for next invocation
      if (forwardToInput) {
        setWebhookEndpoint(this.context, forwardToInput);
      }
      if (forwardConnectToInput) {
        setConnectWebhookEndpoint(this.context, forwardConnectToInput);
      }

      return [forwardToInput, forwardConnectToInput];
    })();

    const invalidURLCharsRE = /[^\w-.~:\/?#\[\]@!$&'()*+,;=]/;
    const invalidURL = [forwardTo, forwardConnectTo].find((url) => invalidURLCharsRE.test(url));
    if (invalidURL) {
      await vscode.window.showErrorMessage(`Invalid URL: ${invalidURL}`);
      return;
    }

    // forwardTo and forwardConnectTo can be null if the user clicks away
    // and doesn't hit enter when clicking forward events to your local
    // machine
    if (forwardTo === undefined || forwardConnectTo === undefined) {
      return;
    }

    const skipVerify = await (async () => {
      if (options?.skipVerify !== undefined) {
        return options.skipVerify;
      }

      if (![forwardTo, forwardConnectTo].some((url) => url.startsWith('https'))) {
        return false;
      }

      const selected = await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: 'Skip SSL certificate verification?',
      });
      return selected === 'Yes';
    })();

    if (Array.isArray(options?.events)) {
      const invalidEventCharsRE = /[^a-z_.]/;
      const invalidEvent = options.events.find((e: string) => invalidEventCharsRE.test(e));
      if (invalidEvent) {
        await vscode.window.showErrorMessage(
          `Invalid chararacters found in event: ${invalidEvent}. For a list of all possible events, see https://stripe.com/docs/api/events/types.`,
        );
        return;
      }
    }
    const forwardToFlag = forwardTo ? ['--forward-to', forwardTo] : [];

    const forwardConnectToFlag = forwardConnectTo ? ['--forward-connect-to', forwardConnectTo] : [];

    const eventsFlag =
      Array.isArray(options?.events) && options.events.length > 0
        ? ['--events', options.events.join(',')]
        : [];

    const skipVerifyFlag = skipVerify ? ['--skip-verify'] : [];

    this.terminal.execute('listen', [
      ...forwardToFlag,
      ...forwardConnectToFlag,
      ...eventsFlag,
      ...skipVerifyFlag,
    ]);
  };

  startEventsStreaming = (stripeEventsViewProvider: StripeEventsViewProvider) => {
    this.telemetry.sendEvent('startEventsStreaming');
    stripeEventsViewProvider.startStreaming();
  };

  stopEventsStreaming = (stripeEventsViewProvider: StripeEventsViewProvider) => {
    this.telemetry.sendEvent('stopEventsStreaming');
    stripeEventsViewProvider.stopStreaming();
  };

  clearRecentEvents = (stripeEventsViewProvider: StripeEventsViewProvider) => {
    this.telemetry.sendEvent('clearRecentEvents');
    stripeEventsViewProvider.clearItems();
  };

  startLogsStreaming = (stripeLogsViewProvider: StripeLogsViewProvider) => {
    this.telemetry.sendEvent('startLogsStreaming');
    stripeLogsViewProvider.startStreaming();
  };

  stopLogsStreaming = (stripeLogsViewProvider: StripeLogsViewProvider) => {
    this.telemetry.sendEvent('stopLogsStreaming');
    stripeLogsViewProvider.stopStreaming();
  };

  clearRecentLogs = (stripeLogsViewProvider: StripeLogsViewProvider) => {
    this.telemetry.sendEvent('clearRecentLogs');
    stripeLogsViewProvider.clearItems();
  };

  startLogin = () => {
    this.telemetry.sendEvent('login');
    this.terminal.execute('login');
  };

  openCLI = () => {
    this.telemetry.sendEvent('openCLI');
    const terminal = vscode.window.createTerminal('Stripe');
    terminal.sendText('stripe ', false);
    terminal.show();
  };

  openDashboardApikeys = () => {
    this.telemetry.sendEvent('openDashboardApikeys');
    vscode.env.openExternal(vscode.Uri.parse('https://dashboard.stripe.com/test/apikeys'));
  };

  openDashboardEvent = (stripeTreeItem: StripeTreeItem) => {
    this.telemetry.sendEvent('openDashboardEvent');
    vscode.env.openExternal(
      vscode.Uri.parse(`https://dashboard.stripe.com/test/events/${stripeTreeItem.metadata.id}`),
    );
  };

  openDashboardEvents = () => {
    this.telemetry.sendEvent('openDashboardEvents');
    vscode.env.openExternal(vscode.Uri.parse('https://dashboard.stripe.com/test/events'));
  };

  openDashboardLog = (stripeTreeItem: StripeTreeItem) => {
    this.telemetry.sendEvent('openDashboardLog');
    vscode.env.openExternal(
      vscode.Uri.parse(`https://dashboard.stripe.com/test/logs/${stripeTreeItem.metadata.id}`),
    );
  };

  openDashboardLogs = () => {
    this.telemetry.sendEvent('openDashboardLogs');
    vscode.env.openExternal(vscode.Uri.parse('https://dashboard.stripe.com/test/logs'));
  };

  openDashboardWebhooks = () => {
    this.telemetry.sendEvent('openDashboardWebhooks');
    vscode.env.openExternal(vscode.Uri.parse('https://dashboard.stripe.com/test/webhooks'));
  };

  openSamples = () => {
    this.telemetry.sendEvent('openSamples');
    vscode.env.openExternal(vscode.Uri.parse('https://github.com/stripe-samples'));
  };

  openEventDetails = (data: any) => {
    this.telemetry.sendEvent('openEventDetails');
    const {id, type} = data;
    const filename = `${type} (${id})`;
    const uri = vscode.Uri.parse(`stripeEvent:${filename}`);
    vscode.workspace
      .openTextDocument(uri)
      .then((doc) => vscode.languages.setTextDocumentLanguage(doc, 'json'))
      .then((doc) => vscode.window.showTextDocument(doc, {preview: false}));
  };

  openLogDetails = (data: any) => {
    this.telemetry.sendEvent('openLogDetails');
    const {id} = data;
    const filename = id;
    const uri = vscode.Uri.parse(`stripeLog:${filename}`);
    vscode.workspace
      .openTextDocument(uri)
      .then((doc) => vscode.languages.setTextDocumentLanguage(doc, 'json'))
      .then((doc) => vscode.window.showTextDocument(doc, {preview: false}));
  };

  openTriggerEvent = async (
    extensionContext: vscode.ExtensionContext,
    stripeClient: StripeClient,
    stripeOutputChannel: vscode.OutputChannel,
  ) => {
    this.telemetry.sendEvent('openTriggerEvent');
    const events = this.buildTriggerEventsList(this.supportedEvents, extensionContext);
    const eventName = await showQuickPickWithItems('Enter event name to trigger', events);
    if (eventName) {
      const triggerProcess = await stripeClient.getOrCreateCLIProcess(CLICommand.Trigger, [
        eventName,
      ]);

      if (!triggerProcess) {
        vscode.window.showErrorMessage(`Failed to trigger event: ${eventName}`);
        return;
      }

      triggerProcess.stdout.on('data', (chunk) => {
        stripeOutputChannel.append(chunk.toString());
      });
      stripeOutputChannel.show();

      recordEvent(extensionContext, eventName);
    }
  };

  buildTriggerEventsList = (
    events: string[],
    extensionContext: vscode.ExtensionContext,
  ): vscode.QuickPickItem[] => {
    const historicEvents = getRecentEvents(extensionContext, 20);

    // Get a unique list of events and take the first 5
    const recentEvents = [
      ...new Set<string>(historicEvents.filter((e: string) => events.includes(e))),
    ].slice(0, 5);

    const remainingEvents = events.filter((e) => !recentEvents.includes(e));

    const recentItems = recentEvents.map((e) => {
      return {
        label: e,
        description: 'recently triggered',
      };
    });

    const remainingItems = remainingEvents.map((e) => {
      return {
        label: e,
      };
    });
    return [...recentItems, ...remainingItems];
  };

  openReportIssue = () => {
    this.telemetry.sendEvent('openReportIssue');
    const {name, publisher} = getExtensionInfo();

    vscode.commands.executeCommand('vscode.openIssueReporter', {
      extensionId: `${publisher}.${name}`,
    });
  };

  openWebhooksDebugConfigure = () => {
    vscode.commands.executeCommand('workbench.action.debug.configure');
  };

  openDocs = () => {
    this.telemetry.sendEvent('openDocs');
    vscode.env.openExternal(vscode.Uri.parse('https://stripe.com/docs/stripe-vscode'));
  };

  openSurvey = (surveyPrompt: SurveyPrompt) => {
    this.telemetry.sendEvent('openSurvey');
    const extensionInfo = getExtensionInfo();

    const query = querystring.stringify({
      platform: encodeURIComponent(osName()),
      vscodeVersion: encodeURIComponent(vscode.version),
      extensionVersion: encodeURIComponent(extensionInfo.version),
      machineId: encodeURIComponent(vscode.env.machineId),
    });

    const url = `https://stri.pe/vscode-feedback?${query}`;
    vscode.env.openExternal(vscode.Uri.parse(url));
    surveyPrompt.updateSurveySettings();
  };

  openTelemetryInfo = () => {
    vscode.env.openExternal(
      vscode.Uri.parse('https://code.visualstudio.com/docs/getstarted/telemetry'),
    );
  };

  resendEvent = (stripeTreeItem: StripeTreeItem) => {
    this.telemetry.sendEvent('resendEvent');
    this.terminal.execute('events', ['resend', stripeTreeItem.metadata.id]);
  };

  createStripeSample = async (stripeSamples: StripeSamples) => {
    this.telemetry.sendEvent('createStripeSample');
    await stripeSamples.selectAndCloneSample();
  };
}
