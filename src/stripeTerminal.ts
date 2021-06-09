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

    if (command !== 'login') {
      const isAuthenticated = await this.stripeClient.isAuthenticated();
      if (!isAuthenticated) {
        await this.stripeClient.promptLogin();
      }
    }

    const globalCLIFLags = this.getGlobalCLIFlags();

    const commandString = [cliPath, command, ...args, ...globalCLIFLags].join(' ');

    try {
      const terminal = await this.createTerminal();
      terminal.sendText(commandString);
      terminal.show();
    } catch (e) {
      vscode.window.showErrorMessage(e.message);
    }
  }

  private async createNewSplitTerminal(): Promise<vscode.Terminal | undefined> {
    const lastTerminal = this.terminals[this.terminals.length - 1];
    lastTerminal.show();

    // Note that this splits off of the user's currently visible terminal. That's why `.show()` is
    // called above.
    await vscode.commands.executeCommand<vscode.Terminal>('workbench.action.terminal.split');

    // After `workbench.action.terminal.split`, the activeTerminal becomes the newly split terminal.
    // Note that there is no API guarantee for this behavior; a prior implementation relied on
    // different behavior entirely. Because historically this behavior has been in flux, we should
    // move to an official API for creating split terminals once that lands in vscode.
    return vscode.window.activeTerminal;
  }

  private async createTerminal(): Promise<vscode.Terminal> {
    if (this.terminals.length > 0) {
      const terminal = await this.createNewSplitTerminal();
      if (!terminal) {
        throw new Error('Failed to create a terminal for this Stripe command. Please try again.');
      }

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
