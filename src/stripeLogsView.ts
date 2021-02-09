import {Resource} from './resources';
import {StripeTreeItem} from './stripeTreeItem';
import {StripeTreeViewDataProvider} from './stripeTreeViewDataProvider';

export class StripeLogsDataProvider extends StripeTreeViewDataProvider {
  buildTree(): Promise<StripeTreeItem[]> {
    const logStreamItem = new StripeTreeItem('Start API logs streaming', 'openLogsStreaming');
    logStreamItem.setIcon({
      dark: Resource.ICONS.dark.terminal,
      light: Resource.ICONS.light.terminal,
    });

    return Promise.resolve([logStreamItem]);
  }
}
