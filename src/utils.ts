import * as vscode from "vscode";

export enum OSType {
  macOS = "macOS",
  linux = "linux",
  unknown = "unknown",
  windows = "windows",
}

export function getExtensionInfo() {
  let extension = vscode.extensions.getExtension("stripe.vscode-stripe");
  if (extension) {
    return extension.packageJSON;
  }

  return {};
}

export function getOSType(): OSType {
  let platform: string = process.platform;

  if (/^win/.test(platform)) {
    return OSType.windows;
  } else if (/^darwin/.test(platform)) {
    return OSType.macOS;
  } else if (/^linux/.test(platform)) {
    return OSType.linux;
  } else {
    return OSType.unknown;
  }
}

export async function showQuickPickWithValues(
  placeholder: string,
  items: string[]
) {
  return new Promise((resolve, reject) => {
    const input = vscode.window.createQuickPick();
    input.placeholder = placeholder;
    input.items = items.map((i) => {
      return {
        label: i,
      };
    });

    input.onDidAccept(() => {
      let value = input.selectedItems[0].label;
      resolve(value);
    });

    input.show();
  });
}

export async function filterAsync(
  arr: Array<any>,
  predicate: (value: any, index: number, array: any[]) => any
) {
  const results = await Promise.all(arr.map(predicate));
  return arr.filter((_v, index) => results[index]);
}

export async function findAsync<T>(
  arr: Array<T>,
  predicate: (value: T, index: number, obj: T[]) => Promise<boolean>,
): Promise<T | undefined> {
  const promises = arr.map(predicate);
  const results = await Promise.all(promises);
  const index = results.findIndex(result => result);
  return arr[index];
}
