import {Resource} from './resources';
import {StripeTreeItem} from './stripeTreeItem';
import {StripeTreeViewDataProvider} from './stripeTreeViewDataProvider';

export class StripeDashboardViewDataProvider extends StripeTreeViewDataProvider {
  buildTree(): Promise<StripeTreeItem[]> {
    const items = [];

    const apiKeysItem = new StripeTreeItem(
      'Open API keys page',
      'openDashboardApikeys'
    );
    apiKeysItem.setIcon({
      dark: Resource.ICONS.dark.linkExternal,
      light: Resource.ICONS.light.linkExternal,
    });

    items.push(apiKeysItem);

    const eventsItem = new StripeTreeItem(
      'Open events page',
      'openDashboardEvents'
    );
    eventsItem.setIcon({
      dark: Resource.ICONS.dark.linkExternal,
      light: Resource.ICONS.light.linkExternal,
    });

    items.push(eventsItem);

    const logItem = new StripeTreeItem('Open API logs page', 'openDashboardLogs');
    logItem.setIcon({
      dark: Resource.ICONS.dark.linkExternal,
      light: Resource.ICONS.light.linkExternal,
    });

    items.push(logItem);

    const webhooksItem = new StripeTreeItem(
      'Open webhooks page',
      'openDashboardWebhooks'
    );

    webhooksItem.setIcon({
      dark: Resource.ICONS.dark.linkExternal,
      light: Resource.ICONS.light.linkExternal,
    });

    items.push(webhooksItem);

    return Promise.resolve(items);
  }
}
