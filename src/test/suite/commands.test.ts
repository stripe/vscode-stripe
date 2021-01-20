import * as assert from 'assert';
import * as commands from '../../commands';
import * as sinon from 'sinon';
import * as stripeState from '../../stripeWorkspaceState';
import {mocks} from '../mocks/vscode';

suite('commands', () => {
  let sandbox: sinon.SinonSandbox;
  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('buildTriggerEventsList',() => {
    test('returns all original events when no recent events', () => {
      const extensionContext = {...mocks.extensionContextMock};
      const getEventsStub = sandbox.stub(stripeState, 'getRecentEvents').returns([]);

      const supportedEvents = ['a', 'b', 'c', 'd', 'e'];
      const events = commands.buildTriggerEventsList(supportedEvents, extensionContext);

      assert.strictEqual(getEventsStub.calledOnce, true);
      const labels = events.map((x) => x.label);
      assert.deepStrictEqual(labels, supportedEvents);
    });

    test('returns recent events on top', () => {
      const extensionContext = {...mocks.extensionContextMock};
      const getEventsStub = sandbox.stub(stripeState, 'getRecentEvents').returns(['c']);

      const supportedEvents = ['a', 'b', 'c', 'd', 'e'];
      const events = commands.buildTriggerEventsList(supportedEvents, extensionContext);

      assert.strictEqual(getEventsStub.calledOnce, true);
      const labels = events.map((x) => x.label);
      assert.deepStrictEqual(labels, ['c', 'a', 'b', 'd', 'e']);
      assert.strictEqual(events[0].description, 'recently triggered');
    });

    test('does not include events that are not supported', () => {
      const extensionContext = {...mocks.extensionContextMock};
      const getEventsStub = sandbox.stub(stripeState, 'getRecentEvents').returns(['c', 'unsupported']);

      const supportedEvents = ['a', 'b', 'c', 'd', 'e'];
      const events = commands.buildTriggerEventsList(supportedEvents, extensionContext);
      assert.strictEqual(getEventsStub.calledOnce, true);
      const labels = events.map((x) => x.label);
      assert.deepStrictEqual(labels, ['c', 'a', 'b', 'd', 'e']);
      assert.strictEqual(events[0].description, 'recently triggered');

    });
  });
});
