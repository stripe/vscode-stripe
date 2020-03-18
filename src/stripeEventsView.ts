import { StripeTreeItem } from "./StripeTreeItem";

import { StripeTreeViewDataProvider } from "./StripeTreeViewDataProvider";
import { StripeClient } from "./stripeClient";

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
            "openDashboardEventDetails"
          );
          eventItem.metadata = {
            type: event.type,
            id: event.id
          };
          eventsItem.addChild(eventItem);
        });
      }
    } catch (e) {}

    return [eventsItem];
  }
}
