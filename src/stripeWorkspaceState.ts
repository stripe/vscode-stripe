import * as vscode from 'vscode';

// Set a limit on the number of eventNames we store in context.
const recentEventsLimit = 100;

// Used to keep track of the most recently triggered event names to display on top for users when they trigger events
export const recentEventsKey = 'RecentEvents';

// Used to keep track of event details for event tree items while event streaming is active.
export const eventDetailsKey = 'EventDetails';

/**
 * Initialize the keys that we depend on
 * If the keys are already there and have data for whatever reason, clear it.
 */
export function initializeStripeWorkspaceState(extensionContext: vscode.ExtensionContext) {
  clearRecordedEvents(extensionContext);
  clearEventDetails(extensionContext);
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
