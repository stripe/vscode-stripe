import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import {StripeTerminal} from '../../stripeTerminal';

suite('stripeTerminal', function() {
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

  test('sends command to a new terminal if no terminals exist', async () => {
    const sendTextStub = sandbox.stub(terminalStub, 'sendText');
    const createTerminalStub = sandbox.stub(vscode.window, 'createTerminal').returns(terminalStub);

    const stripeTerminal = new StripeTerminal();
    await stripeTerminal.execute('listen', ['--foward-to', 'localhost']);

    assert.strictEqual(createTerminalStub.callCount, 1);
    assert.strictEqual(sendTextStub.getCalls()[0].args[0], 'stripe listen --foward-to localhost');
  });
});
