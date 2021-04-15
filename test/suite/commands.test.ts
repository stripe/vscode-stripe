import * as assert from 'assert';
import * as sinon from 'sinon';
import * as stripeState from '../../src/stripeWorkspaceState';
import * as vscode from 'vscode';

import {EventEmitter, Readable} from 'stream';
import {Commands} from '../../src/commands';
import {NoOpTelemetry} from '../../src/telemetry';
import {StripeClient} from '../../src/stripeClient';
import childProcess from 'child_process';
import {mocks} from '../mocks/vscode';

suite('commands', () => {
  let sandbox: sinon.SinonSandbox;
  const terminal = <any>{
    execute: (command: any, args: Array<string>) => {},
  };

  const telemetry = new NoOpTelemetry();

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('openTriggerEvent', () => {
    let stripeOutputChannel: Partial<vscode.OutputChannel>;
    let triggerProcess: childProcess.ChildProcess;
    let stripeClient: Partial<StripeClient>;

    setup(() => {
      stripeOutputChannel = {append: (value: string) => {}, show: () => {}};

      triggerProcess = <childProcess.ChildProcess>new EventEmitter();
      triggerProcess.stdout = <Readable>new EventEmitter();

      stripeClient = {getOrCreateCLIProcess: () => Promise.resolve(triggerProcess)};
    });

    test('executes and records event', async () => {
      const extensionContext = {...mocks.extensionContextMock};
      const telemetrySpy = sandbox.spy(telemetry, 'sendEvent');

      const supportedEvents = ['a'];
      const commands = new Commands(telemetry, terminal, extensionContext, supportedEvents);

      commands.openTriggerEvent(extensionContext, <any>stripeClient, <any>stripeOutputChannel);

      // Pick the first item on the list.
      await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');

      const eventsInState = stripeState.getRecentEvents(extensionContext);

      assert.deepStrictEqual(telemetrySpy.args[0], ['openTriggerEvent']);
      assert.deepStrictEqual(eventsInState, ['a']);
    });

    test('writes stripe trigger output to output channel', async () => {
      const extensionContext = {...mocks.extensionContextMock};
      const appendSpy = sinon.spy(stripeOutputChannel, 'append');

      const supportedEvents = ['a'];
      const commands = new Commands(telemetry, terminal, extensionContext, supportedEvents);

      commands.openTriggerEvent(extensionContext, <any>stripeClient, <any>stripeOutputChannel);

      // Pick the first item on the list.
      await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');

      // Simulate output from `stripe trigger <event>`
      triggerProcess.stdout.emit('data', 'some output from stripe trigger');

      assert.deepStrictEqual(appendSpy.args[0], ['some output from stripe trigger']);
    });
  });

  suite('buildTriggerEventsList', () => {
    test('returns all original events when no recent events', () => {
      const extensionContext = {...mocks.extensionContextMock};
      const getEventsStub = sandbox.stub(stripeState, 'getRecentEvents').returns([]);
      const commands = new Commands(telemetry, terminal, extensionContext);
      const supportedEvents = ['a', 'b', 'c', 'd', 'e'];
      const events = commands.buildTriggerEventsList(supportedEvents, extensionContext);

      assert.strictEqual(getEventsStub.calledOnce, true);
      const labels = events.map((x) => x.label);
      assert.deepStrictEqual(labels, supportedEvents);
    });

    test('returns recent events on top', () => {
      const extensionContext = {...mocks.extensionContextMock};
      const getEventsStub = sandbox.stub(stripeState, 'getRecentEvents').returns(['c']);
      const commands = new Commands(telemetry, terminal, extensionContext);

      const supportedEvents = ['a', 'b', 'c', 'd', 'e'];
      const events = commands.buildTriggerEventsList(supportedEvents, extensionContext);

      assert.strictEqual(getEventsStub.calledOnce, true);
      const labels = events.map((x) => x.label);
      assert.deepStrictEqual(labels, ['c', 'a', 'b', 'd', 'e']);
      assert.strictEqual(events[0].description, 'recently triggered');
    });

    test('does not include events that are not supported', () => {
      const extensionContext = {...mocks.extensionContextMock};
      const getEventsStub = sandbox
        .stub(stripeState, 'getRecentEvents')
        .returns(['c', 'unsupported']);
      const commands = new Commands(telemetry, terminal, extensionContext);

      const supportedEvents = ['a', 'b', 'c', 'd', 'e'];
      const events = commands.buildTriggerEventsList(supportedEvents, extensionContext);
      assert.strictEqual(getEventsStub.calledOnce, true);
      const labels = events.map((x) => x.label);
      assert.deepStrictEqual(labels, ['c', 'a', 'b', 'd', 'e']);
      assert.strictEqual(events[0].description, 'recently triggered');
    });
  });
});
