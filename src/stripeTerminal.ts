import * as vscode from "vscode";
import psList from "ps-list";
import { getOSType, OSType } from "./utils";

export class StripeTerminal {
  private static KNOWN_LONG_RUNNING_COMMANDS = [
    "stripe listen",
    "stripe logs tail",
  ];

  private terminals: Array<vscode.Terminal | null>;

  constructor() {
    this.terminals = [];
    vscode.window.onDidCloseTerminal((terminal) => {
      terminal.dispose();
      const i = this.terminals.findIndex((t) => t === terminal);
      this.terminals = this.terminals.slice(0, i).concat(this.terminals.slice(i + 1));
    });
  }

  // Starting from the leftmost open terminal, send a command to the first available terminal and clean up unused ones.
  public async execute(command: string): Promise<void> {
    let wasAvailableTerminalFound = false;

    for (let i = 0; i < this.terminals.length; i++) {
      const t = this.terminals[i];
      if (t === null) {
        continue;
      }

      const runningCommand = await this.getRunningCommand(t);
      const isCommandLongRunning = runningCommand !== null && this.isCommandLongRunning(runningCommand);

      const shouldUseThisTerminal = !wasAvailableTerminalFound && !runningCommand && !isCommandLongRunning;
      const shouldRestartThisTerminal = !wasAvailableTerminalFound && isCommandLongRunning && runningCommand === command; // Always false on Windows
      const shouldDisposeThisTerminal = wasAvailableTerminalFound && !runningCommand;

      if (shouldUseThisTerminal) {
        wasAvailableTerminalFound = true;
        t.sendText(command);
        t.show();
      } else if (shouldRestartThisTerminal) {
        wasAvailableTerminalFound = true;
        t.sendText('\x03');
        t.sendText(command);
        t.show();
      } else if (shouldDisposeThisTerminal) {
        t.dispose();
        this.terminals[i] = null;
      }
    }

    if (!wasAvailableTerminalFound) {
      const newTerminal = this.terminals.length < 1 ?
        vscode.window.createTerminal("Stripe") :
        await this.createNewSplitTerminal();
      this.terminals.push(newTerminal);
      newTerminal.sendText(command);
      newTerminal.show();
    }

    this.terminals = this.terminals.filter((terminal) => terminal !== null);
  }

  private async createNewSplitTerminal(): Promise<vscode.Terminal> {
    return new Promise(async (resolve, reject) => {
      await vscode.commands.executeCommand("workbench.action.terminal.split");

      vscode.window.onDidChangeActiveTerminal((terminal) => {
        if (terminal) {
          resolve(terminal);
        }
      });
    });
  }

  private isCommandLongRunning(command: string): boolean {
    if (getOSType() === OSType.windows) {
      // On Windows we can't get the process command, so always assume it's long running
      return true;
    }
    return StripeTerminal.KNOWN_LONG_RUNNING_COMMANDS.some((knownCommand) => (
      command.indexOf(knownCommand) > -1
    ));
  }

  private async getRunningCommand(terminal: vscode.Terminal): Promise<string | null> {
    const shellId = await terminal.processId;
    const runningProcesses = await psList();
    const runningStripeCLIProcess = runningProcesses.find((p) => p.ppid === shellId);

    if (getOSType() === OSType.windows) {
      if (runningStripeCLIProcess && runningStripeCLIProcess.name) {
        // On Windows we can't get the process command
        return runningStripeCLIProcess.name;
      }
    } else if (runningStripeCLIProcess && runningStripeCLIProcess.cmd) {
      return runningStripeCLIProcess.cmd;
    }

    return null;
  }
}
