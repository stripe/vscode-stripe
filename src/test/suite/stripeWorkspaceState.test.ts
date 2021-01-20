import * as assert from 'assert';
import * as sinon from 'sinon';

import {TestMemento, mocks} from '../mocks/vscode';
import {getRecentEvents, recentEventsKey, recordEvent} from '../../stripeWorkspaceState';


suite('RecentEvents', () => {
  let sandbox: sinon.SinonSandbox;
  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('getRecentEvents returns all events when limit is undefined', () => {
    const workspaceState = new TestMemento();
    const extensionContext = {...mocks.extensionContextMock, workspaceState: workspaceState};

    const eventsList = ['a', 'b', 'c', 'd', 'e'];
    workspaceState.update(recentEventsKey, eventsList);

    const recentEvents = getRecentEvents(extensionContext);

    assert.deepStrictEqual(recentEvents, eventsList);
  });

  test('getRecentEvents returns subset of events when limit is set', () => {
    const workspaceState = new TestMemento();
    const extensionContext = {...mocks.extensionContextMock, workspaceState: workspaceState};

    const eventsList = ['a', 'b', 'c', 'd', 'e'];
    workspaceState.update(recentEventsKey, eventsList);

    const recentEvents = getRecentEvents(extensionContext, 2);

    assert.deepStrictEqual(recentEvents, ['a', 'b']);
  });

  test('recordEvent adds event on top', () => {
    const workspaceState = new TestMemento();
    const extensionContext = {...mocks.extensionContextMock, workspaceState: workspaceState};

    recordEvent(extensionContext, 'a');
    recordEvent(extensionContext, 'b');
    recordEvent(extensionContext, 'c');

    const recentEvents = getRecentEvents(extensionContext);

    assert.deepStrictEqual(recentEvents, ['c', 'b', 'a']);
  });

});
