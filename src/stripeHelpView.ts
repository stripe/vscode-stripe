import {StripeTreeItem} from './stripeTreeItem';
import {StripeTreeViewDataProvider} from './stripeTreeViewDataProvider';
import {ThemeIcon} from 'vscode';

export class StripeHelpViewProvider extends StripeTreeViewDataProvider {
  buildTree(): Promise<StripeTreeItem[]> {
    const items = [];

    const docsItem = new StripeTreeItem('Read documentation', {
      commandString: 'openDocs',
      iconPath: new ThemeIcon('book'),
    });
    items.push(docsItem);

    const reportItem = new StripeTreeItem('Report issue', {
      commandString: 'openReportIssue',
      iconPath: new ThemeIcon('report'),
    });
    items.push(reportItem);

    const feedbackItem = new StripeTreeItem('Rate and provide feedback', {
      commandString: 'openSurvey',
      iconPath: new ThemeIcon('feedback'),
    });
    items.push(feedbackItem);

    const webhooksDebugItem = new StripeTreeItem('Configure debugging', {
      commandString: 'openWebhooksDebugConfigure',
      iconPath: new ThemeIcon('settings-gear'),
    });

    items.push(webhooksDebugItem);

    return Promise.resolve(items);
  }
}
