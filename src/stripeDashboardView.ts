import { StripeTreeItem } from "./stripeTreeItem";
import { StripeTreeViewDataProvider } from "./stripeTreeViewDataProvider";
import { Resource } from "./resources";

export class StripeDashboardViewDataProvider extends StripeTreeViewDataProvider {
  constructor() {
    super();
  }

  async buildTree(): Promise<StripeTreeItem[]> {
    let items = [];

    let apiKeysItem = new StripeTreeItem(
      "Open API keys page",
      "openDashboardApikeys"
    );
    apiKeysItem.setIcon({
      dark: Resource.icons.dark.linkExternal,
      light: Resource.icons.light.linkExternal,
    });

    items.push(apiKeysItem);

    let eventsItem = new StripeTreeItem(
      "Open events page",
      "openDashboardEvents"
    );
    eventsItem.setIcon({
      dark: Resource.icons.dark.linkExternal,
      light: Resource.icons.light.linkExternal,
    });

    items.push(eventsItem);

    let logItem = new StripeTreeItem("Open API logs page", "openDashboardLogs");
    logItem.setIcon({
      dark: Resource.icons.dark.linkExternal,
      light: Resource.icons.light.linkExternal,
    });

    items.push(logItem);

    let webhooksItem = new StripeTreeItem(
      "Open webhooks page",
      "openDashboardWebhooks"
    );

    webhooksItem.setIcon({
      dark: Resource.icons.dark.linkExternal,
      light: Resource.icons.light.linkExternal,
    });

    items.push(webhooksItem);

    return items;
  }
}
