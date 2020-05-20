import * as vscode from "vscode";

export class StripeTerminal {
  terminal: vscode.Terminal | null;

  constructor() {
    this.terminal = null;
  }

  public async execute(command: string): Promise<void> {
    let stripeTerminal = vscode.window.terminals.find(
      (f) => f.name == "Stripe"
    );
    let isNew = false;

    if (!stripeTerminal) {
      this.terminal = vscode.window.createTerminal("Stripe");
      isNew = true;
    } else {
      this.terminal = stripeTerminal;
    }

    if (!isNew && this.terminal.exitStatus == undefined) {
      // existing terminal is still active, so exit running command
      this.terminal.sendText("\u0003");
    }

    this.terminal.sendText(command);
    this.terminal.show();
  }
}
