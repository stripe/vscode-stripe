import { StripeTreeItem } from "./StripeTreeItem";
import { StripeTreeViewDataProvider } from "./StripeTreeViewDataProvider";
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

    let twitterItem = new StripeTreeItem(
      "Tweet us your feedback",
      "openTwitter"
    );
    twitterItem.setIcon({
      dark: Resource.icons.dark.twitter,
      light: Resource.icons.light.twitter,
    });
    items.push(twitterItem);

    return items;
  }
}
