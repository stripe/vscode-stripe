import { Event, EventEmitter, TreeDataProvider, TreeItem } from "vscode";
import { StripeTreeItem } from "./StripeTreeItem";

export class StripeTreeDataProvider implements TreeDataProvider<TreeItem> {
  private treeItems: TreeItem[] | null = null;
  private _onDidChangeTreeData: EventEmitter<TreeItem | null> = new EventEmitter<TreeItem | null>();
  readonly onDidChangeTreeData: Event<TreeItem | null> = this
    ._onDidChangeTreeData.event;

  constructor() {}

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
    let mainItem = new StripeTreeItem("Stripe");
    mainItem.expand();

    this.addAccountItems(mainItem);

    // ["Demo 1: Pascha", "Demo 2: KAVHOLM"].forEach((account, index) => {
    //   let accountItem = new StripeTreeItem(account);
    //   if (index == 0) {
    //     accountItem.expand();
    //   }

    //   mainItem.addChild(accountItem);
    // });
    return [mainItem];
  }
}
