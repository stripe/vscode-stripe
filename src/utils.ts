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
