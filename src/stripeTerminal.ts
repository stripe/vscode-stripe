import * as vscode from 'vscode';
import {StripeClient} from './stripeClient';

type SupportedStripeCommand = 'events' | 'listen' | 'logs' | 'login' | 'trigger';

export class StripeTerminal {
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

  public async execute(command: SupportedStripeCommand, args: Array<string> = []): Promise<void> {
    const cliPath = await this.stripeClient.getCLIPath();
    if (!cliPath) {
      return;
    }

    const globalCLIFLags = this.getGlobalCLIFlags();

    const commandString = [cliPath, command, ...args, ...globalCLIFLags].join(' ');

    const terminal = await this.createTerminal();
    terminal.sendText(commandString);
    terminal.show();
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

  private async createTerminal(): Promise<vscode.Terminal> {
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

  // The Stripe CLI supports a number of flags for every command. See https://stripe.com/docs/cli/flags
  private getGlobalCLIFlags(): Array<string> {
    const stripeConfig = vscode.workspace.getConfiguration('stripe');

    const projectName = stripeConfig.get('projectName', null);

    const projectNameFlag = projectName ? ['--project-name', projectName] : [];

    return [...projectNameFlag];
  }
}
