import * as assert from 'assert';
import * as sinon from 'sinon';
import * as stripeState from '../../stripeWorkspaceState';
import * as vscode from 'vscode';

import {Commands} from '../../commands';
import {NoOpTelemetry} from '../../telemetry';
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
    test('executes and records event', async () => {
      const extensionContext = {...mocks.extensionContextMock};
      const terminalSpy = sandbox.spy(terminal, 'execute');
      const telemetrySpy = sandbox.spy(telemetry, 'sendEvent');

      const supportedEvents = ['a'];

      const commands = new Commands(telemetry, terminal, supportedEvents);
      commands.openTriggerEvent(extensionContext);
      // Pick the first item on the list.
      await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');
      const eventsInState = stripeState.getRecentEvents(extensionContext);

      assert.deepStrictEqual(terminalSpy.args[0], ['trigger', ['a']]);
      assert.deepStrictEqual(telemetrySpy.args[0], ['openTriggerEvent']);
      assert.deepStrictEqual(eventsInState, ['a']);
    });
  });

  suite('buildTriggerEventsList', () => {
    test('returns all original events when no recent events', () => {
      const extensionContext = {...mocks.extensionContextMock};
      const getEventsStub = sandbox.stub(stripeState, 'getRecentEvents').returns([]);
      const commands = new Commands(telemetry, terminal);
      const supportedEvents = ['a', 'b', 'c', 'd', 'e'];
      const events = commands.buildTriggerEventsList(supportedEvents, extensionContext);

      assert.strictEqual(getEventsStub.calledOnce, true);
      const labels = events.map((x) => x.label);
      assert.deepStrictEqual(labels, supportedEvents);
    });

    test('returns recent events on top', () => {
      const extensionContext = {...mocks.extensionContextMock};
      const getEventsStub = sandbox.stub(stripeState, 'getRecentEvents').returns(['c']);
      const commands = new Commands(telemetry, terminal);

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
      const commands = new Commands(telemetry, terminal);

      const supportedEvents = ['a', 'b', 'c', 'd', 'e'];
      const events = commands.buildTriggerEventsList(supportedEvents, extensionContext);
      assert.strictEqual(getEventsStub.calledOnce, true);
      const labels = events.map((x) => x.label);
      assert.deepStrictEqual(labels, ['c', 'a', 'b', 'd', 'e']);
      assert.strictEqual(events[0].description, 'recently triggered');
    });
  });
});
