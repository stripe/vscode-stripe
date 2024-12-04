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

    const globalCLIFlags = this.getGlobalCLIFlags();

    vscode.tasks.executeTask(new vscode.Task(
      {type: 'stripe', command},
      vscode.TaskScope.Workspace,
      command,
      'stripe',
      new vscode.ShellExecution(cliPath, [
        command,
        ...args,
        ...globalCLIFlags
      ],
      {
        shellQuoting: {
          escape: {
            escapeChar: '\\',
            charsToEscape: '&`|"\'',
          }
        }
      }
    )
    ));
  }

  // The Stripe CLI supports a number of flags for every command. See https://stripe.com/docs/cli/flags
  private getGlobalCLIFlags(): Array<string> {
    const stripeConfig = vscode.workspace.getConfiguration('stripe');

    let projectName = stripeConfig.get<string | null>('projectName', null);
    if (projectName !== null) {
      projectName = projectName.replace(/[\\"'`]/g, '');
    }

    const projectNameFlag = projectName ? ['--project-name', projectName] : [];

    return [...projectNameFlag];
  }
}
