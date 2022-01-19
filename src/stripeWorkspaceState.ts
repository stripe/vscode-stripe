import * as vscode from 'vscode';

// Set a limit on the number of eventNames we store in context.
const recentEventsLimit = 100;

// Used to keep track of the most recently triggered event names to display on top for users when they trigger events
export const recentEventsKey = 'RecentEvents';

// Used to keep track of event details for event tree items while event streaming is active.
export const eventDetailsKey = 'EventDetails';

// Used to keep track of log details for log tree items while log streaming is active.
export const logDetailsKey = 'LogDetails';

// Used to keep track of the last endpoint the user set to forward webhook events to.
export const webhookEndpointKey = 'WebhookEndpoint';

// Used to keep track of the last endpoint the user set to forward Connect webhook events to.
export const connectWebhookEndpointKey = 'ConnectWebhookEndpoint';

// Used to keep track of the Stripe AccountId
export const stripeAccountIdKey = 'StripeAccountId';

// Used to keep track of the CLI version used
export const cliVersionKey = 'CLIVersion';

/**
 * Initialize the keys that we depend on
 * If the keys are already there and have data for whatever reason, clear it.
 */
export function initializeStripeWorkspaceState(extensionContext: vscode.ExtensionContext) {
  clearRecordedEvents(extensionContext);
  clearEventDetails(extensionContext);
  clearLogDetails(extensionContext);
}

export function getRecentEvents(
  extensionContext: vscode.ExtensionContext,
  limit?: number,
): string[] {
  const data: any = extensionContext.workspaceState.get(recentEventsKey, []);
  return limit ? data.slice(0, limit) : data;
}

export function recordEvent(extensionContext: vscode.ExtensionContext, eventName: string) {
  const eventsList = getRecentEvents(extensionContext);
  const updatedList = [eventName].concat(eventsList).slice(0, recentEventsLimit);
  extensionContext.workspaceState.update(recentEventsKey, updatedList);
}

export function clearRecordedEvents(extensionContext: vscode.ExtensionContext) {
  extensionContext.workspaceState.update(recentEventsKey, []);
}

function getEventDetailsMap(extensionContext: vscode.ExtensionContext) {
  return extensionContext.workspaceState.get(eventDetailsKey, new Map<string, any>());
}

export function addEventDetails(
  extensionContext: vscode.ExtensionContext,
  eventId: string,
  eventObject: any,
) {
  const eventDetailsMap = getEventDetailsMap(extensionContext);
  eventDetailsMap.set(eventId, eventObject);
  extensionContext.workspaceState.update(eventDetailsKey, eventDetailsMap);
}

export function retrieveEventDetails(extensionContext: vscode.ExtensionContext, eventId: string) {
  const eventDetailsMap = getEventDetailsMap(extensionContext);
  return eventDetailsMap.get(eventId);
}

export function clearEventDetails(extensionContext: vscode.ExtensionContext) {
  extensionContext.workspaceState.update(eventDetailsKey, new Map<string, any>());
}

function getLogDetailsMap(extensionContext: vscode.ExtensionContext) {
  return extensionContext.workspaceState.get(logDetailsKey, new Map<string, any>());
}

export function addLogDetails(
  extensionContext: vscode.ExtensionContext,
  logId: string,
  logObject: any,
) {
  const logDetailsMap = getLogDetailsMap(extensionContext);
  logDetailsMap.set(logId, logObject);
  extensionContext.workspaceState.update(logDetailsKey, logDetailsMap);
}

export function retrieveLogDetails(extensionContext: vscode.ExtensionContext, logId: string) {
  const logDetailsMap = getLogDetailsMap(extensionContext);
  return logDetailsMap.get(logId);
}

export function clearLogDetails(extensionContext: vscode.ExtensionContext) {
  extensionContext.workspaceState.update(logDetailsKey, new Map<string, any>());
}

export function getWebhookEndpoint(extensionContext: vscode.ExtensionContext): string | undefined {
  return extensionContext.workspaceState.get(webhookEndpointKey);
}

export function setWebhookEndpoint(
  extensionContext: vscode.ExtensionContext,
  webhookEndpoint: string,
) {
  extensionContext.workspaceState.update(webhookEndpointKey, webhookEndpoint);
}

export function getConnectWebhookEndpoint(
  extensionContext: vscode.ExtensionContext,
): string | undefined {
  return extensionContext.workspaceState.get(connectWebhookEndpointKey);
}

export function setConnectWebhookEndpoint(
  extensionContext: vscode.ExtensionContext,
  connectWebhookEndpoint: string,
) {
  extensionContext.workspaceState.update(connectWebhookEndpointKey, connectWebhookEndpoint);
}

export function setCliVersion(extensionContext: vscode.ExtensionContext, cliVersion: string) {
  extensionContext.workspaceState.update(cliVersionKey, cliVersion);
}

export function getCliVersion(extensionContext: vscode.ExtensionContext) {
  return extensionContext.workspaceState.get(cliVersionKey, '');
}

export function setStripeAccountId(
  extensionContext: vscode.ExtensionContext,
  stripeAccountId: string,
) {
  extensionContext.workspaceState.update(stripeAccountIdKey, stripeAccountId);
}

export function getStripeAccountId(extensionContext: vscode.ExtensionContext) {
  return extensionContext.workspaceState.get(stripeAccountIdKey, '');
}
