import * as assert from 'assert';
import * as grpc from '@grpc/grpc-js';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import {TestMemento, mocks} from '../mocks/vscode';
import {EventEmitter} from 'stream';
import {ListenResponse} from '../../src/rpc/listen_pb';
import {NoDaemonCommandError} from '../../src/daemon/types';
import {StripeCLIClient} from '../../src/rpc/commands_grpc_pb';
import {StripeClient} from '../../src/stripeClient';
import {StripeDaemon} from '../../src/daemon/stripeDaemon';
import {StripeEvent} from '../../src/rpc/common_pb';
import {StripeEventsViewProvider} from '../../src/stripeEventsView';

suite('stripeEventsView', () => {
  let sandbox: sinon.SinonSandbox;

  const workspaceState = new TestMemento();
  const extensionContext = {...mocks.extensionContextMock, workspaceState: workspaceState};

  const stripeClient = <Partial<StripeClient>>{
    getCLIPath: () => Promise.resolve('/path/to/cli'),
    promptUpdateForDaemon: () => {},
    promptLogin: () => {},
  };

  const stripeDaemon = <Partial<StripeDaemon>>{
    setupClient: () => {},
  };

  let listenStream: grpc.ClientReadableStream<ListenResponse>;
  let daemonClient: Partial<StripeCLIClient>;

  setup(() => {
    sandbox = sinon.createSandbox();

    listenStream = <grpc.ClientReadableStream<ListenResponse>>new EventEmitter();
    listenStream.cancel = () => {};
    listenStream.destroy = () => {};

    daemonClient = {
      listen: () => listenStream,
    };
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('startStreaming', () => {
    setup(() => {
      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient);
    });

    suite('state transitions', () => {
      test('renders loading state when stream is LOADING', async () => {
        const stripeEventsView = new StripeEventsViewProvider(
          <any>stripeClient,
          <any>stripeDaemon,
          extensionContext,
        );
        await stripeEventsView.startStreaming();

        // Make sure we start in the idle state
        const doneResponse = new ListenResponse();
        doneResponse.setState(ListenResponse.State.STATE_DONE);
        listenStream.emit('data', doneResponse);

        const loadingResponse = new ListenResponse();
        loadingResponse.setState(ListenResponse.State.STATE_LOADING);

        listenStream.emit('data', loadingResponse);

        const treeItems = await stripeEventsView.buildTree(); // Simulate view refresh

        const labels = treeItems.map(({label}) => label);
        const expectedLabel = 'Starting streaming events ...';
        assert.strictEqual(
          labels.includes(expectedLabel),
          true,
          `Expected [${labels.toString()}] to contain ${expectedLabel}`,
        );
      });

      test('renders loading state when stream is RECONNECTING', async () => {
        const stripeEventsView = new StripeEventsViewProvider(
          <any>stripeClient,
          <any>stripeDaemon,
          extensionContext,
        );
        await stripeEventsView.startStreaming();

        // Make sure we start in the idle state
        const doneResponse = new ListenResponse();
        doneResponse.setState(ListenResponse.State.STATE_DONE);
        listenStream.emit('data', doneResponse);

        const reconnectingResponse = new ListenResponse();
        reconnectingResponse.setState(ListenResponse.State.STATE_RECONNECTING);

        listenStream.emit('data', reconnectingResponse);

        const treeItems = await stripeEventsView.buildTree(); // Simulate view refresh

        const labels = treeItems.map(({label}) => label);
        const expectedLabel = 'Starting streaming events ...';
        assert.strictEqual(
          labels.includes(expectedLabel),
          true,
          `Expected [${labels.toString()}] to contain ${expectedLabel}`,
        );
      });

      test('renders ready state when stream is READY', async () => {
        const stripeEventsView = new StripeEventsViewProvider(
          <any>stripeClient,
          <any>stripeDaemon,
          extensionContext,
        );
        await stripeEventsView.startStreaming();

        // Make sure we start in the streaming state
        const doneResponse = new ListenResponse();
        doneResponse.setState(ListenResponse.State.STATE_DONE);
        listenStream.emit('data', doneResponse);

        const readyResponse = new ListenResponse();
        readyResponse.setState(ListenResponse.State.STATE_READY);

        listenStream.emit('data', readyResponse);

        const treeItems = await stripeEventsView.buildTree(); // Simulate view refresh

        const labels = treeItems.map(({label}) => label);
        const expectedLabel = 'Stop streaming events';
        assert.strictEqual(
          labels.includes(expectedLabel),
          true,
          `Expected [${labels.toString()}] to contain ${expectedLabel}`,
        );
      });

      test('renders idle state when stream is DONE', async () => {
        const stripeEventsView = new StripeEventsViewProvider(
          <any>stripeClient,
          <any>stripeDaemon,
          extensionContext,
        );
        await stripeEventsView.startStreaming();

        // Make sure we start in the streaming state
        const readyResponse = new ListenResponse();
        readyResponse.setState(ListenResponse.State.STATE_READY);
        listenStream.emit('data', readyResponse);

        const doneResponse = new ListenResponse();
        doneResponse.setState(ListenResponse.State.STATE_DONE);

        listenStream.emit('data', doneResponse);

        const treeItems = await stripeEventsView.buildTree(); // Simulate view refresh

        const labels = treeItems.map(({label}) => label);
        const expectedLabel = 'Start streaming events';
        assert.strictEqual(
          labels.includes(expectedLabel),
          true,
          `Expected [${labels.toString()}] to contain ${expectedLabel}`,
        );
      });

      test('renders idle state when stream is receives unknown state', async () => {
        const stripeEventsView = new StripeEventsViewProvider(
          <any>stripeClient,
          <any>stripeDaemon,
          extensionContext,
        );
        await stripeEventsView.startStreaming();

        // Make sure we start in the ready state
        const readyResponse = new ListenResponse();
        readyResponse.setState(ListenResponse.State.STATE_READY);
        listenStream.emit('data', readyResponse);

        const unknownStateResponse = new ListenResponse();
        unknownStateResponse.setState(<any>-1); // This should be impossible

        listenStream.emit('data', unknownStateResponse);

        const treeItems = await stripeEventsView.buildTree(); // Simulate view refresh

        const labels = treeItems.map(({label}) => label);
        const expectedLabel = 'Start streaming events';
        assert.strictEqual(
          labels.includes(expectedLabel),
          true,
          `Expected [${labels.toString()}] to contain ${expectedLabel}`,
        );
      });
    });

    test('creates tree items from stream', async () => {
      const stripeEventsView = new StripeEventsViewProvider(
        <any>stripeClient,
        <any>stripeDaemon,
        extensionContext,
      );
      await stripeEventsView.startStreaming();

      // Mock ready response
      const readyResponse = new ListenResponse();
      readyResponse.setState(ListenResponse.State.STATE_READY);

      listenStream.emit('data', readyResponse);

      // Mock event response
      const stripeEvent = new StripeEvent();
      stripeEvent.setType('customer.created');
      stripeEvent.setId('evt_123');

      const response = new ListenResponse();
      response.setStripeEvent(stripeEvent);

      listenStream.emit('data', response);

      const treeItems = await stripeEventsView.buildTree(); // Simulate view refresh

      const recentEvents = treeItems.find(({label}) => label === 'Recent events');
      const labels = recentEvents?.children?.map(({label}) => label);
      const expectedLabel = 'customer.created';
      assert.strictEqual(
        labels?.includes(expectedLabel),
        true,
        `Expected [${labels?.toString()}] to contain ${expectedLabel}`,
      );
    });
  });

  suite('stopStreaming', () => {
    setup(() => {
      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient);
    });

    test('stops streaming', async () => {
      // Simulate a stream in progress
      const stripeEventsView = new StripeEventsViewProvider(
        <any>stripeClient,
        <any>stripeDaemon,
        extensionContext,
      );
      await stripeEventsView.startStreaming();

      const readyResponse = new ListenResponse();
      readyResponse.setState(ListenResponse.State.STATE_READY);

      listenStream.emit('data', readyResponse);

      stripeEventsView.stopStreaming();

      const treeItems = await stripeEventsView.buildTree(); // Simulate view refresh

      const labels = treeItems.map(({label}) => label);
      const expectedLabel = 'Start streaming events';
      assert.strictEqual(
        labels.includes(expectedLabel),
        true,
        `Expected [${labels.toString()}] to contain ${expectedLabel}`,
      );
    });
  });

  suite('error', () => {
    test('prompts upgrade when no daemon command', async () => {
      sandbox.stub(stripeDaemon, 'setupClient').throws(new NoDaemonCommandError());

      const promptUpdateForDaemonSpy = sandbox.spy(stripeClient, 'promptUpdateForDaemon');

      const stripeEventsView = new StripeEventsViewProvider(
        <any>stripeClient,
        <any>stripeDaemon,
        extensionContext,
      );

      await stripeEventsView.startStreaming();

      assert.strictEqual(promptUpdateForDaemonSpy.calledOnce, true);
    });

    test('shows gRPC error message', async () => {
      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient);

      const showErrorMessageSpy = sandbox.spy(vscode.window, 'showErrorMessage');

      const stripeEventsView = new StripeEventsViewProvider(
        <any>stripeClient,
        <any>stripeDaemon,
        extensionContext,
      );

      await stripeEventsView.startStreaming();

      listenStream.emit('error', <Partial<grpc.ServiceError>>{
        code: grpc.status.UNKNOWN,
        details: 'unknown error',
      });

      assert.strictEqual(showErrorMessageSpy.callCount, 1);

      assert.strictEqual(showErrorMessageSpy.args[0][0], 'unknown error');
    });

    test('prompts login when UNAUTHENTICATED', async () => {
      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient);

      const promptLoginSpy = sandbox.spy(stripeClient, 'promptLogin');

      const stripeEventsView = new StripeEventsViewProvider(
        <any>stripeClient,
        <any>stripeDaemon,
        extensionContext,
      );

      await stripeEventsView.startStreaming();

      listenStream.emit('error', <Partial<grpc.ServiceError>>{code: grpc.status.UNAUTHENTICATED});

      assert.strictEqual(promptLoginSpy.callCount, 1);
    });

    test('silently handle CANCELLED error', async () => {
      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient);

      const showErrorMessageSpy = sandbox.spy(vscode.window, 'showErrorMessage');

      const stripeEventsView = new StripeEventsViewProvider(
        <any>stripeClient,
        <any>stripeDaemon,
        extensionContext,
      );

      await stripeEventsView.startStreaming();

      listenStream.emit('error', <Partial<grpc.ServiceError>>{code: grpc.status.CANCELLED});

      assert.strictEqual(showErrorMessageSpy.callCount, 0);
    });
  });
});
