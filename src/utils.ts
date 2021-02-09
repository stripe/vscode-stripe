import * as vscode from 'vscode';
const os = require('os'); // Not sure if this is needed/will work

export enum OSType {
  macOS = 'macOS',
  macOSapple = 'macOSapple', // Need a new OSType value for M1 Macs because Homebrew uses a different directory than on Intel Macs
  linux = 'linux',
  unknown = 'unknown',
  windows = 'windows',
}

export function getExtensionInfo() {
  const extension = vscode.extensions.getExtension('stripe.vscode-stripe');
  if (extension) {
    return extension.packageJSON;
  }

  return {};
}

export function getOSType(): OSType {
  const platform: string = process.platform;
  
  const cpus = os.cpus(); // Returns an array of all CPU cores
  const cpu: string = cpus[0]model; // Copying syntax of line 22, not sure if this will work

  if (/^win/.test(platform)) {
    return OSType.windows;
  } else if (/^darwin/.test(platform)) {
    if(/^Apple/.test(cpu)) { // Adding a CPU type check if MacOS 
      return OSType.macOSapple;
    } else {
      return OSType.macOS;
    }
  } else if (/^linux/.test(platform)) {
    return OSType.linux;
  } else {
    return OSType.unknown;
  }
}

export function showQuickPickWithValues(placeholder: string, value: string[]): Promise<string> {
  const items: vscode.QuickPickItem[] = value.map((i) => {
    return {
      label: i,
    };
  });

  return showQuickPickWithItems(placeholder, items);
}

export function showQuickPickWithItems(
  placeholder: string,
  items: vscode.QuickPickItem[],
): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = vscode.window.createQuickPick();
    input.placeholder = placeholder;
    input.items = items;
    input.onDidAccept(() => {
      const value = input.selectedItems[0].label;
      resolve(value);
    });

    input.show();
  });
}

export async function filterAsync<T>(
  arr: Array<T>,
  predicate: (value: T, index: number, array: T[]) => Promise<boolean>,
): Promise<Array<T>> {
  const results = await Promise.all(arr.map(predicate));
  return arr.filter((_v, index) => results[index]);
}

export async function findAsync<T>(
  arr: Array<T>,
  predicate: (value: T, index: number, array: T[]) => Promise<boolean>,
): Promise<T | undefined> {
  const promises = arr.map(predicate);
  const results = await Promise.all(promises);
  const index = results.findIndex((result) => result);
  return arr[index];
}
