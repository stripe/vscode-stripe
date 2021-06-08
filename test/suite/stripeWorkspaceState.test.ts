import * as assert from 'assert';
import * as sinon from 'sinon';

import {TestMemento, mocks} from '../mocks/vscode';
import {
  addEventDetails,
  addLogDetails,
  clearEventDetails,
  clearLogDetails,
  connectWebhookEndpointKey,
  eventDetailsKey,
  getCliVersion,
  getConnectWebhookEndpoint,
  getRecentEvents,
  getStripeAccountId,
  getWebhookEndpoint,
  initializeStripeWorkspaceState,
  logDetailsKey,
  recentEventsKey,
  recordEvent,
  retrieveEventDetails,
  retrieveLogDetails,
  setCliVersion,
  setConnectWebhookEndpoint,
  setStripeAccountId,
  setWebhookEndpoint,
  webhookEndpointKey,
} from '../../src/stripeWorkspaceState';

suite('stripeWorkspaceState', () => {
  let sandbox: sinon.SinonSandbox;
  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('initialize sets up all keys', () => {
    const workspaceState = new TestMemento();
    const extensionContext = {...mocks.extensionContextMock, workspaceState: workspaceState};

    initializeStripeWorkspaceState(extensionContext);

    // Verify RecentEvents is present with an empty array
    assert.deepStrictEqual(extensionContext.workspaceState.get(recentEventsKey), []);

    // Verify EventDetails is present with an empy Map
    assert.deepStrictEqual(extensionContext.workspaceState.get(eventDetailsKey), new Map());

    // Verify LogDetails is present with an empy Map
    assert.deepStrictEqual(extensionContext.workspaceState.get(logDetailsKey), new Map());

    // Verify WebhookEndpointKey is not set
    assert.strictEqual(extensionContext.workspaceState.get(webhookEndpointKey), undefined);

    // Verify ConnectWebhookEndpointKey is not set
    assert.strictEqual(extensionContext.workspaceState.get(connectWebhookEndpointKey), undefined);
  });

  suite('RecentEvents', () => {
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

  suite('EventDetails', () => {
    test('add and retrieve event details', () => {
      const workspaceState = new TestMemento();
      const extensionContext = {...mocks.extensionContextMock, workspaceState: workspaceState};

      const eventId = 'event_id';
      const eventObject = {eventId: eventId, value: 'hello'};

      addEventDetails(extensionContext, eventId, eventObject);

      assert.deepStrictEqual(retrieveEventDetails(extensionContext, eventId), eventObject);
    });

    test('clearEventDetails empties EventDetails key', () => {
      const workspaceState = new TestMemento();
      const extensionContext = {...mocks.extensionContextMock, workspaceState: workspaceState};

      // manually populate memento
      const eventDetailsMap = new Map<string, any>();
      eventDetailsMap.set('event_id', {value: 'blah'});
      extensionContext.workspaceState.update(eventDetailsKey, eventDetailsMap);

      clearEventDetails(extensionContext);

      assert.deepStrictEqual(extensionContext.workspaceState.get(eventDetailsKey), new Map());
    });
  });

  suite('LogDetails', () => {
    test('add and retrieve log details', () => {
      const workspaceState = new TestMemento();
      const extensionContext = {...mocks.extensionContextMock, workspaceState: workspaceState};

      const logId = 'log_id';
      const logObject = {logId: logId, value: 'hello'};

      addLogDetails(extensionContext, logId, logObject);

      assert.deepStrictEqual(retrieveLogDetails(extensionContext, logId), logObject);
    });

    test('clearLogDetails empties LogDetails key', () => {
      const workspaceState = new TestMemento();
      const extensionContext = {...mocks.extensionContextMock, workspaceState: workspaceState};

      // manually populate memento
      const logDetailsMap = new Map<string, any>();
      logDetailsMap.set('log_id', {value: 'blah'});
      extensionContext.workspaceState.update(logDetailsKey, logDetailsMap);

      clearLogDetails(extensionContext);

      assert.deepStrictEqual(extensionContext.workspaceState.get(logDetailsKey), new Map());
    });
  });

  suite('WebhookEndpoint', () => {
    test('set and get webhook endpoint', () => {
      const workspaceState = new TestMemento();
      const extensionContext = {...mocks.extensionContextMock, workspaceState: workspaceState};

      const webhookEndpoint = 'http://localhost:4242/my-webhook-endpoint';

      setWebhookEndpoint(extensionContext, webhookEndpoint);

      assert.deepStrictEqual(getWebhookEndpoint(extensionContext), webhookEndpoint);
    });
  });

  suite('ConnectWebhookEndpoint', () => {
    test('set and get Connect webhook endpoint', () => {
      const workspaceState = new TestMemento();
      const extensionContext = {...mocks.extensionContextMock, workspaceState: workspaceState};

      const connectWebhookEndpoint = 'http://localhost:4242/my-connect-webhook-endpoint';

      setConnectWebhookEndpoint(extensionContext, connectWebhookEndpoint);

      assert.deepStrictEqual(getConnectWebhookEndpoint(extensionContext), connectWebhookEndpoint);
    });
  });

  suite('StripeAccountId', () => {
    test('set and get stripe account id', () => {
      const workspaceState = new TestMemento();
      const extensionContext = {...mocks.extensionContextMock, workspaceState: workspaceState};

      const accountId = 'acct_21314';

      setStripeAccountId(extensionContext, accountId);

      assert.deepStrictEqual(getStripeAccountId(extensionContext), accountId);
    });
  });

  suite('CLIVersion', () => {
    test('set and get cli version', () => {
      const workspaceState = new TestMemento();
      const extensionContext = {...mocks.extensionContextMock, workspaceState: workspaceState};

      const version = '21.2';

      setCliVersion(extensionContext, version);

      assert.deepStrictEqual(getCliVersion(extensionContext), version);
    });
  });
});
