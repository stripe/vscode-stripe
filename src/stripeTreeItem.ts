import {TreeItem, TreeItemCollapsibleState} from 'vscode';

type StripeTreeItemOptions = Pick<TreeItem, 'contextValue' | 'tooltip' | 'iconPath'> & {
  /**
   * The command that should be executed when the tree item is selected.
   * Automatically prefixed with `'stripe.'`.
   */
  commandString?: string;
};

export class StripeTreeItem extends TreeItem {
  parent: StripeTreeItem | undefined;
  children: StripeTreeItem[] = [];
  readonly label: string;
  private _metadata: object | undefined;
  private commandString: string | undefined;

  constructor(label: string, options: StripeTreeItemOptions = {}) {
    super(label, TreeItemCollapsibleState.None);
    this.label = label;
    this.contextValue = options.contextValue || 'stripe';
    this.commandString = options.commandString;
    this.iconPath = options.iconPath;
    this.tooltip = options.tooltip;
    this.metadata = {};
  }

  get metadata() {
    return this._metadata;
  }

  set metadata(data: any) {
    this._metadata = data;
    if (this.commandString) {
      this.command = {
        title: `stripe.${this.commandString}`,
        command: `stripe.${this.commandString}`,
        arguments: [this._metadata],
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
      if (this.collapsibleState !== TreeItemCollapsibleState.Expanded) {
        this.makeCollapsible();
      }
    }
    return this;
  }
}
