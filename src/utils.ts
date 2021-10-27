import * as vscode from 'vscode';

const extensionId = 'stripe.vscode-stripe';

export enum OSType {
  macOSintel = 'macOSintel',
  macOSarm = 'macOSarm',
  linux = 'linux',
  unknown = 'unknown',
  windows = 'windows',
}

export function getUserAgent() {
  const extension = vscode.extensions.getExtension(extensionId);
  return extension
    ? `${extension.id}/${extension.packageJSON?.version} vscode/${vscode.version}`
    : '';
}

export function getExtensionInfo() {
  const extension = vscode.extensions.getExtension(extensionId);
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
      input.hide();
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

export function openNewTextEditorWithContents(contents: string, filename: string) {
  var fixtureFile: vscode.Uri = vscode.Uri.parse(`untitled:${filename}`);
  vscode.workspace
    .openTextDocument(fixtureFile)
    .then((doc: vscode.TextDocument) => vscode.languages.setTextDocumentLanguage(doc, 'json'))
    .then(
      (doc: vscode.TextDocument) => {
        vscode.window.showTextDocument(doc, 1, false).then((e) => {
          e.edit((edit) => {
            edit.insert(new vscode.Position(0, 0), contents);
          });
        });
      },
      (error: any) => {
        console.error(error);
        debugger;
      },
    );
}

function validateFixtureProperty(property: string, fixture: any, pos: number): string {
  if (!(property in fixture)) {
    return `Property "${property}" missing at fixture position ${pos}.`;
  }
  return '';
}

function validateFixture(fixture: any, pos: number): string {
  const properties = ['name', 'path', 'method', 'params'];

  try {
    properties.forEach((prop: string) => {
      const err = validateFixtureProperty(prop, fixture, pos);
      if (err) {
        throw new Error(err);
      }
    });
  } catch (e: any) {
    return e.message;
  }
  return '';
}

export function validateFixtureEvent(contents: string): string {
  const fixtureObj = JSON.parse(contents);

  if (!('fixtures' in fixtureObj)) {
    return '"Fixtures" property is missing.';
  }

  try {
    let pos = 0;
    fixtureObj.fixtures.forEach((fixture: any) => {
      const err = validateFixture(fixture, pos);
      pos += 1;
      if (err) {
        throw new Error(err);
      }
    });
  } catch (e: any) {
    return e.message.replace('Error:', '');
  }

  return '';
}
