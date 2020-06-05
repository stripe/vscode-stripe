import { StripeTreeItem } from "./stripeTreeItem";

import { StripeTreeViewDataProvider } from "./stripeTreeViewDataProvider";
import { StripeClient } from "./stripeClient";
import { Resource } from "./resources";

export class StripLogsDataProvider extends StripeTreeViewDataProvider {
  stripeClient: StripeClient;

  constructor(stripeClient: StripeClient) {
    super();
    this.stripeClient = stripeClient;
  }

  async buildTree(): Promise<StripeTreeItem[]> {
    let logStreamItem = new StripeTreeItem(
      "Start API logs streaming",
      "openLogsStreaming"
    );
    logStreamItem.setIcon({
      dark: Resource.icons.dark.terminal,
      light: Resource.icons.light.terminal,
    });

    return [logStreamItem];
  }
}
