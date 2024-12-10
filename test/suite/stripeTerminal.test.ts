import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import {StripeTerminal} from '../../src/stripeTerminal';

suite('stripeTerminal', function () {
  this.timeout(20000);

  let sandbox: sinon.SinonSandbox;

  const terminalStub = <vscode.Terminal><unknown>{
    name: 'Stubbed Terminal',
    processId: Promise.resolve(undefined),
    creationOptions: {},
    exitStatus: undefined,
    sendText: (text: string, addNewLine?: boolean) => { },
    show: (preserveFocus?: boolean) => { },
    hide: () => { },
    dispose: () => { },
  };

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  ['/usr/local/bin/stripe', '/custom/path/to/stripe'].forEach((path) => {
    suite(`when the Stripe CLI is installed at ${path}`, () => {
      test('runs command with valid project name', async () => {
        const executeTaskSpy = sandbox.spy(vscode.tasks, 'executeTask');
        sandbox.stub(terminalStub, 'sendText');
        sandbox.stub(vscode.window, 'createTerminal').returns(terminalStub);

        // Mock the configuration with a valid project name
        const stripeClientStub = <any>{
          getCLIPath: () => { },
          isAuthenticated: () => true,
        };

        // Mock the getConfiguration function to return a valid project name
        sandbox.stub(vscode.workspace, 'getConfiguration').returns({
          get: (key: string) => {
            if (key === 'projectName') {
              return 'Valid_Project-Name'; // Valid project name
            }
            return null;
          },
          has: function (section: string): boolean {
            throw new Error('Function not implemented.');
          },
          inspect: function <T>(section: string): { key: string; defaultValue?: T; globalValue?: T; workspaceValue?: T; workspaceFolderValue?: T; defaultLanguageValue?: T; globalLanguageValue?: T; workspaceLanguageValue?: T; workspaceFolderLanguageValue?: T; languageIds?: string[]; } | undefined {
            throw new Error('Function not implemented.');
          },
          update: function (section: string, value: any, configurationTarget?: vscode.ConfigurationTarget | boolean | null, overrideInLanguage?: boolean): Thenable<void> {
            throw new Error('Function not implemented.');
          }
        });

        sandbox.stub(stripeClientStub, 'getCLIPath').returns(Promise.resolve(path));

        const stripeTerminal = new StripeTerminal(stripeClientStub);
        await stripeTerminal.execute('listen', ['--forward-to', 'localhost']);

        assert.strictEqual(executeTaskSpy.callCount, 1);
        assert.deepStrictEqual(executeTaskSpy.args[0], [
          new vscode.Task(
            {type: 'stripe', command: 'listen'},
            vscode.TaskScope.Workspace,
            'listen',
            'stripe',
            new vscode.ShellExecution(path, [
              'listen',
              '--forward-to',
              'localhost',
              '--project-name',
              'Valid_Project-Name'
            ],
            {
              shellQuoting: {
                escape: {
                  escapeChar: '\\',
                  charsToEscape: '&`|"\'',
                },
              },
            }),
          ),
        ]);
      });

      test('throws error for invalid project name', async () => {
        // Mock the configuration with an invalid project name
        const stripeClientStub = <any>{
          getCLIPath: () => { },
          isAuthenticated: () => true,
        };

        // Mock the getConfiguration function to return an invalid project name
        sandbox.stub(vscode.workspace, 'getConfiguration').returns({
          get: (key: string) => {
            if (key === 'projectName') {
              return 'Invalid Project Name!'; // Invalid project name
            }
            return null;
          },
          has: function (section: string): boolean {
            throw new Error('Function not implemented.');
          },
          inspect: function <T>(section: string): { key: string; defaultValue?: T; globalValue?: T; workspaceValue?: T; workspaceFolderValue?: T; defaultLanguageValue?: T; globalLanguageValue?: T; workspaceLanguageValue?: T; workspaceFolderLanguageValue?: T; languageIds?: string[]; } | undefined {
            throw new Error('Function not implemented.');
          },
          update: function (section: string, value: any, configurationTarget?: vscode.ConfigurationTarget | boolean | null, overrideInLanguage?: boolean): Thenable<void> {
            throw new Error('Function not implemented.');
          }
        });

        sandbox.stub(vscode.window, 'createTerminal').returns(terminalStub);
        sandbox.stub(stripeClientStub, 'getCLIPath').returns(Promise.resolve(path));

        const stripeTerminal = new StripeTerminal(stripeClientStub);

        // Expect an error to be thrown due to invalid project name
        await assert.rejects(
          async () => {
            await stripeTerminal.execute('listen', ['--forward-to', 'localhost']);
          },
          {
            name: 'Error',
            message: "Invalid project name: 'Invalid Project Name!'. Project names can only contain letters, numbers, spaces, underscores, and hyphens.",
          }
        );
      });
    });
  });

  suite('with no Stripe CLI installed', () => {
    test('does not run command', async () => {
      const sendTextStub = sandbox.stub(terminalStub, 'sendText');
      const createTerminalStub = sandbox.stub(vscode.window, 'createTerminal').returns(terminalStub);
      const stripeClientStub = <any>{getCLIPath: () => { }, isAuthenticated: () => true};
      sandbox.stub(stripeClientStub, 'getCLIPath').returns(null);

      const stripeTerminal = new StripeTerminal(stripeClientStub);
      await stripeTerminal.execute('listen', ['--forward-to', 'localhost']);

      assert.strictEqual(createTerminalStub.callCount, 0);
      assert.deepStrictEqual(sendTextStub.callCount, 0);
    });
  });
});
