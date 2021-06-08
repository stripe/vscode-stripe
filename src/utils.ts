import * as vscode from 'vscode';

export enum OSType {
  macOSintel = 'macOSintel',
  macOSarm = 'macOSarm',
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
  const arch: string = process.arch;

  if (/^win/.test(platform)) {
    return OSType.windows;
  } else if (/^darwin/.test(platform)) {
    if (arch === 'arm64') {
      return OSType.macOSarm;
    }

    return OSType.macOSintel;
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

export function debounce(func: (...args: any[]) => any, wait: number): (...args: any[]) => any {
  let timeout: NodeJS.Timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      clearTimeout(timeout);
      func(...args);
    }, wait);
  };
}

/**
 * Convert a Unix timestamp to a string formatted to the user's VS Code locale, with a timezone suffix.
 *
 * Example formats:
 * - `en-gb`: 04/03/2021, 14:14:35 GMT-8
 * - `ja-jp`: 2021/3/4 14:14:35 GMT-8
 *
 * @param unix Unix timestamp in seconds
 * @returns Locale string of the timestamp, with short timezone suffix
 */
export function unixToLocaleStringTZ(unix: number): string {
  return new Date(unix * 1000).toLocaleString(vscode.env.language, {timeZoneName: 'short'});
}

/**
 * Convert e.g. apiVersion to api_version
 */
export function camelToSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Apply rename to all the keys in object
 */
export function recursivelyRenameKeys(object: Object, rename: (str: string) => string): Object {
  if (Array.isArray(object)) {
    return object.map((o) => recursivelyRenameKeys(o, rename));
  }
  if (object && typeof object === 'object') {
    return Object.fromEntries(
      Object.entries(object).map(([k, v]) => [rename(k), recursivelyRenameKeys(v, rename)]),
    );
  }
  return object;
}
