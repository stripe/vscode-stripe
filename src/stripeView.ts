import { StripeTreeItem } from "./StripeTreeItem";
import { StripeTreeViewDataProvider } from "./StripeTreeViewDataProvider";

export class StripeViewDataProvider extends StripeTreeViewDataProvider {
  constructor() {
    super();
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

  async buildTree(): Promise<StripeTreeItem[]> {
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
