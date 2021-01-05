import * as querystring from 'querystring';
import * as vscode from 'vscode';
import {getExtensionInfo, showQuickPickWithValues} from './utils';
import osName = require('os-name');
import {StripeEventsDataProvider} from './stripeEventsView';
import {StripeTerminal} from './stripeTerminal';
import {StripeTreeItem} from './stripeTreeItem';
import {Telemetry} from './telemetry';

const telemetry = Telemetry.getInstance();

const terminal = new StripeTerminal();

export async function openWebhooksListen(options: any) {
  telemetry.sendEvent('openWebhooksListen');

  const shouldPromptForURL = !options.forwardTo && !options.forwardConnectTo &&
    await showQuickPickWithValues(
      'Do you want to forward webhook events to your local server?',
      ['Yes', 'No']
    ) === 'Yes';

  const forwardTo = shouldPromptForURL
    ? await vscode.window.showInputBox(
        {
          prompt: 'Enter local server URL to forward webhook events to',
          value: 'http://localhost:3000',
        }
      )
    : options.forwardTo;

  const forwardConnectTo = shouldPromptForURL
    ? await vscode.window.showInputBox(
        {
          prompt: 'Enter local server URL to forward Connect webhook events to (default: same as normal events)',
          value: forwardTo || 'http://localhost:3000',
        }
      )
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
      await vscode.window.showErrorMessage(`Invalid chararacters found in event: ${invalidEvent}. For a list of all possible events, see https://stripe.com/docs/api/events/types.`);
      return;
    }
  }

  const forwardToFlag = forwardTo
    ? ['--forward-to', forwardTo]
    : [];

  const forwardConnectToFlag = forwardConnectTo
    ? ['--forward-connect-to', forwardConnectTo]
    : [];

  const eventsFlag = Array.isArray(options.events) && options.events.length > 0
    ? ['--events', options.events.join(',')]
    : [];

  terminal.execute(
    'listen',
    [
      ...forwardToFlag,
      ...forwardConnectToFlag,
      ...eventsFlag
    ]
  );
}

export function openLogsStreaming() {
  telemetry.sendEvent('openLogsStreaming');
  terminal.execute('logs', ['tail']);
}

export function startLogin() {
  telemetry.sendEvent('login');
  terminal.execute('login');
}

export function openCLI() {
  telemetry.sendEvent('openCLI');
  const terminal = vscode.window.createTerminal('Stripe');
  terminal.sendText('stripe ', false);
  terminal.show();
}

export function openDashboardApikeys() {
  telemetry.sendEvent('openDashboardApikeys');
  vscode.env.openExternal(
    vscode.Uri.parse('https://dashboard.stripe.com/test/apikeys')
  );
}

export function openDashboardEvent(stripeTreeItem: StripeTreeItem) {
  telemetry.sendEvent('openDashboardEvent');
  vscode.env.openExternal(
    vscode.Uri.parse(`https://dashboard.stripe.com/test/events/${stripeTreeItem.metadata.id}`)
  );
}

export function openDashboardEvents() {
  telemetry.sendEvent('openDashboardEvents');
  vscode.env.openExternal(
    vscode.Uri.parse('https://dashboard.stripe.com/test/events')
  );
}
export function openDashboardLogs() {
  telemetry.sendEvent('openDashboardLogs');
  vscode.env.openExternal(
    vscode.Uri.parse('https://dashboard.stripe.com/test/logs')
  );
}

export function openDashboardWebhooks() {
  telemetry.sendEvent('openDashboardWebhooks');
  vscode.env.openExternal(
    vscode.Uri.parse('https://dashboard.stripe.com/test/webhooks')
  );
}

export function openEventDetails(data: any) {
  telemetry.sendEvent('openEventDetails');
  const {id, type} = data;
  const filename = `${type} (${id})`;
  const uri = vscode.Uri.parse(`stripeEvent:${filename}`);
  vscode.window.withProgress({
      location: vscode.ProgressLocation.Window,
      title: 'Fetching Stripe event details',
  }, async () => {
    const doc = await vscode.workspace.openTextDocument(uri);
    vscode.languages.setTextDocumentLanguage(doc, 'json');
    vscode.window.showTextDocument(doc, {preview: false});
  });
}

export function refreshEventsList(
  stripeEventsViewProvider: StripeEventsDataProvider
) {
  telemetry.sendEvent('refreshEventsList');
  stripeEventsViewProvider.refresh();
}

export async function openTriggerEvent() {
  telemetry.sendEvent('openTriggerEvent');

  const eventName = await showQuickPickWithValues('Enter event name to trigger', [
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
  ]);

  if (eventName) {
    terminal.execute('trigger', [eventName]);

    // Trigger events refresh after 5s as we don't have a way to know when it has finished.
    setTimeout(() => {
      vscode.commands.executeCommand('stripe.refreshEventsList');
    }, 5000);
  }
}

export function openReportIssue() {
  telemetry.sendEvent('openReportIssue');
  const {name, publisher} = getExtensionInfo();

  vscode.commands.executeCommand('vscode.openIssueReporter', {
    extensionId: `${publisher}.${name}`,
  });
}

export function openWebhooksDebugConfigure() {
  vscode.commands.executeCommand('workbench.action.debug.configure');
}

export function openDocs() {
  telemetry.sendEvent('openDocs');
  vscode.env.openExternal(
    vscode.Uri.parse('https://stripe.com/docs/development')
  );
}

export function openSurvey() {
  telemetry.sendEvent('openSurvey');
  const extensionInfo = getExtensionInfo();

  const query = querystring.stringify({
    platform: encodeURIComponent(osName()),
    vscodeVersion: encodeURIComponent(vscode.version),
    extensionVersion: encodeURIComponent(extensionInfo.version),
    machineId: encodeURIComponent(vscode.env.machineId),
  });

  const url = `https://forms.gle/eP2mtQ8Jmra4pZBP7?${query}`;
  vscode.env.openExternal(vscode.Uri.parse(url));
}

export function openTelemetryInfo() {
  vscode.env.openExternal(
    vscode.Uri.parse('https://code.visualstudio.com/docs/getstarted/telemetry')
  );
}

export function resendEvent(stripeTreeItem: StripeTreeItem) {
  telemetry.sendEvent('resendEvent');
  terminal.execute('events', ['resend', stripeTreeItem.metadata.id]);
}
