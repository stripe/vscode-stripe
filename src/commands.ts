import * as vscode from "vscode";
import * as querystring from "querystring";
import { StripeEventsDataProvider } from "./stripeEventsView";
import { getExtensionInfo } from "./utils";
import osName = require("os-name");

export function openWebhooksListen(localUrl: string, events?: Array<string>) {
  let terminal = vscode.window.createTerminal("Stripe");

  let commandArgs = ["stripe listen"];

  if (localUrl && typeof localUrl == "string") {
    commandArgs.push(`--forward-to=${localUrl}`);
  }

  if (events && events.length > 0) {
    commandArgs.push(`--events=${events.join(",")}`);
  }

  let command = commandArgs.join(" ");
  terminal.sendText(command);
  terminal.show();
}

export function openLogsStreaming() {
  let terminal = vscode.window.createTerminal("Stripe");
  terminal.sendText("stripe logs tail");
  terminal.show();
}

export function startLogin() {
  let terminal = vscode.window.createTerminal("Stripe");
  terminal.sendText("stripe login");
  terminal.show();
}

export function openCLI() {
  let terminal = vscode.window.createTerminal("Stripe");
  terminal.sendText("stripe ", false);
  terminal.show();
}

export function openDashboardApikeys() {
  vscode.env.openExternal(
    vscode.Uri.parse("https://dashboard.stripe.com/test/apikeys")
  );
}
export function openDashboardEvents() {
  vscode.env.openExternal(
    vscode.Uri.parse("https://dashboard.stripe.com/test/events")
  );
}
export function openDashboardLogs() {
  vscode.env.openExternal(
    vscode.Uri.parse("https://dashboard.stripe.com/test/logs")
  );
}

export function openDashboardWebhooks() {
  vscode.env.openExternal(
    vscode.Uri.parse("https://dashboard.stripe.com/test/webhooks")
  );
}

export function openDashboardEventDetails(data: any) {
  let id = data.id;
  let url = `https://dashboard.stripe.com/test/events/${id}`;
  vscode.env.openExternal(vscode.Uri.parse(url));
}

export function refreshEventsList(
  stripeEventsViewProvider: StripeEventsDataProvider
) {
  stripeEventsViewProvider.refresh();
}

export async function triggerEvent() {
  let eventName = await vscode.window.showInputBox({
    prompt: "Enter event name to trigger",
    placeHolder: "payment_intent.created",
  });

  if (eventName) {
    let terminal = vscode.window.createTerminal("Stripe");
    terminal.sendText(`stripe trigger ${eventName}`);
    terminal.show();
  }
}

export function openReportIssue() {
  let { name, publisher } = getExtensionInfo();

  vscode.commands.executeCommand("vscode.openIssueReporter", {
    extensionId: `${publisher}.${name}`,
  });
}

export function openDocs() {
  vscode.env.openExternal(
    vscode.Uri.parse("https://stripe.com/docs/development")
  );
}

export function openSurvey() {
  let extensionInfo = getExtensionInfo();

  const query = querystring.stringify({
    platform: encodeURIComponent(osName()),
    vscodeVersion: encodeURIComponent(vscode.version),
    extensionVersion: encodeURIComponent(extensionInfo.version),
    machineId: encodeURIComponent(vscode.env.machineId),
  });

  const url = `https://forms.gle/eP2mtQ8Jmra4pZBP7?${query}`;
  vscode.env.openExternal(vscode.Uri.parse(url));
}
