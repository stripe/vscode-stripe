import * as assert from 'assert';
import * as grpc from '@grpc/grpc-js';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import {TestMemento, mocks} from '../mocks/vscode';
import {EventEmitter} from 'stream';
import {LogsTailResponse} from '../../src/rpc/logs_tail_pb';
import {NoDaemonCommandError} from '../../src/daemon/types';
import {StripeCLIClient} from '../../src/rpc/commands_grpc_pb';
import {StripeClient} from '../../src/stripeClient';
import {StripeDaemon} from '../../src/daemon/stripeDaemon';
import {StripeLogsViewProvider} from '../../src/stripeLogsView';

suite('stripeLogsView', () => {
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

  let logsTailStream: grpc.ClientReadableStream<LogsTailResponse>;
  let daemonClient: Partial<StripeCLIClient>;

  setup(() => {
    sandbox = sinon.createSandbox();

    logsTailStream = <grpc.ClientReadableStream<LogsTailResponse>>new EventEmitter();
    logsTailStream.cancel = () => {};
    logsTailStream.destroy = () => {};

    daemonClient = {
      logsTail: () => logsTailStream,
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
        const stripeLogsView = new StripeLogsViewProvider(
          <any>stripeClient,
          <any>stripeDaemon,
          extensionContext,
        );
        await stripeLogsView.startStreaming();

        // Make sure we start in the idle state
        const doneResponse = new LogsTailResponse();
        doneResponse.setState(LogsTailResponse.State.STATE_DONE);
        logsTailStream.emit('data', doneResponse);

        const loadingResponse = new LogsTailResponse();
        loadingResponse.setState(LogsTailResponse.State.STATE_LOADING);

        logsTailStream.emit('data', loadingResponse);

        const treeItems = await stripeLogsView.buildTree(); // Simulate view refresh

        const labels = treeItems.map(({label}) => label);
        const expectedLabel = 'Starting streaming API logs ...';
        assert.strictEqual(
          labels.includes(expectedLabel),
          true,
          `Expected [${labels.toString()}] to contain ${expectedLabel}`,
        );
      });

      test('renders loading state when stream is RECONNECTING', async () => {
        const stripeLogsView = new StripeLogsViewProvider(
          <any>stripeClient,
          <any>stripeDaemon,
          extensionContext,
        );
        await stripeLogsView.startStreaming();

        // Make sure we start in the idle state
        const doneResponse = new LogsTailResponse();
        doneResponse.setState(LogsTailResponse.State.STATE_DONE);
        logsTailStream.emit('data', doneResponse);

        const reconnectingResponse = new LogsTailResponse();
        reconnectingResponse.setState(LogsTailResponse.State.STATE_RECONNECTING);

        logsTailStream.emit('data', reconnectingResponse);

        const treeItems = await stripeLogsView.buildTree(); // Simulate view refresh

        const labels = treeItems.map(({label}) => label);
        const expectedLabel = 'Starting streaming API logs ...';
        assert.strictEqual(
          labels.includes(expectedLabel),
          true,
          `Expected [${labels.toString()}] to contain ${expectedLabel}`,
        );
      });

      test('renders ready state when stream is READY', async () => {
        const stripeLogsView = new StripeLogsViewProvider(
          <any>stripeClient,
          <any>stripeDaemon,
          extensionContext,
        );
        await stripeLogsView.startStreaming();

        // Make sure we start in the streaming state
        const doneResponse = new LogsTailResponse();
        doneResponse.setState(LogsTailResponse.State.STATE_DONE);
        logsTailStream.emit('data', doneResponse);

        const readyResponse = new LogsTailResponse();
        readyResponse.setState(LogsTailResponse.State.STATE_READY);

        logsTailStream.emit('data', readyResponse);

        const treeItems = await stripeLogsView.buildTree(); // Simulate view refresh

        const labels = treeItems.map(({label}) => label);
        const expectedLabel = 'Stop streaming API logs';
        assert.strictEqual(
          labels.includes(expectedLabel),
          true,
          `Expected [${labels.toString()}] to contain ${expectedLabel}`,
        );
      });

      test('renders idle state when stream is DONE', async () => {
        const stripeLogsView = new StripeLogsViewProvider(
          <any>stripeClient,
          <any>stripeDaemon,
          extensionContext,
        );
        await stripeLogsView.startStreaming();

        // Make sure we start in the streaming state
        const readyResponse = new LogsTailResponse();
        readyResponse.setState(LogsTailResponse.State.STATE_READY);
        logsTailStream.emit('data', readyResponse);

        const doneResponse = new LogsTailResponse();
        doneResponse.setState(LogsTailResponse.State.STATE_DONE);

        logsTailStream.emit('data', doneResponse);

        const treeItems = await stripeLogsView.buildTree(); // Simulate view refresh

        const labels = treeItems.map(({label}) => label);
        const expectedLabel = 'Start streaming API logs';
        assert.strictEqual(
          labels.includes(expectedLabel),
          true,
          `Expected [${labels.toString()}] to contain ${expectedLabel}`,
        );
      });

      test('renders idle state when stream is receives unknown state', async () => {
        const stripeLogsView = new StripeLogsViewProvider(
          <any>stripeClient,
          <any>stripeDaemon,
          extensionContext,
        );
        await stripeLogsView.startStreaming();

        // Make sure we start in the ready state
        const readyResponse = new LogsTailResponse();
        readyResponse.setState(LogsTailResponse.State.STATE_READY);
        logsTailStream.emit('data', readyResponse);

        const unknownStateResponse = new LogsTailResponse();
        unknownStateResponse.setState(<any>-1); // This should be impossible

        logsTailStream.emit('data', unknownStateResponse);

        const treeItems = await stripeLogsView.buildTree(); // Simulate view refresh

        const labels = treeItems.map(({label}) => label);
        const expectedLabel = 'Start streaming API logs';
        assert.strictEqual(
          labels.includes(expectedLabel),
          true,
          `Expected [${labels.toString()}] to contain ${expectedLabel}`,
        );
      });
    });

    test('creates tree items from stream', async () => {
      const stripeLogsView = new StripeLogsViewProvider(
        <any>stripeClient,
        <any>stripeDaemon,
        extensionContext,
      );
      await stripeLogsView.startStreaming();

      // Mock ready response
      const readyResponse = new LogsTailResponse();
      readyResponse.setState(LogsTailResponse.State.STATE_READY);

      logsTailStream.emit('data', readyResponse);

      // Mock log response
      const log = new LogsTailResponse.Log();
      log.setStatus(200);
      log.setMethod('POST');
      log.setUrl('/v1/customers');
      log.setRequestId('req_123');
      log.setCreatedAt(12345);

      const response = new LogsTailResponse();
      response.setLog(log);

      logsTailStream.emit('data', response);

      const treeItems = await stripeLogsView.buildTree(); // Simulate view refresh

      const recentLogs = treeItems.find(({label}) => label === 'Recent logs');
      const labels = recentLogs?.children?.map(({label}) => label);
      const expectedLabel = '[200] POST /v1/customers [req_123]';
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
      const stripeLogsView = new StripeLogsViewProvider(
        <any>stripeClient,
        <any>stripeDaemon,
        extensionContext,
      );
      await stripeLogsView.startStreaming();

      const readyResponse = new LogsTailResponse();
      readyResponse.setState(LogsTailResponse.State.STATE_READY);

      logsTailStream.emit('data', readyResponse);

      stripeLogsView.stopStreaming();

      const treeItems = await stripeLogsView.buildTree(); // Simulate view refresh

      const labels = treeItems.map(({label}) => label);
      const expectedLabel = 'Start streaming API logs';
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

      const stripeLogsView = new StripeLogsViewProvider(
        <any>stripeClient,
        <any>stripeDaemon,
        extensionContext,
      );

      await stripeLogsView.startStreaming();

      assert.strictEqual(promptUpdateForDaemonSpy.calledOnce, true);
    });

    test('shows gRPC error message', async () => {
      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient);

      const showErrorMessageSpy = sandbox.spy(vscode.window, 'showErrorMessage');

      const stripeLogsView = new StripeLogsViewProvider(
        <any>stripeClient,
        <any>stripeDaemon,
        extensionContext,
      );

      await stripeLogsView.startStreaming();

      logsTailStream.emit('error', <Partial<grpc.ServiceError>>{
        code: grpc.status.UNKNOWN,
        details: 'unknown error',
      });

      assert.strictEqual(showErrorMessageSpy.callCount, 1);

      assert.strictEqual(showErrorMessageSpy.args[0][0], 'unknown error');
    });

    test('prompts login when UNAUTHENTICATED', async () => {
      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient);

      const promptLoginSpy = sandbox.spy(stripeClient, 'promptLogin');

      const stripeLogsView = new StripeLogsViewProvider(
        <any>stripeClient,
        <any>stripeDaemon,
        extensionContext,
      );

      await stripeLogsView.startStreaming();

      logsTailStream.emit('error', <Partial<grpc.ServiceError>>{code: grpc.status.UNAUTHENTICATED});

      assert.strictEqual(promptLoginSpy.callCount, 1);
    });

    test('silently handle CANCELLED error', async () => {
      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient);

      const showErrorMessageSpy = sandbox.spy(vscode.window, 'showErrorMessage');

      const stripeLogsView = new StripeLogsViewProvider(
        <any>stripeClient,
        <any>stripeDaemon,
        extensionContext,
      );

      await stripeLogsView.startStreaming();

      logsTailStream.emit('error', <Partial<grpc.ServiceError>>{code: grpc.status.CANCELLED});

      assert.strictEqual(showErrorMessageSpy.callCount, 0);
    });
  });
});
