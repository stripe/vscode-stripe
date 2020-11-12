import * as vscode from "vscode";
import psList from "ps-list";
import { getOSType, OSType, filterAsync, findAsync } from "./utils";

export class StripeTerminal {
  private static KNOWN_LONG_RUNNING_COMMANDS = [
    "stripe listen",
    "stripe logs tail",
  ];

  private terminals: Array<vscode.Terminal>;

  constructor() {
    this.terminals = [];
    vscode.window.onDidCloseTerminal((terminal) => {
      terminal.dispose();
      this.terminals = this.terminals.filter((t) => t !== terminal);
    });
  }

  public async execute(command: string): Promise<void> {
    const terminal = await this.terminalForCommand(command);
    terminal.sendText(command);
    terminal.show();
    const otherTerminals = this.terminals.filter((t) => t !== terminal);
    this.freeUnusedTerminals(otherTerminals);
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

  private async getRunningProcess(terminal: vscode.Terminal): Promise<psList.ProcessDescriptor | null> {
    const shellPid = await terminal.processId;
    const runningProcesses = await psList();
    const runningProcess = runningProcesses.find((p) => p.ppid === shellPid);
    return runningProcess ? runningProcess : null;
  }

  private async getRunningCommand(terminal: vscode.Terminal): Promise<string | null> {
    const runningProcess = await this.getRunningProcess(terminal);
    if (getOSType() === OSType.windows) {
      if (runningProcess && runningProcess.name) {
        // On Windows we can't get the process command
        return runningProcess.name;
      }
    } else if (runningProcess && runningProcess.cmd) {
      return runningProcess.cmd;
    }

    return null;
  }

  private async terminalForCommand(command: string): Promise<vscode.Terminal> {
    // If the command is a long-running one, and it's already running in a VS Code terminal,
    // we restart it in the same terminal. This does not occur on Windows due to OS limitations.
    if (this.isCommandLongRunning(command)) {
      const terminalWithDesiredCommand = await findAsync(this.terminals, async (t) => {
        const runningCommand = await this.getRunningCommand(t);
        return runningCommand === command;
      });
      if (terminalWithDesiredCommand) {
        const runningProcess = await this.getRunningProcess(terminalWithDesiredCommand);
        if (runningProcess) {
          process.kill(runningProcess.pid, 'SIGINT');
        }
        return terminalWithDesiredCommand;
      }
    }

    const unusedTerminal = await findAsync(this.terminals, async (t) => {
      const runningCommand = await this.getRunningCommand(t);
      return !runningCommand;
    });

    if (unusedTerminal) {
      return unusedTerminal;
    }

    if (this.terminals.length > 0) {
      const terminal = await this.createNewSplitTerminal();
      this.terminals.push(terminal);
      return terminal;
    }

    const terminal = vscode.window.createTerminal("Stripe");
    this.terminals.push(terminal);
    return terminal;
  }

  private async freeUnusedTerminals(terminals: vscode.Terminal[]): Promise<void> {
    const unusedTerminals = await filterAsync(terminals, async (t) => {
      const runningCommand = await this.getRunningCommand(t);
      return !runningCommand;
    });
    unusedTerminals.forEach((t) => {
      t.dispose();
    });
    this.terminals = this.terminals.filter((t) => !unusedTerminals.includes(t));
  }
}
