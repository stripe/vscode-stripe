import {CLICommand, StripeClient} from './stripeClient';
import {ChildProcess} from 'child_process';
import {StreamingViewDataProvider} from './stripeStreamingView';
import {StripeTreeItem} from './stripeTreeItem';
import {ThemeIcon} from 'vscode';
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
  constructor(stripeClient: StripeClient) {
    super(stripeClient, CLICommand.Listen);
  }

  buildEventsTree(): StripeTreeItem[] {
    const treeItems = [
      this.getStreamingControlItem('Events', 'startEventsStreaming', 'stopEventsStreaming'),
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
      iconPath: new ThemeIcon('add'),
    });

    const webhooksListenItem = new StripeTreeItem('Start webhooks listening', {
      commandString: 'openWebhooksListen',
      iconPath: new ThemeIcon('terminal'),
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

      return event;
    }
    return null;
  }
}
