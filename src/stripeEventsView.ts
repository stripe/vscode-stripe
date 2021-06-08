import * as vscode from 'vscode';

import {ListenRequest, ListenResponse} from './rpc/listen_pb';
import {StreamingViewDataProvider, ViewState} from './stripeStreamingView';
import {addEventDetails, clearEventDetails} from './stripeWorkspaceState';
import {camelToSnakeCase, recursivelyRenameKeys, unixToLocaleStringTZ} from './utils';
import {ClientReadableStream} from '@grpc/grpc-js';
import {StripeClient} from './stripeClient';
import {StripeDaemon} from './daemon/stripeDaemon';
import {StripeEvent} from './rpc/common_pb';
import {StripeTreeItem} from './stripeTreeItem';

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

export class StripeEventsViewProvider extends StreamingViewDataProvider<ListenResponse> {
  private extensionContext: vscode.ExtensionContext;

  constructor(
    stripeClient: StripeClient,
    stripeDaemon: StripeDaemon,
    extensionContext: vscode.ExtensionContext,
  ) {
    super(stripeClient, stripeDaemon);
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
      tooltip: "Forward webhook events from Stripe's API to your local machine.",
    });

    const items = [triggerEventItem, webhooksListenItem, ...eventsItem];

    return Promise.resolve(items);
  }
  async createReadableStream(): Promise<ClientReadableStream<ListenResponse> | undefined> {
    try {
      const daemonClient = await this.stripeDaemon.setupClient();
      const listenStream = daemonClient.listen(new ListenRequest());
      return listenStream;
    } catch (e) {
      if (e.name === 'NoDaemonCommandError') {
        this.stripeClient.promptUpdateForDaemon();
      }
      console.error(e);
    }
  }

  handleData = (response: ListenResponse): void => {
    const state = response.getState();
    const stripeEvent = response.getStripeEvent();
    if (state) {
      this.handleState(state);
    } else if (stripeEvent) {
      this.handleStripeEvent(stripeEvent);
    }
  };

  // override parent method.
  clearItems() {
    super.clearItems();
    clearEventDetails(this.extensionContext);
  }

  private handleState(state: number): void {
    switch (state) {
      case ListenResponse.State.STATE_DONE:
        this.setViewState(ViewState.Idle);
        break;
      case ListenResponse.State.STATE_LOADING:
        this.setViewState(ViewState.Loading);
        break;
      case ListenResponse.State.STATE_READY:
        this.setViewState(ViewState.Streaming);
        break;
      case ListenResponse.State.STATE_RECONNECTING:
        this.setViewState(ViewState.Loading);
        break;
      default:
        // this case should never be hit
        this.setViewState(ViewState.Idle);
        console.error('Received unknown stream state');
    }
  }

  private handleStripeEvent(stripeEvent: StripeEvent): void {
    const label = stripeEvent.getType();
    const eventTreeItem = new StripeTreeItem(label, {
      commandString: 'openEventDetails',
      contextValue: 'eventItem',
      tooltip: unixToLocaleStringTZ(stripeEvent.getCreated()),
    });

    eventTreeItem.metadata = {
      type: stripeEvent.getType(),
      id: stripeEvent.getId(),
    };

    // Unfortunately these steps are necessary for correct rendering
    const stripeEventObj = {
      ...stripeEvent.toObject(),
      data: stripeEvent.getData()?.toJavaScript(),
    };
    const snakeCaseStripeEventObj = recursivelyRenameKeys(stripeEventObj, camelToSnakeCase);

    // Save the event object in memento
    addEventDetails(this.extensionContext, stripeEvent.getId(), snakeCaseStripeEventObj);

    this.insertItem(eventTreeItem);
  }
}
