import * as vscode from 'vscode';

// Set a limit on the number of eventNames we store in context.
const recentEventsLimit = 100;

export const recentEventsKey = 'RecentEvents';

export function getRecentEvents(extensionContext: vscode.ExtensionContext,
  limit?: number): string[] {
  const data: any = extensionContext.workspaceState.get(recentEventsKey, []);
  return limit ? data.slice(0, limit) : data;
}

export function recordEvent(extensionContext: vscode.ExtensionContext, eventName: string) {
  const eventsList = getRecentEvents(extensionContext);
  const updatedList = [eventName].concat(eventsList).slice(0, recentEventsLimit);
  extensionContext.workspaceState.update(recentEventsKey, updatedList);
}

export function clearRecordedEvents(extensionContext: vscode.ExtensionContext,) {
  extensionContext.workspaceState.update(recentEventsKey, []);
}
