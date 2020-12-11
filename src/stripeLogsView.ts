import {Resource} from './resources';
import {StripeClient} from './stripeClient';
import {StripeTreeItem} from './stripeTreeItem';
import {StripeTreeViewDataProvider} from './stripeTreeViewDataProvider';

export class StripLogsDataProvider extends StripeTreeViewDataProvider {
  stripeClient: StripeClient;

  constructor(stripeClient: StripeClient) {
    super();
    this.stripeClient = stripeClient;
  }

  buildTree(): Promise<StripeTreeItem[]> {
    const logStreamItem = new StripeTreeItem(
      'Start API logs streaming',
      'openLogsStreaming'
    );
    logStreamItem.setIcon({
      dark: Resource.ICONS.dark.terminal,
      light: Resource.ICONS.light.terminal,
    });

    return Promise.resolve([logStreamItem]);
  }
}
