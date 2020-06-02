import * as vscode from "vscode";

export class StripeTerminal {
  terminal: vscode.Terminal | null;
  longRunTerminal: vscode.Terminal | null;
  lastCommandLongRunning: boolean;

  constructor() {
    this.terminal = null;
    this.lastCommandLongRunning = false;
    this.longRunTerminal = null;
  }

  public async execute(command: string, options?: any): Promise<void> {
    let terminalName = "Stripe";
    let isNew = false;
    //  We currently don't have a VS Code API to detect the launched process, or to know if the executed conmand has returned. So we are storing the intention of the last run command.
    let isCommandLongRunning = options ? options.longRuning : false;

    let stripeTerminal = vscode.window.terminals.find(
      (f) => f.name == terminalName
    );

    if (!stripeTerminal) {
      this.terminal = vscode.window.createTerminal(terminalName);
      isNew = true;
    } else {
      this.terminal = stripeTerminal;
    }

    let isActive = !isNew && this.terminal.exitStatus == undefined;
    if (isActive && this.lastCommandLongRunning) {
      // Use single use termimal as the last command is expected to still run
      let singleUseTerminal = vscode.window.createTerminal();
      singleUseTerminal.sendText(command);
      singleUseTerminal.show();

      // Dispose single use terminal after 8 sec / max duration a command seem to run
      setTimeout(() => {
        singleUseTerminal.dispose();
      }, 8000);
    } else if (isActive) {
      // Terminal is still active, so exit running command
      this.terminal.sendText("\u0003");
    }

    this.terminal.sendText(command);
    this.terminal.show();

    this.lastCommandLongRunning = isCommandLongRunning;
  }
}
