import {Resource} from './resources';
import {StripeTreeItem} from './stripeTreeItem';
import {StripeTreeViewDataProvider} from './stripeTreeViewDataProvider';

export class StripeHelpViewDataProvider extends StripeTreeViewDataProvider {
  buildTree(): Promise<StripeTreeItem[]> {
    const items = [];

    const docsItem = new StripeTreeItem('Read documentation', 'openDocs');
    docsItem.setIcon({
      dark: Resource.ICONS.dark.book,
      light: Resource.ICONS.light.book,
    });
    items.push(docsItem);

    const reportItem = new StripeTreeItem('Report issue', 'openReportIssue');
    reportItem.setIcon({
      dark: Resource.ICONS.dark.report,
      light: Resource.ICONS.light.report,
    });
    items.push(reportItem);

    const feedbackItem = new StripeTreeItem('Rate and provide feedback', 'openSurvey');
    feedbackItem.setIcon({
      dark: Resource.ICONS.dark.feedback,
      light: Resource.ICONS.light.feedback,
    });
    items.push(feedbackItem);

    const webhooksDebugItem = new StripeTreeItem(
      'Configure debugging',
      'openWebhooksDebugConfigure',
    );
    webhooksDebugItem.setIcon({
      dark: Resource.ICONS.dark.settings,
      light: Resource.ICONS.light.settings,
    });

    items.push(webhooksDebugItem);

    return Promise.resolve(items);
  }
}
