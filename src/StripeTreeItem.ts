import { TreeItem, TreeItemCollapsibleState } from "vscode";
export class StripeTreeItem extends TreeItem {
  parent: StripeTreeItem | undefined;
  children: StripeTreeItem[] = [];
  metadata: object | undefined;

  constructor(label: string, commandString?: string) {
    super(label, TreeItemCollapsibleState.None);
    this.contextValue = "stripe";
    if (commandString) {
      this.command = {
        title: `stripe.${commandString}`,
        command: `stripe.${commandString}`,
        arguments: [this.metadata]
      };
    }
  }
  makeCollapsible() {
    this.collapsibleState = TreeItemCollapsibleState.Collapsed;
  }
  expand() {
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }
  addChild(item: StripeTreeItem) {
    this.children.push(item);
    if (this.children.length) {
      if (this.collapsibleState != TreeItemCollapsibleState.Expanded) {
        this.makeCollapsible();
      }
    }
    return this;
  }
}
