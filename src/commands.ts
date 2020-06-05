import * as vscode from "vscode";
import * as querystring from "querystring";
import { StripeEventsDataProvider } from "./stripeEventsView";
import { getExtensionInfo, showQuickPickWithValues } from "./utils";
import osName = require("os-name");
import { Telemetry } from "./telemetry";
import { StripeTerminal } from "./stripeTerminal";

const telemetry = Telemetry.getInstance();

const terminal = new StripeTerminal();

export async function openWebhooksListen(options: any) {
  telemetry.sendEvent("openWebhooksListen");

  let commandArgs = ["stripe listen"];

  if (!options.localUrl) {
    let action = await showQuickPickWithValues(
      "Do you want to forward traffic to your local server?",
      ["Yes", "No"]
    );
    if (action === "Yes") {
      let input = await vscode.window.showInputBox({
        prompt: "Enter local server url",
        placeHolder: "http://localhost:3000",
      });

      if (input) {
        options.localUrl = input;
      }
    }
  }

  if (options.localUrl && typeof options.localUrl == "string") {
    commandArgs.push(`--forward-to=${options.localUrl}`);
  }

  if (options.events && options.events.length > 0) {
    commandArgs.push(`--events=${options.events.join(",")}`);
  }

  let command = commandArgs.join(" ");

  terminal.execute(command);
}

export function openLogsStreaming() {
  telemetry.sendEvent("openLogsStreaming");
  terminal.execute("stripe logs tail");
}

export function startLogin() {
  telemetry.sendEvent("login");
  terminal.execute("stripe login");
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

  let eventName = await showQuickPickWithValues("Enter event name to trigger", [
    "balance.available",
    "charge.captured",
    "charge.dispute.created",
    "charge.failed",
    "charge.refunded",
    "charge.succeeded",
    "checkout.session.completed",
    "customer.created",
    "customer.deleted",
    "customer.source.created",
    "customer.source.updated",
    "customer.subscription.created",
    "customer.subscription.deleted",
    "customer.subscription.updated",
    "customer.updated",
    "invoice.created",
    "invoice.finalized",
    "invoice.payment_failed",
    "invoice.payment_succeeded",
    "invoice.updated",
    "issuing_authorization.request",
    "issuing_card.created",
    "issuing_cardholder.created",
    "payment_intent.amount_capturable_updated",
    "payment_intent.canceled",
    "payment_intent.created",
    "payment_intent.payment_failed",
    "payment_intent.succeeded",
    "payment_method.attached",
    "plan.created",
    "plan.deleted",
    "plan.updated",
    "product.created",
    "product.deleted",
    "product.updated",
    "setup_intent.canceled",
    "setup_intent.created",
    "setup_intent.setup_failed",
    "setup_intent.succeeded",
    "subscription_schedule.canceled",
    "subscription_schedule.created",
    "subscription_schedule.released",
    "subscription_schedule.updated",
  ]);

  if (eventName) {
    terminal.execute(`stripe trigger ${eventName}`);

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

export function openWebhooksDebugConfigure() {
  vscode.commands.executeCommand("workbench.action.debug.configure");
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
