import * as assert from 'assert';
import * as grpc from '@grpc/grpc-js';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import {SampleConfigsRequest, SampleConfigsResponse} from '../../src/rpc/sample_configs_pb';
import {SampleCreateRequest, SampleCreateResponse} from '../../src/rpc/sample_create_pb';
import {SamplesListRequest, SamplesListResponse} from '../../src/rpc/samples_list_pb';
import {NoDaemonCommandError} from '../../src/daemon/types';
import {StripeCLIClient} from '../../src/rpc/commands_grpc_pb';
import {StripeClient} from '../../src/stripeClient';
import {StripeDaemon} from '../../src/daemon/stripeDaemon';
import {StripeSamples} from '../../src/stripeSamples';
import {sleep} from './helpers';

suite('StripeSamples', function () {
  this.timeout(20000);

  let sandbox: sinon.SinonSandbox;

  const stripeClient = <Partial<StripeClient>>{
    getCLIPath: () => Promise.resolve('/path/to/cli'),
    promptUpdateForDaemon: () => {},
    promptLogin: () => {},
  };

  const daemonClient = <Partial<StripeCLIClient>>{
    samplesList: (
      req: SamplesListRequest,
      callback: (error: grpc.ServiceError | null, res: SamplesListResponse) => void,
    ) => {},
    sampleConfigs: (
      req: SampleConfigsRequest,
      callback: (error: grpc.ServiceError | null, res: SampleConfigsResponse) => void,
    ) => {},
    sampleCreate: (
      req: SampleCreateRequest,
      callback: (error: grpc.ServiceError | null, res: SampleCreateResponse) => void,
    ) => {},
  };

  const stripeDaemon = <Partial<StripeDaemon>>{
    setupClient: () => {},
  };

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('selectAndCloneSample', () => {
    test('prompts for sample config, clones, and opens sample', async () => {
      // Mock gRPC server

      sandbox
        .stub(daemonClient, 'samplesList')
        .value(
          (
            req: SamplesListRequest,
            callback: (error: grpc.ServiceError | null, res: SamplesListResponse) => void,
          ) => {
            const sampleData = new SamplesListResponse.SampleData();
            sampleData.setName('accept-a-payment');
            sampleData.setDescription('Learn how to accept a payment');
            sampleData.setUrl('https://github.com/stripe-samples/accept-a-payment');

            const response = new SamplesListResponse();
            response.setSamplesList([sampleData]);

            callback(null, response);
          },
        );

      sandbox
        .stub(daemonClient, 'sampleConfigs')
        .value(
          (
            req: SampleConfigsRequest,
            callback: (error: grpc.ServiceError | null, res: SampleConfigsResponse) => void,
          ) => {
            const integration = new SampleConfigsResponse.Integration();
            integration.setIntegrationName('using-webhooks');
            integration.setClientsList(['html', 'react']);
            integration.setServersList(['node', 'ruby']);

            const response = new SampleConfigsResponse();
            response.setIntegrationsList([integration]);

            callback(null, response);
          },
        );

      sandbox
        .stub(daemonClient, 'sampleCreate')
        .value(
          (
            req: SampleCreateRequest,
            callback: (error: grpc.ServiceError | null, res: SampleCreateResponse) => void,
          ) => {
            const response = new SampleCreateResponse();
            response.setPath('/foo/bar');
            response.setPostInstall('a post install message');

            callback(null, response);
          },
        );

      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient);

      const showQuickPickSpy = sandbox.spy(vscode.window, 'showQuickPick');
      const showOpenDialogStub = sandbox.spy(vscode.window, 'showOpenDialog');

      const stripeSamples = new StripeSamples(<any>stripeClient, <any>stripeDaemon);

      stripeSamples.selectAndCloneSample();

      // Simulate select sample
      await sleep(500);
      await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');

      // Simulate select integration
      await sleep(500);
      await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');

      // Simulate select client
      await sleep(500);
      await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');

      // Simulate select server
      await sleep(500);
      await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');

      // Simulate select path
      await sleep(500);
      await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');

      assert.strictEqual(showQuickPickSpy.callCount, 4);
      assert.strictEqual(showOpenDialogStub.callCount, 1);
    });

    test('prompts login when not authenticated', async () => {
      // Mock gRPC server
      sandbox
        .stub(daemonClient, 'samplesList')
        .value(
          (
            req: SamplesListRequest,
            callback: (error: grpc.ServiceError | null, res: SamplesListResponse) => void,
          ) => {
            const err: Partial<grpc.ServiceError> = {
              code: grpc.status.UNAUTHENTICATED,
            };
            callback(<any>err, new SamplesListResponse());
          },
        );

      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient);

      const promptLoginSpy = sandbox.spy(stripeClient, 'promptLogin');

      const stripeSamples = new StripeSamples(<any>stripeClient, <any>stripeDaemon);

      await stripeSamples.selectAndCloneSample();

      assert.strictEqual(promptLoginSpy.calledOnce, true);
    });

    test('shows error message when any other error occurs', async () => {
      // Mock gRPC server
      sandbox
        .stub(daemonClient, 'samplesList')
        .value(
          (
            req: SamplesListRequest,
            callback: (error: grpc.ServiceError | null, res: SamplesListResponse) => void,
          ) => {
            const err: Partial<grpc.ServiceError> = {
              code: grpc.status.UNKNOWN,
            };
            callback(<any>err, new SamplesListResponse());
          },
        );

      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient);

      const showErrorMessageSpy = sandbox.spy(vscode.window, 'showErrorMessage');

      const stripeSamples = new StripeSamples(<any>stripeClient, <any>stripeDaemon);

      await stripeSamples.selectAndCloneSample();

      assert.strictEqual(showErrorMessageSpy.calledOnce, true);
    });

    test('prompts upgrade when no daemon command', async () => {
      sandbox.stub(stripeDaemon, 'setupClient').throws(new NoDaemonCommandError());

      const promptUpdateForDaemonSpy = sandbox.spy(stripeClient, 'promptUpdateForDaemon');

      const stripeSamples = new StripeSamples(<any>stripeClient, <any>stripeDaemon);

      await stripeSamples.selectAndCloneSample();

      assert.strictEqual(promptUpdateForDaemonSpy.calledOnce, true);
    });
  });
});