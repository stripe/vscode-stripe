import * as vscode from "vscode";
import psList from "ps-list";

export class StripeTerminal {
  mainTerminal: vscode.Terminal | null;
  splitTerminal: vscode.Terminal | null;
  lastCommandLongRunning: boolean;

  constructor() {
    this.mainTerminal = null;
    this.lastCommandLongRunning = false;
    this.splitTerminal = null;

    vscode.window.onDidCloseTerminal((terminal) => {
      if (terminal == this.mainTerminal) {
        this.mainTerminal = null;
      }

      if (terminal == this.splitTerminal) {
        this.splitTerminal = null;
      }
    });
  }

  public async execute(command: string, options?: any): Promise<void> {
    let terminalName = "Stripe";
    let isNewCommandLongRunning = this.isCommandLongRunning(command);

    if (!this.mainTerminal) {
      this.mainTerminal = vscode.window.createTerminal(terminalName);
    }

    let isLongRunningCommandRunning = await this.isStripeCLIRunningWithLongRunningProcess();

    if (isNewCommandLongRunning) {
      // Always use main terminal for long runnig commands
      if (isLongRunningCommandRunning) {
        // Terminal is still active, so exit running command
        this.mainTerminal.sendText("\u0003");
      }

      this.mainTerminal.sendText(command);
      this.mainTerminal.show();
    } else if (isLongRunningCommandRunning) {
      // CLI is running, but new command isn't long running, so split
      this.mainTerminal.show();

      if (!this.splitTerminal) {
        this.splitTerminal = await this.createNewSplitTerminal();
      }

      this.splitTerminal.sendText(command);
      this.splitTerminal.show();
    } else {
      // Fallback to main terminal
      this.mainTerminal.sendText(command);
      this.mainTerminal.show();

      if (this.splitTerminal) {
        // Close split terminal as it isn't needed
        this.splitTerminal.dispose();
        this.splitTerminal = null;
      }
    }
  }

  async createNewSplitTerminal(): Promise<vscode.Terminal> {
    return new Promise(async (resolve, reject) => {
      await vscode.commands.executeCommand("workbench.action.terminal.split");

      vscode.window.onDidChangeActiveTerminal((terminal) => {
        if (terminal) {
          resolve(terminal);
        }
      });
    });
  }

  async isStripeCLIRunningWithLongRunningProcess(): Promise<boolean> {
    let runningProcesses = await psList();
    let stripeCLIprocess = runningProcesses.find((p) => p.name == "stripe");

    if (stripeCLIprocess && stripeCLIprocess.cmd) {
      return this.isCommandLongRunning(stripeCLIprocess.cmd);
    }

    return false;
  }

  isCommandLongRunning(command: string): boolean {
    let commands = ["stripe listen", "stripe logs tail"];

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.indexOf(command) > 0) {
        return true;
      }
    }

    return false;
  }

  async getOpenTerminalProcessIds(): Promise<(number | undefined)[]> {
    return Promise.all(
      vscode.window.terminals.map(async (f) => await f.processId)
    );
  }
}
