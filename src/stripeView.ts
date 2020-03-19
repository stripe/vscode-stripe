import { StripeTreeItem } from "./StripeTreeItem";
import { StripeTreeViewDataProvider } from "./StripeTreeViewDataProvider";
import { Resource } from "./resources";

export class StripeViewDataProvider extends StripeTreeViewDataProvider {
  constructor() {
    super();
  }

  private addAccountItems(accountItem: StripeTreeItem) {
    let apiKeysItem = new StripeTreeItem("API Keys", "openDashboardApikeys");
    apiKeysItem.setIcon({
      dark: Resource.icons.dark.linkExternal,
      light: Resource.icons.light.linkExternal
    });
    accountItem.addChild(apiKeysItem);

    let eventsItem = new StripeTreeItem("Events", "openDashboardEvents");
    eventsItem.setIcon({
      dark: Resource.icons.dark.linkExternal,
      light: Resource.icons.light.linkExternal
    });
    accountItem.addChild(eventsItem);

    let logItem = new StripeTreeItem("API logs", "openDashboardLogs");
    logItem.setIcon({
      dark: Resource.icons.dark.linkExternal,
      light: Resource.icons.light.linkExternal
    });

    let logStreamItem = new StripeTreeItem(
      "Start API logs streaming...",
      "openLogsStreaming"
    );

    logItem.addChild(logStreamItem);

    accountItem.addChild(logItem);

    let webhooksItem = new StripeTreeItem("Webhooks", "openDashboardWebhooks");
    webhooksItem.setIcon({
      dark: Resource.icons.dark.linkExternal,
      light: Resource.icons.light.linkExternal
    });
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
