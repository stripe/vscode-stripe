import * as vscode from "vscode";
import * as path from "path";

export class Resource {
  static icons: any;

  static initialize(context: vscode.ExtensionContext) {
    Resource.icons = {
      light: {
        linkExternal: context.asAbsolutePath(
          path.join("resources", "icons", "light", "link-external.svg")
        ),
        terminal: context.asAbsolutePath(
          path.join("resources", "icons", "light", "terminal.svg")
        )
      },
      dark: {
        linkExternal: context.asAbsolutePath(
          path.join("resources", "icons", "dark", "link-external.svg")
        ),
        terminal: context.asAbsolutePath(
          path.join("resources", "icons", "dark", "terminal.svg")
        )
      }
    };
  }
}
