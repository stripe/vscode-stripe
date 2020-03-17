import { StripeTreeItem } from "./StripeTreeItem";
import { StripeClient } from "./stripeClient";
import { StripeTreeViewDataProvider } from "./StripeTreeViewDataProvider";

export class StripeEventsDataProvider extends StripeTreeViewDataProvider {
  stripeClient: StripeClient;

  constructor() {
    super();
    this.stripeClient = new StripeClient();
  }

  async buildTree(): Promise<StripeTreeItem[]> {
    let eventsItem = new StripeTreeItem("Recent events");
    eventsItem.expand();

    let events = await this.stripeClient.getEvents();

    if (events.data) {
      events.data.forEach((event: any) => {
        let title = event.type;
        let eventItem = new StripeTreeItem(title, "openDashboardEventDetails");
        eventItem.metadata = {
          type: event.type,
          id: event.id
        };
        eventsItem.addChild(eventItem);
      });
    }

    return [eventsItem];
  }
}
