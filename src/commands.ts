import * as vscode from "vscode";
import * as querystring from "querystring";
import { StripeEventsDataProvider } from "./stripeEventsView";
import { getExtensionInfo } from "./utils";
import osName = require("os-name");
import { Telemetry } from "./telemetry";

const telemetry = Telemetry.getInstance();

export function openWebhooksListen(localUrl: string, events?: Array<string>) {
  telemetry.sendEvent("openWebhooksListen");

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
  telemetry.sendEvent("openLogsStreaming");
  let terminal = vscode.window.createTerminal("Stripe");
  terminal.sendText("stripe logs tail");
  terminal.show();
}

export function startLogin() {
  telemetry.sendEvent("login");
  let terminal = vscode.window.createTerminal("Stripe");
  terminal.sendText("stripe login");
  terminal.show();
}

export function openCLI() {
  telemetry.sendEvent("openCLI");
  let terminal = vscode.window.createTerminal("Stripe");
  terminal.sendText("stripe ", false);
  terminal.show();
}

export function openDashboardApikeys() {
  telemetry.sendEvent("openDashboardApikeys");
  vscode.env.openExternal(
    vscode.Uri.parse("https://dashboard.stripe.com/test/apikeys")
  );
}
export function openDashboardEvents() {
  telemetry.sendEvent("openDashboardEvents");
  vscode.env.openExternal(
    vscode.Uri.parse("https://dashboard.stripe.com/test/events")
  );
}
export function openDashboardLogs() {
  telemetry.sendEvent("openDashboardLogs");
  vscode.env.openExternal(
    vscode.Uri.parse("https://dashboard.stripe.com/test/logs")
  );
}

export function openDashboardWebhooks() {
  telemetry.sendEvent("openDashboardWebhooks");
  vscode.env.openExternal(
    vscode.Uri.parse("https://dashboard.stripe.com/test/webhooks")
  );
}

export function openDashboardEventDetails(data: any) {
  telemetry.sendEvent("openDashboardEventDetails");
  let id = data.id;
  let url = `https://dashboard.stripe.com/test/events/${id}`;
  vscode.env.openExternal(vscode.Uri.parse(url));
}

export function refreshEventsList(
  stripeEventsViewProvider: StripeEventsDataProvider
) {
  telemetry.sendEvent("refreshEventsList");
  stripeEventsViewProvider.refresh();
}

export async function openTriggerEvent() {
  telemetry.sendEvent("openTriggerEvent");
  let eventName = await vscode.window.showInputBox({
    prompt: "Enter event name to trigger",
    placeHolder: "payment_intent.created",
  });

  if (eventName) {
    let terminal = vscode.window.createTerminal("Stripe");
    terminal.sendText(`stripe trigger ${eventName}`);
    terminal.show();

    // Trigger events refresh after 5s as we don't have a way to know when it has finished.
    setTimeout(() => {
      vscode.commands.executeCommand("stripe.refreshEventsList");
    }, 5000);
  }
}

export function openReportIssue() {
  telemetry.sendEvent("openReportIssue");
  let { name, publisher } = getExtensionInfo();

  vscode.commands.executeCommand("vscode.openIssueReporter", {
    extensionId: `${publisher}.${name}`,
  });
}

export function openDocs() {
  telemetry.sendEvent("openDocs");
  vscode.env.openExternal(
    vscode.Uri.parse("https://stripe.com/docs/development")
  );
}

export function openSurvey() {
  telemetry.sendEvent("openSurvey");
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

export function openTelemetryInfo() {
  vscode.env.openExternal(
    vscode.Uri.parse("https://code.visualstudio.com/docs/getstarted/telemetry")
  );
}
