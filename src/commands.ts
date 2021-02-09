import * as querystring from 'querystring';
import * as vscode from 'vscode';
import {getExtensionInfo, showQuickPickWithItems, showQuickPickWithValues} from './utils';
import {getRecentEvents, recordEvent} from './stripeWorkspaceState';
import osName = require('os-name');
import {StripeEventsDataProvider} from './stripeEventsView';
import {StripeLogsDataProvider} from './stripeLogsView';
import {StripeTerminal} from './stripeTerminal';
import {StripeTreeItem} from './stripeTreeItem';
import {Telemetry} from './telemetry';

export class Commands {
  telemetry: Telemetry;
  terminal: StripeTerminal;

  supportedEvents: string[] = [
    'balance.available',
    'charge.captured',
    'charge.dispute.created',
    'charge.failed',
    'charge.refunded',
    'charge.succeeded',
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

  constructor(telemetry: Telemetry, terminal: StripeTerminal, supportedEvents?: string[]) {
    this.telemetry = telemetry;
    this.terminal = terminal;
    if (supportedEvents) {
      this.supportedEvents = supportedEvents;
    }
  }

  openWebhooksListen = async (options: any) => {
    this.telemetry.sendEvent('openWebhooksListen');

    const shouldPromptForURL =
      !options.forwardTo &&
      !options.forwardConnectTo &&
      (await showQuickPickWithValues(
        'Do you want to forward webhook events to your local server?',
        ['Yes', 'No'],
      )) === 'Yes';

    const forwardTo = shouldPromptForURL
      ? await vscode.window.showInputBox({
          prompt: 'Enter local server URL to forward webhook events to',
          value: 'http://localhost:3000',
        })
      : options.forwardTo;

    const forwardConnectTo = shouldPromptForURL
      ? await vscode.window.showInputBox({
          prompt:
            'Enter local server URL to forward Connect webhook events to (default: same as normal events)',
          value: forwardTo || 'http://localhost:3000',
        })
      : options.forwardConnectTo;

    const invalidURLCharsRE = /[^\w-.~:\/?#\[\]@!$&'()*+,;=]/;
    const invalidURL = [forwardTo, forwardConnectTo].find((url) => invalidURLCharsRE.test(url));
    if (invalidURL) {
      await vscode.window.showErrorMessage(`Invalid URL: ${invalidURL}`);
      return;
    }

    if (Array.isArray(options.events)) {
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
      Array.isArray(options.events) && options.events.length > 0
        ? ['--events', options.events.join(',')]
        : [];

    this.terminal.execute('listen', [...forwardToFlag, ...forwardConnectToFlag, ...eventsFlag]);
  };

  startLogsStreaming = (stripeLogsDataProvider: StripeLogsDataProvider) => {
    this.telemetry.sendEvent('startLogsStreaming');
    stripeLogsDataProvider.startLogsStreaming();
  };

  stopLogsStreaming = (stripeLogsDataProvider: StripeLogsDataProvider) => {
    this.telemetry.sendEvent('stopLogsStreaming');
    stripeLogsDataProvider.stopLogsStreaming();
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

  openDashboardLogs = () => {
    this.telemetry.sendEvent('openDashboardLogs');
    vscode.env.openExternal(vscode.Uri.parse('https://dashboard.stripe.com/test/logs'));
  };

  openDashboardWebhooks = () => {
    this.telemetry.sendEvent('openDashboardWebhooks');
    vscode.env.openExternal(vscode.Uri.parse('https://dashboard.stripe.com/test/webhooks'));
  };

  openEventDetails = (data: any) => {
    this.telemetry.sendEvent('openEventDetails');
    const {id, type} = data;
    const filename = `${type} (${id})`;
    const uri = vscode.Uri.parse(`stripeEvent:${filename}`);
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Window,
        title: 'Fetching Stripe event details',
      },
      async () => {
        const doc = await vscode.workspace.openTextDocument(uri);
        vscode.languages.setTextDocumentLanguage(doc, 'json');
        vscode.window.showTextDocument(doc, {preview: false});
      },
    );
  };

  refreshEventsList = (stripeEventsViewProvider: StripeEventsDataProvider) => {
    this.telemetry.sendEvent('refreshEventsList');
    stripeEventsViewProvider.refresh();
  };

  openTriggerEvent = async (extensionContext: vscode.ExtensionContext) => {
    this.telemetry.sendEvent('openTriggerEvent');
    const events = this.buildTriggerEventsList(this.supportedEvents, extensionContext);
    const eventName = await showQuickPickWithItems('Enter event name to trigger', events);
    if (eventName) {
      this.terminal.execute('trigger', [eventName]);
      recordEvent(extensionContext, eventName);

      // Trigger events refresh after 5s as we don't have a way to know when it has finished.
      setTimeout(() => {
        vscode.commands.executeCommand('stripe.refreshEventsList');
      }, 5000);
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

  openSurvey = () => {
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
}
