import * as assert from 'assert';
import * as grpc from '@grpc/grpc-js';
import * as vscode from 'vscode';
import Sinon, * as sinon from 'sinon';
import {EventEmitter} from 'stream';
import {LogsTailResponse} from '../../src/rpc/logs_tail_pb';
import {NoDaemonCommandError} from '../../src/daemon/types';
import {StripeCLIClient} from '../../src/rpc/commands_grpc_pb';
import {StripeClient} from '../../src/stripeClient';
import {StripeDaemon} from '../../src/daemon/stripeDaemon';
import {StripeLogsViewProvider} from '../../src/stripeLogsView';
import {StripeTreeItem} from '../../src/stripeTreeItem';

suite('stripeLogsView', () => {
  let sandbox: sinon.SinonSandbox;

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

  let stripeTreeItemConstructorStub: Sinon.SinonStub;

  setup(() => {
    sandbox = sinon.createSandbox();

    logsTailStream = <grpc.ClientReadableStream<LogsTailResponse>>new EventEmitter();
    logsTailStream.cancel = () => {};
    logsTailStream.destroy = () => {};

    daemonClient = {
      logsTail: () => logsTailStream,
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
      const stripeLogsView = new StripeLogsViewProvider(<any>stripeClient, <any>stripeDaemon);
      await stripeLogsView.startStreaming();

      // Mock loading response
      const response = new LogsTailResponse();
      response.setState(LogsTailResponse.State.STATE_LOADING);

      logsTailStream.emit('data', response);

      await stripeLogsView.buildTree(); // Simulate view refresh

      assert.strictEqual(
        stripeTreeItemConstructorStub.args[0][0],
        'Starting streaming API logs ...',
      );
    });

    test('renders ready state', async () => {
      const stripeLogsView = new StripeLogsViewProvider(<any>stripeClient, <any>stripeDaemon);
      await stripeLogsView.startStreaming();

      // Mock loading response
      const response = new LogsTailResponse();
      response.setState(LogsTailResponse.State.STATE_READY);

      logsTailStream.emit('data', response);

      await stripeLogsView.buildTree(); // Simulate view refresh

      assert.strictEqual(stripeTreeItemConstructorStub.args[0][0], 'Stop streaming API logs');
    });

    test('creates tree items from stream', async () => {
      const stripeLogsView = new StripeLogsViewProvider(<any>stripeClient, <any>stripeDaemon);
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

      assert.strictEqual(
        stripeTreeItemConstructorStub.args[0][0],
        '[200] POST /v1/customers [req_123]',
      );
    });
  });

  suite('stopStreaming', () => {
    setup(() => {
      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient);
    });

    test('stops streaming', async () => {
      // Simulate a stream in progress
      const stripeLogsView = new StripeLogsViewProvider(<any>stripeClient, <any>stripeDaemon);
      await stripeLogsView.startStreaming();

      const readyResponse = new LogsTailResponse();
      readyResponse.setState(LogsTailResponse.State.STATE_READY);

      logsTailStream.emit('data', readyResponse);

      stripeLogsView.stopStreaming();

      await stripeLogsView.buildTree();

      assert.strictEqual(stripeTreeItemConstructorStub.args[0][0], 'Start streaming API logs');
    });
  });

  suite('error', () => {
    test('prompts upgrade when no daemon command', async () => {
      sandbox.stub(stripeDaemon, 'setupClient').throws(new NoDaemonCommandError());

      const promptUpdateForDaemonSpy = sandbox.spy(stripeClient, 'promptUpdateForDaemon');

      const stripeLogsView = new StripeLogsViewProvider(<any>stripeClient, <any>stripeDaemon);

      await stripeLogsView.startStreaming();

      assert.strictEqual(promptUpdateForDaemonSpy.calledOnce, true);
    });

    test('shows gRPC error message', async () => {
      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient);

      const showErrorMessageSpy = sandbox.spy(vscode.window, 'showErrorMessage');

      const stripeLogsView = new StripeLogsViewProvider(<any>stripeClient, <any>stripeDaemon);

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

      const stripeLogsView = new StripeLogsViewProvider(<any>stripeClient, <any>stripeDaemon);

      await stripeLogsView.startStreaming();

      logsTailStream.emit('error', <Partial<grpc.ServiceError>>{code: grpc.status.UNAUTHENTICATED});

      assert.strictEqual(promptLoginSpy.callCount, 1);
    });

    test('silently handle CANCELLED error', async () => {
      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient);

      const showErrorMessageSpy = sandbox.spy(vscode.window, 'showErrorMessage');

      const stripeLogsView = new StripeLogsViewProvider(<any>stripeClient, <any>stripeDaemon);

      await stripeLogsView.startStreaming();

      logsTailStream.emit('error', <Partial<grpc.ServiceError>>{code: grpc.status.CANCELLED});

      assert.strictEqual(showErrorMessageSpy.callCount, 0);
    });
  });
});
