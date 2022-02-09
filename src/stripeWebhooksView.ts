import * as grpc from '@grpc/grpc-js';
import * as vscode from 'vscode';
import {StripeDaemon} from './daemon/stripeDaemon';
import {StripeTreeItem} from './stripeTreeItem';
import {StripeTreeViewDataProvider} from './stripeTreeViewDataProvider';
import {ThemeIcon} from 'vscode';
import {WebhookEndpointsListRequest} from './rpc/webhook_endpoints_list_pb';

export class StripeWebhooksViewProvider extends StripeTreeViewDataProvider {
  private stripeDaemon: StripeDaemon;
  private endpointItems: StripeTreeItem[];

  constructor(stripeDaemon: StripeDaemon) {
    super();
    this.stripeDaemon = stripeDaemon;
    this.endpointItems = [];
  }

  buildTree(): Promise<StripeTreeItem[]> {
    const items = [];

    const createEndpoint = new StripeTreeItem('Create a new webhook endpoint', {
      commandString: 'createWebhookEndpoint',
      iconPath: new ThemeIcon('add'),
      tooltip: 'Create a new webhook endpoint',
      contextValue: 'createWebhookEndpoint',
    });
    items.push(createEndpoint);

    if (this.endpointItems.length > 0) {
      const endpointsRootItem = new StripeTreeItem('All webhook endpoints');
      endpointsRootItem.children = this.endpointItems;
      endpointsRootItem.makeCollapsible();
      items.push(endpointsRootItem);
    }

    return Promise.resolve(items);
  }

  async refreshEndpoints() {
    const daemonClient = await this.stripeDaemon.setupClient();
    daemonClient.webhookEndpointsList(new WebhookEndpointsListRequest(), (error, response) => {
      if (error) {
        if (error.code === grpc.status.UNIMPLEMENTED) {
          vscode.window.showErrorMessage(
            'Please upgrade your Stripe CLI to the latest version to use this feature.',
          );
        } else {
          vscode.window.showErrorMessage(`Failed to get all webhookendpoints. ${error.details}`);
        }
      } else if (response) {
        const endpoints = response.getEndpointsList();
        if (endpoints.length > 0) {
          const endpointItems = endpoints
            .filter((e) => e.getStatus() === 'enabled')
            .map((e) => {
              const enabledEventsRootItem = new StripeTreeItem('Enabled events');
              const enabledEvents = e.getEnabledeventsList();
              enabledEventsRootItem.children = enabledEvents.map(
                (event) => {
                  if (event === '*') {
                    return new StripeTreeItem('* (All events except those that require explicit selection)');
                  }
                  return new StripeTreeItem(event);
                }
              );
              enabledEventsRootItem.makeCollapsible();

              const endpointItem = new StripeTreeItem(e.getUrl());
              endpointItem.children = [enabledEventsRootItem];
              endpointItem.makeCollapsible();

              return endpointItem;
            });
          this.endpointItems = endpointItems;
          this.refresh();
        }
      }
    });
  }

  getEndpoints() {
    return this.endpointItems;
  }
}
