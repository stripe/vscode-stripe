import {
  Event,
  EventEmitter,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState
} from "vscode";
import { StripeTreeItem } from "./StripeTreeItem";
import { StripeClient } from "./stripeClient";

export class StripeEventsDataProvider implements TreeDataProvider<TreeItem> {
  private treeItems: TreeItem[] | null = null;
  private stripeClient: StripeClient;
  private _onDidChangeTreeData: EventEmitter<TreeItem | null> = new EventEmitter<TreeItem | null>();
  readonly onDidChangeTreeData: Event<TreeItem | null> = this
    ._onDidChangeTreeData.event;

  constructor() {
    this.stripeClient = new StripeClient();
  }

  public refresh() {
    this.treeItems = null;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeItem): TreeItem {
    return element;
  }

  getParent(element: TreeItem): TreeItem | null {
    if (element instanceof StripeTreeItem && element.parent) {
      return element.parent;
    }
    return null;
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    if (!this.treeItems) {
      this.treeItems = await this.buildTree();
    }

    if (element instanceof StripeTreeItem) {
      return element.children;
    }

    if (!element) {
      if (this.treeItems) {
        return this.treeItems;
      }
    }
    return [];
  }

  private addAccountItems(accountItem: StripeTreeItem) {
    accountItem.addChild(
      new StripeTreeItem("API Keys", "openDashboardApikeys")
    );
    accountItem.addChild(new StripeTreeItem("Events", "openDashboardEvents"));

    let logItem = new StripeTreeItem("Logs", "openDashboardLogs");
    let logStreamItem = new StripeTreeItem(
      "Connect to log stream...",
      "openLogsStreaming"
    );

    logItem.addChild(logStreamItem);

    accountItem.addChild(logItem);
    accountItem.addChild(
      new StripeTreeItem("Webhooks", "openDashboardWebhooks")
    );
  }

  private async buildTree(): Promise<StripeTreeItem[]> {
    let eventsItem = new StripeTreeItem(
      "Recent events",
      "openDashbordEventDetails"
    );
    eventsItem.expand();

    let events = await this.stripeClient.getEvents();
    console.log("events", events);

    if (events.data) {
      events.data.forEach((event: any) => {
        let title = event.type;
        let eventItem = new StripeTreeItem(title);
        eventsItem.addChild(eventItem);
      });
    }

    return [eventsItem];
  }
}
