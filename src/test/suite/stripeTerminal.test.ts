import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import {StripeTerminal} from '../../stripeTerminal';

suite('stripeTerminal', function () {
  this.timeout(20000);

  let sandbox: sinon.SinonSandbox;

  const terminalStub = <vscode.Terminal>{
    name: 'Stubbed Terminal',
    processId: Promise.resolve(undefined),
    creationOptions: {},
    exitStatus: undefined,
    sendText: (text: string, addNewLine?: boolean) => {},
    show: (preserveFocus?: boolean) => {},
    hide: () => {},
    dispose: () => {},
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
        const sendTextStub = sandbox.stub(terminalStub, 'sendText');
        const createTerminalStub = sandbox
          .stub(vscode.window, 'createTerminal')
          .returns(terminalStub);
        const stripeClientStub = <any>{getCLIPath: () => {}};
        const getCLIPathStub = sandbox
          .stub(stripeClientStub, 'getCLIPath')
          .returns(Promise.resolve(path));

        const stripeTerminal = new StripeTerminal(stripeClientStub);
        await stripeTerminal.execute('listen', ['--forward-to', 'localhost']);

        assert.strictEqual(getCLIPathStub.callCount, 1);
        assert.strictEqual(createTerminalStub.callCount, 1);
        assert.deepStrictEqual(sendTextStub.args[0], [`${path} listen --forward-to localhost`]);
      });
    });
  });

  suite('with no Stripe CLI installed', () => {
    test('does not run command', async () => {
      const sendTextStub = sandbox.stub(terminalStub, 'sendText');
      const createTerminalStub = sandbox
        .stub(vscode.window, 'createTerminal')
        .returns(terminalStub);
      const stripeClientStub = <any>{getCLIPath: () => {}};
      sandbox.stub(stripeClientStub, 'getCLIPath').returns(null);

      const stripeTerminal = new StripeTerminal(stripeClientStub);
      await stripeTerminal.execute('listen', ['--forward-to', 'localhost']);

      assert.strictEqual(createTerminalStub.callCount, 0);
      assert.deepStrictEqual(sendTextStub.callCount, 0);
    });
  });

  suite('if a Stripe terminal already exists', () => {
    test('reuses terminal if the command is the same', async () => {
      const createTerminalStub = sandbox
        .stub(vscode.window, 'createTerminal')
        .returns(terminalStub);
      const sendTextStub = sandbox.stub(terminalStub, 'sendText');
      const stripeClientStub = <any>{getCLIPath: () => {}};
      sandbox
        .stub(stripeClientStub, 'getCLIPath')
        .returns(Promise.resolve('/usr/local/bin/stripe'));

      const stripeTerminal = new StripeTerminal(stripeClientStub);
      await stripeTerminal.execute('listen', ['--forward-to', 'localhost']);

      // same command => reuse the same terminal
      await stripeTerminal.execute('listen', ['--forward-to', 'localhost']);

      assert.strictEqual(createTerminalStub.callCount, 1);
      assert.deepStrictEqual(sendTextStub.args[0], [
        '/usr/local/bin/stripe listen --forward-to localhost',
      ]);
      assert.deepStrictEqual(sendTextStub.args[1], [
        '/usr/local/bin/stripe listen --forward-to localhost',
      ]);
    });
  });
});
