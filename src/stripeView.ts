import { StripeTreeItem } from "./StripeTreeItem";
import { StripeTreeViewDataProvider } from "./StripeTreeViewDataProvider";
import { Resource } from "./resources";

export class StripeViewDataProvider extends StripeTreeViewDataProvider {
  constructor() {
    super();
  }

  private addAccountItems(accountItem: StripeTreeItem) {
    let apiKeysItem = new StripeTreeItem(
      "Open API keys",
      "openDashboardApikeys"
    );
    apiKeysItem.setIcon({
      dark: Resource.icons.dark.linkExternal,
      light: Resource.icons.light.linkExternal
    });
    accountItem.addChild(apiKeysItem);

    let eventsItem = new StripeTreeItem("Open Events", "openDashboardEvents");
    eventsItem.setIcon({
      dark: Resource.icons.dark.linkExternal,
      light: Resource.icons.light.linkExternal
    });
    accountItem.addChild(eventsItem);

    let logItem = new StripeTreeItem("Open API logs", "openDashboardLogs");
    logItem.setIcon({
      dark: Resource.icons.dark.linkExternal,
      light: Resource.icons.light.linkExternal
    });

    let logStreamItem = new StripeTreeItem(
      "Start API logs streaming",
      "openLogsStreaming"
    );
    logStreamItem.setIcon({
      dark: Resource.icons.dark.terminal,
      light: Resource.icons.light.terminal
    });

    logItem.addChild(logStreamItem);

    accountItem.addChild(logItem);

    let webhooksItem = new StripeTreeItem(
      "Open Webhooks",
      "openDashboardWebhooks"
    );

    let webhooksListenItem = new StripeTreeItem(
      "Start Webhooks listening",
      "openWebhooksListen"
    );
    webhooksListenItem.setIcon({
      dark: Resource.icons.dark.terminal,
      light: Resource.icons.light.terminal
    });

    webhooksItem.addChild(webhooksListenItem);

    webhooksItem.setIcon({
      dark: Resource.icons.dark.linkExternal,
      light: Resource.icons.light.linkExternal
    });

    accountItem.addChild(webhooksItem);
  }

  async buildTree(): Promise<StripeTreeItem[]> {
    let mainItem = new StripeTreeItem("Stripe");
    mainItem.expand();

    this.addAccountItems(mainItem);

    return [mainItem];
  }
}
