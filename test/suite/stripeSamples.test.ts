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

const stripeClient = <Partial<StripeClient>>{
  getCLIPath: () => Promise.resolve('/path/to/cli'),
  promptUpdateForDaemon: () => {},
  promptLogin: () => {},
};

const sampleData = new SamplesListResponse.SampleData();
sampleData.setName('accept-a-payment');
sampleData.setDescription('Learn how to accept a payment');
sampleData.setUrl('https://github.com/stripe-samples/accept-a-payment');

const sampleIntegration = new SampleConfigsResponse.Integration();
sampleIntegration.setIntegrationName('using-webhooks');
sampleIntegration.setClientsList(['html', 'react']);
sampleIntegration.setServersList(['node', 'ruby']);

// Mock gRPC server responses
const daemonClient = (
  sampleCreateError?: Partial<grpc.ServiceError>,
  samplesListError?: Partial<grpc.ServiceError>,
) => {
  const createError = !!sampleCreateError ? sampleCreateError : null;
  const listError = !!samplesListError ? samplesListError : null;

  return <Partial<StripeCLIClient>>{
    samplesList: (
      req: SamplesListRequest,
      callback: (error: grpc.ServiceError | null, res: SamplesListResponse) => void,
    ) => {
      const response = new SamplesListResponse();
      response.setSamplesList([sampleData]);

      callback(listError as any, response);
    },
    sampleConfigs: (
      req: SampleConfigsRequest,
      callback: (error: grpc.ServiceError | null, res: SampleConfigsResponse) => void,
    ) => {
      const response = new SampleConfigsResponse();
      response.setIntegrationsList([sampleIntegration]);

      callback(null, response);
    },
    sampleCreate: (
      req: SampleCreateRequest,
      callback: (error: grpc.ServiceError | null, res: SampleCreateResponse) => void,
    ) => {
      const response = new SampleCreateResponse();
      response.setPath('/foo/bar');
      response.setPostInstall('a post install message');

      callback(createError as any, response);
    },
  };
};

const stripeDaemon = <Partial<StripeDaemon>>{
  setupClient: () => {},
};

suite('StripeSamples', function () {
  this.timeout(20000);

  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  /**
   * This is a helper function to simulate all of the quick pick events we need to go through for the whole sample selection process.
   * @param showQuickPickStub
   */
  function stubSampleQuickPicks(showQuickPickStub: sinon.SinonStub) {
    // select sample
    showQuickPickStub.onCall(0).resolves({
      label: `$(repo) ${sampleData.getName()}`,
      detail: sampleData.getDescription(),
      sampleData: {
        name: sampleData.getName(),
        url: sampleData.getUrl(),
      },
    });

    // select integration
    showQuickPickStub.onCall(1).resolves(sampleIntegration.getIntegrationName());

    // select client
    showQuickPickStub.onCall(2).resolves('html');

    // select server
    showQuickPickStub.onCall(3).resolves('node');
  }

  suite('selectAndCloneSample', () => {
    test('prompts for sample config, clones, and opens sample', async () => {
      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient());
      const showQuickPickStub = sandbox.stub(vscode.window, 'showQuickPick');
      stubSampleQuickPicks(showQuickPickStub);

      const showInputBoxStub = sandbox
        .stub(vscode.window, 'showInputBox')
        .resolves('sample-name-by-user');
      const showOpenDialogStub = sandbox
        .stub(vscode.window, 'showOpenDialog')
        .resolves([vscode.Uri.parse('/my/path')]);
      const showInformationMessageStub = sandbox
        .stub(vscode.window, 'showInformationMessage')
        .resolves();
      const openSampleReadmeSpy = sandbox.spy(vscode.env, 'openExternal');

      const stripeSamples = new StripeSamples(<any>stripeClient, <any>stripeDaemon);

      await stripeSamples.selectAndCloneSample();

      assert.strictEqual(showQuickPickStub.callCount, 4);
      assert.strictEqual(showInputBoxStub.callCount, 1);
      assert.strictEqual(showOpenDialogStub.callCount, 1);
      assert.strictEqual(showInformationMessageStub.callCount, 2);
      assert.strictEqual(openSampleReadmeSpy.callCount, 1);
    });

    test('shows special post install message if API keys could not be set', async () => {
      // Simulate the special error response from the gRPC server
      const err: Partial<grpc.ServiceError> = {
        code: grpc.status.UNKNOWN,
        details: 'we could not set',
      };
      const showQuickPickStub = sandbox.stub(vscode.window, 'showQuickPick');
      stubSampleQuickPicks(showQuickPickStub);
      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient(err, undefined));
      sandbox.stub(vscode.window, 'showInputBox').resolves('sample-name-by-user');
      sandbox.stub(vscode.window, 'showOpenDialog').resolves([vscode.Uri.parse('/my/path')]);
      const showInformationMessageStub = sandbox
        .stub(vscode.window, 'showInformationMessage')
        .resolves();
      sandbox.spy(vscode.env, 'openExternal');

      const stripeSamples = new StripeSamples(<any>stripeClient, <any>stripeDaemon);

      await stripeSamples.selectAndCloneSample();

      // show cloning in progress message
      // assert.deepStrictEqual(
      //   showInformationMessageStub.calledWith('Sample "accept-a-payment" cloning in progress...', sinon.match.any),
      //   true
      // );

      // show sample cloned successfully message
      assert.deepStrictEqual(
        showInformationMessageStub.calledWith(
          'Your sample "sample-name-by-user" is all ready to go, but we could not set the API keys in the .env file. Please set them manually.',
          {modal: true},
          sinon.match.any,
          sinon.match.any,
        ),
        true,
      );
    });

    test('prompts upgrade when no daemon command', async () => {
      sandbox.stub(stripeDaemon, 'setupClient').throws(new NoDaemonCommandError());

      const promptUpdateForDaemonSpy = sandbox.spy(stripeClient, 'promptUpdateForDaemon');

      const stripeSamples = new StripeSamples(<any>stripeClient, <any>stripeDaemon);

      await stripeSamples.selectAndCloneSample();

      assert.strictEqual(promptUpdateForDaemonSpy.calledOnce, true);
    });

    test('shows error message when any other error occurs', async () => {
      const err: Partial<grpc.ServiceError> = {
        code: grpc.status.UNKNOWN,
        details: 'An unknown error occurred',
      };

      sandbox.stub(stripeDaemon, 'setupClient').resolves(daemonClient(undefined, err));
      const showErrorMessageSpy = sandbox.spy(vscode.window, 'showErrorMessage');

      const stripeSamples = new StripeSamples(<any>stripeClient, <any>stripeDaemon);

      await stripeSamples.selectAndCloneSample();

      assert.strictEqual(showErrorMessageSpy.calledOnce, true);
    });
  });
});
