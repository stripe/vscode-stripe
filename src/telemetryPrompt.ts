import * as vscode from "vscode";

enum storageKeys {
  doNotShowTelemetryPromptAgain = "stripeDoNotShowTelemetryPromptAgain",
}

export class TelemetryPrompt {
  storage: vscode.Memento;

  constructor(context: vscode.ExtensionContext) {
    this.storage = context.globalState;
  }

  public async activate(): Promise<void> {
    const show = this.shouldShowBanner();
    if (!show) {
      return;
    }

    this.showTelemetryPrompt();
  }

  public shouldShowBanner(): boolean {
    if (this.storage.get(storageKeys.doNotShowTelemetryPromptAgain)) {
      return false;
    }
    return true;
  }

  public async showTelemetryPrompt() {
    this.storage.update(storageKeys.doNotShowTelemetryPromptAgain, true);
    const prompts = ["Read More", "Okay"];

    const selection = await vscode.window.showInformationMessage(
      "The Stripe VS Code Extension collects basic telemetry in order to improve this extension's experience. If you'd like to opt out we respect the global telemetry setting in VS Code, so we won't collect any data unless this setting is turned on.",
      ...prompts
    );

    if (!selection) {
      return;
    }

    if (selection === "Read More") {
      vscode.commands.executeCommand("stripe.openTelemetryInfo");
      return;
    }
  }
}
