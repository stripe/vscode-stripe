import * as vscode from "vscode";
import { StripeEventsDataProvider } from "./stripeEventsView";

export function openWebhooksListen(localUrl: string) {
  let terminal = vscode.window.createTerminal("Stripe");

  let commandArgs = ["stripe listen"];

  if (localUrl) {
    commandArgs.push(`--forward-to=${localUrl}`);
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
