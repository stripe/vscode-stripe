import * as vscode from 'vscode';
import {StripeDaemon} from './daemon/stripeDaemon';
import {StripeTreeItem} from './stripeTreeItem';
import {StripeTreeViewDataProvider} from './stripeTreeViewDataProvider';
// import {ThemeIcon} from 'vscode';
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

    // DX-7014
    // const createEndpoint = new StripeTreeItem('Create a new webhook endpoint', {
    //   commandString: 'createWebhookEndpoint',
    //   iconPath: new ThemeIcon('add'),
    //   tooltip: 'Create a new webhook endpoint',
    //   contextValue: 'createWebhookEndpoint',
    // });
    // items.push(createEndpoint);

    if (this.endpointItems.length > 0) {
      const endpointsRootItem = new StripeTreeItem('All webhook endpoints');
      endpointsRootItem.children = this.endpointItems;
      endpointsRootItem.expand();
      endpointsRootItem.makeCollapsible();
      items.push(endpointsRootItem);
    }

    return Promise.resolve(items);
  }

  async refreshEndpoints() {
    const daemonClient = await this.stripeDaemon.setupClient();
    daemonClient.webhookEndpointsList(new WebhookEndpointsListRequest(), (error, response) => {
      if (error) {
        if (error.code === 12) {
          // https://grpc.github.io/grpc/core/md_doc_statuscodes.html
          // 12: UNIMPLEMENTED
          vscode.window.showErrorMessage(
            'Please upgrade your Stripe CLI to the latest version to use this feature.',
          );
        } else {
          vscode.window.showErrorMessage(`Failed to get all webhookendpoints. ${error.details}`);
        }
      } else if (response) {
        const endpoints = response.getEndpointsList();
        if (endpoints.length > 0) {
          const endpointItems = endpoints.map((e) => {
            const enabledEventsRootItem = new StripeTreeItem('Enabled events');
            const enabledEvents = e.getEnabledeventsList();
            enabledEventsRootItem.children = enabledEvents.map(
              (event) => new StripeTreeItem(event),
            );
            enabledEventsRootItem.expand();
            enabledEventsRootItem.makeCollapsible();

            const endpointItem = new StripeTreeItem(e.getUrl());
            endpointItem.children = [
              new StripeTreeItem(`Status: ${e.getStatus()}`),
              enabledEventsRootItem,
            ];
            endpointItem.expand();
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
