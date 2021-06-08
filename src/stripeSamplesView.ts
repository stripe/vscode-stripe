import {StripeTreeItem} from './stripeTreeItem';
import {StripeTreeViewDataProvider} from './stripeTreeViewDataProvider';
import {ThemeIcon} from 'vscode';

export class StripeSamplesViewProvider extends StripeTreeViewDataProvider {
  buildTree(): Promise<StripeTreeItem[]> {
    const items = [];

    const samplesItem = new StripeTreeItem('Start with a Stripe Sample', {
      commandString: 'createStripeSample',
      iconPath: new ThemeIcon('repo-clone'),
      tooltip: 'Clone a sample integration built by Stripe',
    });

    items.push(samplesItem);

    const findSamplesItem = new StripeTreeItem('Find code samples', {
      commandString: 'openSamples',
      iconPath: new ThemeIcon('code'),
      tooltip: 'Sample integrations built by Stripe',
    });
    items.push(findSamplesItem);

    return Promise.resolve(items);
  }
}
