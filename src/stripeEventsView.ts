import * as vscode from 'vscode';

import {CLICommand, StripeClient} from './stripeClient';
import {addEventDetails, clearEventDetails} from './stripeWorkspaceState';
import {ChildProcess} from 'child_process';
import {StreamingViewDataProvider} from './stripeStreamingView';
import {StripeTreeItem} from './stripeTreeItem';
import {unixToLocaleStringTZ} from './utils';

type EventObject = {
  created: number;
  type: string;
  id: string;
};

export const isEventObject = (object: any): object is EventObject => {
  if (!object || typeof object !== 'object') {
    return false;
  }

  if (object.object !== 'event') {
    return false;
  }

  const possibleEventObject = object as EventObject;
  return (
    typeof possibleEventObject.created === 'number' &&
    typeof possibleEventObject.type === 'string' &&
    typeof possibleEventObject.id === 'string'
  );
};

export class StripeEventsViewProvider extends StreamingViewDataProvider {
  private extensionContext: vscode.ExtensionContext;

  constructor(stripeClient: StripeClient, extensionContext: vscode.ExtensionContext) {
    super(stripeClient, CLICommand.Listen);
    this.extensionContext = extensionContext;
  }

  buildEventsTree(): StripeTreeItem[] {
    const treeItems = [
      this.getStreamingControlItem('events', 'startEventsStreaming', 'stopEventsStreaming'),
    ];

    if (this.streamingTreeItems.length > 0) {
      const eventsStreamRootItem = new StripeTreeItem('Recent events');
      eventsStreamRootItem.children = this.streamingTreeItems;
      eventsStreamRootItem.expand();
      treeItems.push(eventsStreamRootItem);
    }

    return treeItems;
  }

  buildTree(): Promise<StripeTreeItem[]> {
    const eventsItem = this.buildEventsTree();
    const triggerEventItem = new StripeTreeItem('Trigger new event', {
      commandString: 'openTriggerEvent',
      iconPath: new vscode.ThemeIcon('add'),
    });

    const webhooksListenItem = new StripeTreeItem('Forward events to your local machine', {
      commandString: 'openWebhooksListen',
      iconPath: new vscode.ThemeIcon('terminal'),
      tooltip:
        "Forward webhook events from Stripe to your local machine by connecting directly to Stripe's API.",
    });

    const items = [triggerEventItem, webhooksListenItem, ...eventsItem];

    return Promise.resolve(items);
  }
  async createStreamProcess(): Promise<ChildProcess> {
    const stripeListenProcess = await this.stripeClient.getOrCreateCLIProcess(CLICommand.Listen, [
      '--format',
      'JSON',
    ]);
    if (!stripeListenProcess) {
      throw new Error('Failed to start `stripe listen` process');
    }
    return stripeListenProcess;
  }

  streamReady(chunk: any): boolean {
    return chunk.includes('Ready!');
  }

  streamLoading(chunk: any): boolean {
    return chunk.includes('Getting ready');
  }

  createStreamTreeItem(chunk: any): StripeTreeItem | null {
    const object = JSON.parse(chunk);
    if (isEventObject(object)) {
      const label = object.type;
      const event = new StripeTreeItem(label, {
        commandString: 'openEventDetails',
        contextValue: 'eventItem',
        tooltip: unixToLocaleStringTZ(object.created),
      });

      event.metadata = {
        type: object.type,
        id: object.id,
      };

      // Save the event object in memento
      addEventDetails(this.extensionContext, object.id, object);
      return event;
    }
    return null;
  }

  // override parent method.
  clearItems() {
    super.clearItems();
    clearEventDetails(this.extensionContext);
  }
}
