import * as vscode from 'vscode';
import {OSType, filterAsync, findAsync, getOSType} from './utils';
import psList from 'ps-list';

type SupportedStripeCommand = 'listen' | 'logs' | 'login' | 'trigger';

export class StripeTerminal {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private static KNOWN_LONG_RUNNING_COMMANDS = [
    'stripe listen',
    'stripe logs tail',
  ];

  private terminals: Array<vscode.Terminal>;

  constructor() {
    this.terminals = [];
    vscode.window.onDidCloseTerminal((terminal) => {
      terminal.dispose();
      this.terminals = this.terminals.filter((t) => t !== terminal);
    });
  }

  public async execute(
    command: SupportedStripeCommand,
    args: Array<string> = [],
  ): Promise<void> {
    const globalCLIFLags = this.getGlobalCLIFlags();

    const commandString = [
      'stripe',
      command,
      ...args,
      ...globalCLIFLags
    ].join(' ');

    const allRunningProcesses = await psList();
    const terminal = await this.terminalForCommand(commandString, allRunningProcesses);
    terminal.sendText(commandString);
    terminal.show();
    const otherTerminals = this.terminals.filter((t) => t !== terminal);
    this.freeUnusedTerminals(otherTerminals, allRunningProcesses);
  }

  private createNewSplitTerminal(): Promise<vscode.Terminal> {
    return new Promise(async (resolve, reject) => {
      await vscode.commands.executeCommand('workbench.action.terminal.split');

      vscode.window.onDidChangeActiveTerminal((terminal) => {
        if (terminal) {
          resolve(terminal);
        }
      });
    });
  }

  private isCommandLongRunning(command: string): boolean {
    if (getOSType() === OSType.windows) {
      // On Windows we can't get the process command, so always assume terminals running `stripe` are long running
      return command.indexOf('stripe') > -1;
    }
    return StripeTerminal.KNOWN_LONG_RUNNING_COMMANDS.some((knownCommand) => (
      command.indexOf(knownCommand) > -1
    ));
  }

  private async getRunningProcess(
    terminal: vscode.Terminal,
    allRunningProcesses: psList.ProcessDescriptor[],
  ): Promise<psList.ProcessDescriptor | null> {
    const shellPid = await terminal.processId;
    const runningProcess = allRunningProcesses.find((p) => p.ppid === shellPid);
    return runningProcess || null;
  }

  private async getRunningCommand(
    terminal: vscode.Terminal,
    allRunningProcesses: psList.ProcessDescriptor[],
  ): Promise<string | null> {
    const runningProcess = await this.getRunningProcess(terminal, allRunningProcesses);
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

  private async getUsersStripeTerminal(
    allRunningProcesses: psList.ProcessDescriptor[]
  ): Promise<vscode.Terminal | undefined> {
    const usersTerminals = vscode.window.terminals.filter((t) => !this.terminals.includes(t));
    const usersStripeTerminal = await findAsync(usersTerminals, async (t) => {
      const runningCommand = await this.getRunningCommand(t, allRunningProcesses);
      return !!runningCommand && this.isCommandLongRunning(runningCommand);
    });
    return usersStripeTerminal;
  }

  private async terminalForCommand(
    command: string,
    allRunningProcesses: psList.ProcessDescriptor[],
  ): Promise<vscode.Terminal> {
    // If the user had manually created a terminal and ran `stripe listen` or `stripe logs tail`,
    // we would want to know about it so that we can reuse that terminal or spawn new split
    // terminals off of it. This gives a better experience than ignoring that terminal.
    const usersStripeTerminal = await this.getUsersStripeTerminal(allRunningProcesses);
    if (this.terminals.length === 0 && usersStripeTerminal) {
      this.terminals.push(usersStripeTerminal);
    }

    // If the command is a long-running one, and it's already running in a VS Code terminal,
    // we restart it in the same terminal. This does not occur on Windows due to OS limitations.
    if (this.isCommandLongRunning(command)) {
      const terminalWithDesiredCommand = await findAsync(this.terminals, async (t) => {
        const runningCommand = await this.getRunningCommand(t, allRunningProcesses);
        return runningCommand === command;
      });
      if (terminalWithDesiredCommand) {
        const runningProcess = await this.getRunningProcess(terminalWithDesiredCommand, allRunningProcesses);
        if (runningProcess) {
          process.kill(runningProcess.pid, 'SIGINT');
        }
        return terminalWithDesiredCommand;
      }
    }

    const unusedTerminal = await findAsync(this.terminals, async (t) => {
      const runningCommand = await this.getRunningCommand(t, allRunningProcesses);
      return !runningCommand;
    });

    if (unusedTerminal) {
      return unusedTerminal;
    }

    if (this.terminals.length > 0) {
      const lastTerminal = this.terminals[this.terminals.length - 1];
      lastTerminal.show(); // In case it is hidden
      const terminal = await this.createNewSplitTerminal();
      this.terminals.push(terminal);
      return terminal;
    }

    const terminal = vscode.window.createTerminal('Stripe');
    this.terminals.push(terminal);
    return terminal;
  }

  private async freeUnusedTerminals(
    terminals: vscode.Terminal[],
    allRunningProcesses: psList.ProcessDescriptor[],
  ): Promise<void> {
    const unusedTerminals = await filterAsync(terminals, async (t) => {
      const runningCommand = await this.getRunningCommand(t, allRunningProcesses);
      return !runningCommand;
    });
    unusedTerminals.forEach((t) => {
      t.dispose();
    });
    this.terminals = this.terminals.filter((t) => !unusedTerminals.includes(t));
  }

  // The Stripe CLI supports a number of flags for every command. See https://stripe.com/docs/cli/flags
  private getGlobalCLIFlags(): Array<string> {
    const stripeConfig = vscode.workspace.getConfiguration('stripe');

    const projectName = stripeConfig.get('projectName', null);

    const projectNameFlag = projectName ? ['--project-name', projectName] : [];

    return [
      ...projectNameFlag,
    ];
  }
}
