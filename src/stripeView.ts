import { StripeTreeItem } from "./StripeTreeItem";
import { StripeTreeViewDataProvider } from "./StripeTreeViewDataProvider";
import { Resource } from "./resources";

export class StripeViewDataProvider extends StripeTreeViewDataProvider {
  constructor() {
    super();
  }

  private addAccountItems(accountItem: StripeTreeItem) {
    let apiKeysItem = new StripeTreeItem(
      "Open API keys dashboard",
      "openDashboardApikeys"
    );
    apiKeysItem.setIcon({
      dark: Resource.icons.dark.linkExternal,
      light: Resource.icons.light.linkExternal
    });
    accountItem.addChild(apiKeysItem);

    let eventsItem = new StripeTreeItem(
      "Open Events dashboard",
      "openDashboardEvents"
    );
    eventsItem.setIcon({
      dark: Resource.icons.dark.linkExternal,
      light: Resource.icons.light.linkExternal
    });
    accountItem.addChild(eventsItem);

    let logItem = new StripeTreeItem(
      "Open API logs dashboard",
      "openDashboardLogs"
    );
    logItem.setIcon({
      dark: Resource.icons.dark.linkExternal,
      light: Resource.icons.light.linkExternal
    });

    let logStreamItem = new StripeTreeItem(
      "Start API logs streaming...",
      "openLogsStreaming"
    );
    logStreamItem.setIcon({
      dark: Resource.icons.dark.terminal,
      light: Resource.icons.light.terminal
    });

    logItem.addChild(logStreamItem);

    accountItem.addChild(logItem);

    let webhooksItem = new StripeTreeItem(
      "Open Webhooks dashboard",
      "openDashboardWebhooks"
    );
    webhooksItem.setIcon({
      dark: Resource.icons.dark.linkExternal,
      light: Resource.icons.light.linkExternal
    });
  }

  async buildTree(): Promise<StripeTreeItem[]> {
    let mainItem = new StripeTreeItem("Stripe");
    mainItem.expand();

    this.addAccountItems(mainItem);

    return [mainItem];
  }
}
