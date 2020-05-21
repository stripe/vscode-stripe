import { StripeTreeItem } from "./stripeTreeItem";
import { StripeTreeViewDataProvider } from "./stripeTreeViewDataProvider";
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

    let eventsItem = new StripeTreeItem("Open events", "openDashboardEvents");
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
      "Open webhooks",
      "openDashboardWebhooks"
    );

    let webhooksListenItem = new StripeTreeItem(
      "Start webhooks listening",
      "openWebhooksListen"
    );
    webhooksListenItem.setIcon({
      dark: Resource.icons.dark.terminal,
      light: Resource.icons.light.terminal,
    });

    webhooksItem.addChild(webhooksListenItem);

    let webhooksDebugItem = new StripeTreeItem(
      "Configure debugging",
      "openWebhooksDebugConfigure"
    );
    webhooksDebugItem.setIcon({
      dark: Resource.icons.dark.settings,
      light: Resource.icons.light.settings,
    });

    webhooksItem.addChild(webhooksDebugItem);

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
