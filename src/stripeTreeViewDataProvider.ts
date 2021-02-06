import {Event, EventEmitter, TreeDataProvider, TreeItem} from 'vscode';
import {StripeTreeItem} from './stripeTreeItem';

export class StripeTreeViewDataProvider implements TreeDataProvider<TreeItem> {
  private treeItems: TreeItem[] | null = null;
  private _onDidChangeTreeData: EventEmitter<TreeItem | null> = new EventEmitter<TreeItem | null>();
  readonly onDidChangeTreeData: Event<TreeItem | null> = this._onDidChangeTreeData.event;

  public refresh() {
    this.treeItems = null;
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: TreeItem): TreeItem {
    return element;
  }

  public getParent(element: TreeItem): TreeItem | null {
    if (element instanceof StripeTreeItem && element.parent) {
      return element.parent;
    }
    return null;
  }

  public async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    if (!this.treeItems) {
      this.treeItems = await this.buildTree();
    }

    if (element instanceof StripeTreeItem) {
      return element.children;
    }

    if (!element) {
      if (this.treeItems) {
        return this.treeItems;
      }
    }
    return [];
  }

  buildTree(): Promise<StripeTreeItem[]> {
    return Promise.resolve([]);
  }
}
