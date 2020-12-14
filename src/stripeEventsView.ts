import {Resource} from './resources';
import {StripeClient} from './stripeClient';
import {StripeTreeItem} from './stripeTreeItem';
import {StripeTreeViewDataProvider} from './stripeTreeViewDataProvider';

export class StripeEventsDataProvider extends StripeTreeViewDataProvider {
  stripeClient: StripeClient;

  constructor(stripeClient: StripeClient) {
    super();
    this.stripeClient = stripeClient;
  }

  async buildTree(): Promise<StripeTreeItem[]> {
    const eventsItem = new StripeTreeItem('Recent events');
    eventsItem.expand();

    try {
      const events = await this.stripeClient.getEvents();

      if (events.data) {
        events.data.forEach((event: any) => {
          const title = event.type;
          const eventItem = new StripeTreeItem(
            title,
            'openEventDetails',
            new Date(event.created * 1000).toString(),
          );
          eventItem.metadata = {
            type: event.type,
            id: event.id,
          };
          eventsItem.addChild(eventItem);
        });
      }
    } catch (e) {}

    const triggerEventItem = new StripeTreeItem(
      'Trigger new event',
      'openTriggerEvent'
    );
    triggerEventItem.setIcon({
      dark: Resource.ICONS.dark.add,
      light: Resource.ICONS.light.add,
    });

    const webhooksListenItem = new StripeTreeItem(
      'Start webhooks listening',
      'openWebhooksListen'
    );
    webhooksListenItem.setIcon({
      dark: Resource.ICONS.dark.terminal,
      light: Resource.ICONS.light.terminal,
    });

    var items = [triggerEventItem, webhooksListenItem];
    items.push(eventsItem);

    return items;
  }
}
