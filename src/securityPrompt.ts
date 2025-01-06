import * as vscode from 'vscode';

enum StorageKeys {
  doNotShowSecurityPromptAgain = 'stripeDoNotShowSecurityPromptAgain',
}

export class SecurityPrompt {
  storage: vscode.Memento;

  constructor(context: vscode.ExtensionContext) {
    this.storage = context.globalState;
  }

  public activate(): void {
    if (this.shouldShowBannerOnStartup()) {
      this.show();
    }
  }

  public shouldShowBannerOnStartup(): boolean {
    if (vscode.workspace.getConfiguration('stripe').has('projectName')) {
      return true;
    }
    return false;
  }

  public async show() {
    if (this.storage.get(StorageKeys.doNotShowSecurityPromptAgain)) {
      return;
    }
    const selection = await vscode.window.showInformationMessage(
      "Warning: Debugging from `launch.json` files you didn't create or using code from unofficial sources can expose your system to security risks. Please ensure you understand the implications of the code you are executing.",
      'Do not show again',
    );
    if (!selection) {
      return;
    }
    this.storage.update(StorageKeys.doNotShowSecurityPromptAgain, true);
  }
}
