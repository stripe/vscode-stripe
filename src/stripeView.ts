import { StripeTreeItem } from "./StripeTreeItem";
import { StripeTreeViewDataProvider } from "./StripeTreeViewDataProvider";
import { Resource } from "./resources";

export class StripeViewDataProvider extends StripeTreeViewDataProvider {
  constructor() {
    super();
  }

  private getAccountItems() {
    let items = [];

    let apiKeysItem = new StripeTreeItem(
      "Open API keys",
      "openDashboardApikeys"
    );
    apiKeysItem.setIcon({
      dark: Resource.icons.dark.linkExternal,
      light: Resource.icons.light.linkExternal,
    });

    items.push(apiKeysItem);

    let eventsItem = new StripeTreeItem("Open Events", "openDashboardEvents");
    eventsItem.setIcon({
      dark: Resource.icons.dark.linkExternal,
      light: Resource.icons.light.linkExternal,
    });

    items.push(eventsItem);

    let logItem = new StripeTreeItem("Open API logs", "openDashboardLogs");
    logItem.setIcon({
      dark: Resource.icons.dark.linkExternal,
      light: Resource.icons.light.linkExternal,
    });

    let logStreamItem = new StripeTreeItem(
      "Start API logs streaming",
      "openLogsStreaming"
    );
    logStreamItem.setIcon({
      dark: Resource.icons.dark.terminal,
      light: Resource.icons.light.terminal,
    });

    logItem.addChild(logStreamItem);

    items.push(logItem);

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
      light: Resource.icons.light.terminal,
    });

    webhooksItem.addChild(webhooksListenItem);

    webhooksItem.setIcon({
      dark: Resource.icons.dark.linkExternal,
      light: Resource.icons.light.linkExternal,
    });

    items.push(webhooksItem);

    return items;
  }

  async buildTree(): Promise<StripeTreeItem[]> {
    return this.getAccountItems();
  }
}
