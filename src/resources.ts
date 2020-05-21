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
        ),
        add: context.asAbsolutePath(
          path.join("resources", "icons", "light", "add.svg")
        ),
        report: context.asAbsolutePath(
          path.join("resources", "icons", "light", "report.svg")
        ),
        feedback: context.asAbsolutePath(
          path.join("resources", "icons", "light", "feedback.svg")
        ),
        book: context.asAbsolutePath(
          path.join("resources", "icons", "light", "book.svg")
        ),
        settings: context.asAbsolutePath(
          path.join("resources", "icons", "light", "settings-gear.svg")
        ),
      },
      dark: {
        linkExternal: context.asAbsolutePath(
          path.join("resources", "icons", "dark", "link-external.svg")
        ),
        terminal: context.asAbsolutePath(
          path.join("resources", "icons", "dark", "terminal.svg")
        ),
        add: context.asAbsolutePath(
          path.join("resources", "icons", "dark", "add.svg")
        ),
        report: context.asAbsolutePath(
          path.join("resources", "icons", "dark", "report.svg")
        ),
        feedback: context.asAbsolutePath(
          path.join("resources", "icons", "dark", "feedback.svg")
        ),
        book: context.asAbsolutePath(
          path.join("resources", "icons", "dark", "book.svg")
        ),
        settings: context.asAbsolutePath(
          path.join("resources", "icons", "dark", "settings-gear.svg")
        ),
      },
    };
  }
}
