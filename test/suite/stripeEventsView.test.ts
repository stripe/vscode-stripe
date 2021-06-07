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
import {StripeTreeItem} from '../../src/stripeTreeItem';

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

  let stripeTreeItemConstructorStub: sinon.SinonStub;

  setup(() => {
    sandbox = sinon.createSandbox();

    listenStream = <grpc.ClientReadableStream<ListenResponse>>new EventEmitter();
    listenStream.cancel = () => {};
    listenStream.destroy = () => {};

    daemonClient = {
      listen: () => listenStream,
    };

    // Mock tree item constructor
    stripeTreeItemConstructorStub = sandbox.stub();
    Object.setPrototypeOf(StripeTreeItem, stripeTreeItemConstructorStub);
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('startStreaming', () => {
    setup(() => {
      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient);
    });

    test('renders loading state', async () => {
      const stripeEventsView = new StripeEventsViewProvider(
        <any>stripeClient,
        <any>stripeDaemon,
        extensionContext,
      );
      await stripeEventsView.startStreaming();

      // Mock loading response
      const response = new ListenResponse();
      response.setState(ListenResponse.State.STATE_LOADING);

      listenStream.emit('data', response);

      await stripeEventsView.buildTree(); // Simulate view refresh

      assert.strictEqual(stripeTreeItemConstructorStub.args[0][0], 'Starting streaming events ...');
    });

    test('renders ready state', async () => {
      const stripeEventsView = new StripeEventsViewProvider(
        <any>stripeClient,
        <any>stripeDaemon,
        extensionContext,
      );
      await stripeEventsView.startStreaming();

      // Mock loading response
      const response = new ListenResponse();
      response.setState(ListenResponse.State.STATE_READY);

      listenStream.emit('data', response);

      await stripeEventsView.buildTree(); // Simulate view refresh

      assert.strictEqual(stripeTreeItemConstructorStub.args[0][0], 'Stop streaming events');
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

      assert.strictEqual(stripeTreeItemConstructorStub.args[0][0], 'customer.created');
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

      await stripeEventsView.buildTree();

      assert.strictEqual(stripeTreeItemConstructorStub.args[0][0], 'Start streaming events');
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
