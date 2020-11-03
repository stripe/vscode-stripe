import { StripeTreeItem } from "./stripeTreeItem";

import { StripeTreeViewDataProvider } from "./stripeTreeViewDataProvider";
import { StripeClient } from "./stripeClient";
import { Resource } from "./resources";

export class StripeEventsDataProvider extends StripeTreeViewDataProvider {
  stripeClient: StripeClient;

  constructor(stripeClient: StripeClient) {
    super();
    this.stripeClient = stripeClient;
  }

  async buildTree(): Promise<StripeTreeItem[]> {
    let eventsItem = new StripeTreeItem("Recent events");
    eventsItem.expand();

    try {
      let events = await this.stripeClient.getEvents();

      if (events.data) {
        events.data.forEach((event: any) => {
          let title = event.type;
          let eventItem = new StripeTreeItem(
            title,
            "openEventDetails"
          );
          eventItem.metadata = {
            type: event.type,
            id: event.id,
          };
          eventsItem.addChild(eventItem);
        });
      }
    } catch (e) {}

    let triggerEventItem = new StripeTreeItem(
      "Trigger new event",
      "openTriggerEvent"
    );
    triggerEventItem.setIcon({
      dark: Resource.icons.dark.add,
      light: Resource.icons.light.add,
    });

    let webhooksListenItem = new StripeTreeItem(
      "Start webhooks listening",
      "openWebhooksListen"
    );
    webhooksListenItem.setIcon({
      dark: Resource.icons.dark.terminal,
      light: Resource.icons.light.terminal,
    });

    var items = [triggerEventItem, webhooksListenItem];
    items.push(eventsItem);

    return items;
  }
}
