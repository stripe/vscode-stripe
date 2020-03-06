import * as vscode from "vscode";

const tree: any = {
  a: {
    aa: {
      aaa: {
        aaaa: {
          aaaaa: {
            aaaaaa: {}
          }
        }
      }
    },
    ab: {}
  },
  b: {
    ba: {},
    bb: {}
  }
};

let nodes: any = {};

export default class StripeTreeProvider
  implements vscode.TreeDataProvider<{ key: string }> {
  constructor() {}

  getParent({ key }: { key: string }): { key: string } {
    const parentKey = key.substring(0, key.length - 1);
    return parentKey ? new Key(parentKey) : { key: "" };
  }

  getTreeItem(element: { key: string }): vscode.TreeItem {
    const treeItem = getTreeItem(element.key);
    treeItem.id = element.key;
    return treeItem;
  }

  getChildren(element: { key: string }): { key: string }[] {
    return getChildren(element ? element.key : "").map(key => getNode(key));
  }
}

function getChildren(key: string): string[] {
  if (!key) {
    return Object.keys(tree);
  }
  let treeElement = getTreeElement(key);
  if (treeElement) {
    return Object.keys(treeElement);
  }
  return [];
}

function getTreeItem(key: string): vscode.TreeItem {
  const treeElement = getTreeElement(key);
  return {
    label: key,
    tooltip: `Tooltip for ${key}`,
    collapsibleState:
      treeElement && Object.keys(treeElement).length
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None
  };
}

function getTreeElement(element: string): any {
  let parent = tree;
  for (let i = 0; i < element.length; i++) {
    let index = element.substring(0, i + 1);
    parent = parent[index];
    if (!parent) {
      return null;
    }
  }
  return parent;
}

function getNode(key: string) {
  if (!nodes[key]) {
    nodes[key] = new Key(key);
  }
  return nodes[key];
}

class Key {
  constructor(readonly key: string) {}
}
