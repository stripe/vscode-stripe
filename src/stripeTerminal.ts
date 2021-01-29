import * as vscode from 'vscode';
import {OSType, filterAsync, findAsync, getOSType} from './utils';
import {StripeClient} from './stripeClient';
import psList from 'ps-list';

type SupportedStripeCommand = 'events' | 'listen' | 'logs' | 'login' | 'trigger';

export class StripeTerminal {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private static KNOWN_LONG_RUNNING_COMMANDS = [
    'listen',
    'logs tail',
  ];

  private stripeClient: StripeClient;
  private terminals: Array<vscode.Terminal>;

  constructor(stripeClient: StripeClient) {
    this.stripeClient = stripeClient;
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
    const cliPath = await this.stripeClient.getCLIPath();
    if (!cliPath) {
      return;
    }

    const globalCLIFLags = this.getGlobalCLIFlags();

    const commandString = [
      cliPath,
      command,
      ...args,
      ...globalCLIFLags
    ].join(' ');

    const allRunningProcesses = await psList();
    const terminal = await this.terminalForCommand(commandString, cliPath, allRunningProcesses);
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
      // On Windows we can't get the process command, so always assume commands are long-running
      return true;
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

  private async terminalForCommand(
    command: string,
    cliPath: string,
    allRunningProcesses: psList.ProcessDescriptor[],
  ): Promise<vscode.Terminal> {
    const isStripeCLICommand = command.startsWith(cliPath);

    // If the command is a long-running one, and it's already running in a VS Code terminal,
    // we restart it in the same terminal. This does not occur on Windows due to OS limitations.
    if (isStripeCLICommand && this.isCommandLongRunning(command)) {
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
