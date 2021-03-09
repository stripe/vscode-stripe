import {StripeClient} from './stripeClient';
import {StripeTreeItem} from './stripeTreeItem';
import {StripeTreeViewDataProvider} from './stripeTreeViewDataProvider';
import {ThemeIcon} from 'vscode';
import {unixToLocaleStringTZ} from './utils';

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
          const eventItem = new StripeTreeItem(title, {
            commandString: 'openEventDetails',
            contextValue: 'eventItem',
            tooltip: unixToLocaleStringTZ(event.created),
          });
          eventItem.metadata = {
            type: event.type,
            id: event.id,
          };
          eventsItem.addChild(eventItem);
        });
      }
    } catch (e) {}

    const triggerEventItem = new StripeTreeItem('Trigger new event', {
      commandString: 'openTriggerEvent',
      iconPath: new ThemeIcon('add'),
    });

    const webhooksListenItem = new StripeTreeItem('Start webhooks listening', {
      commandString: 'openWebhooksListen',
      iconPath: new ThemeIcon('terminal'),
    });

    var items = [triggerEventItem, webhooksListenItem];
    items.push(eventsItem);

    return items;
  }
}
