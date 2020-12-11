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

  test('sends long-running command to a user-created Stripe terminal', async () => {
    // The user created a terminal and ran `stripe listen` manually.
    const sendTextStub = sandbox.stub(terminalStub, 'sendText');
    sandbox.stub(vscode.window, 'terminals').value([terminalStub]);
    sandbox.stub(StripeTerminal.prototype, <any>'getRunningCommand').returns('stripe listen');

    const createTerminalStub = sandbox.stub(vscode.window, 'createTerminal');

    // The user invokes "Start webhooks listening" from the extension.
    const stripeTerminal = new StripeTerminal();
    await stripeTerminal.execute('listen');

    assert.strictEqual(createTerminalStub.callCount, 0);
    assert.strictEqual(sendTextStub.getCalls()[0].args[0], 'stripe listen');
  });

  test('splits off of a user-created Stripe terminal', async () => {
    // The user created a terminal and ran `stripe listen` manually.
    const usersSendTextStub = sandbox.stub(terminalStub, 'sendText');
    sandbox.stub(vscode.window, 'terminals').value([terminalStub]);
    sandbox.stub(StripeTerminal.prototype, <any>'getRunningCommand').returns('stripe listen');

    const newTerminalStub = {
      ...terminalStub,
      sendText: (text: string, addNewLine?: boolean) => {},
    };
    const createNewSplitTerminalStub = sandbox
      .stub(StripeTerminal.prototype, <any>'createNewSplitTerminal')
      .returns(newTerminalStub);
    const newSendTextStub = sandbox.stub(newTerminalStub, 'sendText');

    const createTerminalStub = sandbox.stub(vscode.window, 'createTerminal');

    // The user invokes "Start API logs streaming" from the extension.
    const stripeTerminal = new StripeTerminal();
    await stripeTerminal.execute('logs', ['tail']);

    assert.strictEqual(createTerminalStub.callCount, 0);
    assert.strictEqual(usersSendTextStub.callCount, 0);
    assert.strictEqual(createNewSplitTerminalStub.callCount, 1);
    assert.strictEqual(newSendTextStub.getCalls()[0].args[0], 'stripe logs tail');
  });
});
