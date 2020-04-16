import * as vscode from "vscode";

export function getExtensionInfo() {
  let extension = vscode.extensions.getExtension("stripe.vscode-stripe");
  if (extension) {
    return extension.packageJSON;
  }

  return {};
}
