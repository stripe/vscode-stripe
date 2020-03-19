import { TreeItem, TreeItemCollapsibleState } from "vscode";

export class StripeTreeItem extends TreeItem {
  parent: StripeTreeItem | undefined;
  children: StripeTreeItem[] = [];
  private _metadata: object | undefined;
  private commandString: string | undefined;

  constructor(label: string, commandString?: string) {
    super(label, TreeItemCollapsibleState.None);
    this.contextValue = "stripe";
    this.commandString = commandString;
    this.metadata = {};
  }

  set metadata(data: any) {
    this._metadata = data;
    if (this.commandString) {
      this.command = {
        title: `stripe.${this.commandString}`,
        command: `stripe.${this.commandString}`,
        arguments: [this._metadata]
      };
    }
  }
  makeCollapsible() {
    this.collapsibleState = TreeItemCollapsibleState.Collapsed;
  }
  expand() {
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  setIcon(icons: { light: string; dark: string }) {
    this.iconPath = icons;
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
