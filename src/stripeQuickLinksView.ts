import {StripeTreeItem} from './stripeTreeItem';
import {StripeTreeViewDataProvider} from './stripeTreeViewDataProvider';
import {ThemeIcon} from 'vscode';

export class StripeQuickLinksViewProvider extends StripeTreeViewDataProvider {
  buildTree(): Promise<StripeTreeItem[]> {
    const items = [];

    const apiKeysItem = new StripeTreeItem('Open API keys page', {
      commandString: 'openDashboardApikeys',
      iconPath: new ThemeIcon('link-external'),
    });

    items.push(apiKeysItem);

    const eventsItem = new StripeTreeItem('Open events page', {
      commandString: 'openDashboardEvents',
      iconPath: new ThemeIcon('link-external'),
    });

    items.push(eventsItem);

    const logItem = new StripeTreeItem('Open API logs page', {
      commandString: 'openDashboardLogs',
      iconPath: new ThemeIcon('link-external'),
    });

    items.push(logItem);

    const webhooksItem = new StripeTreeItem('Open webhooks page', {
      commandString: 'openDashboardWebhooks',
      iconPath: new ThemeIcon('link-external'),
    });

    items.push(webhooksItem);

    return Promise.resolve(items);
  }
}
