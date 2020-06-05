import { StripeTreeItem } from "./stripeTreeItem";
import { StripeTreeViewDataProvider } from "./stripeTreeViewDataProvider";
import { Resource } from "./resources";

export class StripeHelpViewDataProvider extends StripeTreeViewDataProvider {
  constructor() {
    super();
  }

  async buildTree(): Promise<StripeTreeItem[]> {
    let items = [];

    let docsItem = new StripeTreeItem("Read documentation", "openDocs");
    docsItem.setIcon({
      dark: Resource.icons.dark.book,
      light: Resource.icons.light.book,
    });
    items.push(docsItem);

    let reportItem = new StripeTreeItem("Report issue", "openReportIssue");
    reportItem.setIcon({
      dark: Resource.icons.dark.report,
      light: Resource.icons.light.report,
    });
    items.push(reportItem);

    let feedbackItem = new StripeTreeItem(
      "Rate and provide feedback",
      "openSurvey"
    );
    feedbackItem.setIcon({
      dark: Resource.icons.dark.feedback,
      light: Resource.icons.light.feedback,
    });
    items.push(feedbackItem);

    let webhooksDebugItem = new StripeTreeItem(
      "Configure debugging",
      "openWebhooksDebugConfigure"
    );
    webhooksDebugItem.setIcon({
      dark: Resource.icons.dark.settings,
      light: Resource.icons.light.settings,
    });

    items.push(webhooksDebugItem);

    return items;
  }
}
