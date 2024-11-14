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
      test(`runs command with ${path}`, async () => {
        const executeTaskSpy = sandbox.spy(vscode.tasks, 'executeTask');
        sandbox.stub(terminalStub, 'sendText');
        sandbox
          .stub(vscode.window, 'createTerminal')
          .returns(terminalStub);
        const stripeClientStub = <any>{getCLIPath: () => {}, isAuthenticated: () => true};
        sandbox
          .stub(stripeClientStub, 'getCLIPath')
          .returns(Promise.resolve(path));

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
              {
                quoting: vscode.ShellQuoting.Strong,
                value: '--forward-to'
              },
              {
                quoting: vscode.ShellQuoting.Strong,
                value: 'localhost'
              }
            ])
          ),
        ]);
      });
    });
  });

  suite('with no Stripe CLI installed', () => {
    test('does not run command', async () => {
      const sendTextStub = sandbox.stub(terminalStub, 'sendText');
      const createTerminalStub = sandbox
        .stub(vscode.window, 'createTerminal')
        .returns(terminalStub);
      const stripeClientStub = <any>{getCLIPath: () => {}, isAuthenticated: () => true};
      sandbox.stub(stripeClientStub, 'getCLIPath').returns(null);

      const stripeTerminal = new StripeTerminal(stripeClientStub);
      await stripeTerminal.execute('listen', ['--forward-to', 'localhost']);

      assert.strictEqual(createTerminalStub.callCount, 0);
      assert.deepStrictEqual(sendTextStub.callCount, 0);
    });
  });
});
