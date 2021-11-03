import * as assert from 'assert';
import * as javaClientUtils from '../../src/stripeJavaLanguageClient/utils';
import * as javaServerStarter from '../../src/stripeJavaLanguageClient/javaServerStarter';
import * as sinon from 'sinon';
import * as utils from '../../src/utils';
import * as vscode from 'vscode';
import {BaseLanguageClient, MessageTransports} from 'vscode-languageclient';
import {NoOpTelemetry, Telemetry} from '../../src/telemetry';
import {StripeLanguageClient} from '../../src/languageServerClient';
import {mocks} from '../mocks/vscode';

const proxyquire = require('proxyquire');
const modulePath = '../../src/languageServerClient';

const setupProxies = (proxies: any) => proxyquire(modulePath, proxies);
const activeTextEditor = (fileExt: string): any => {
  return {
    document: {
      uri: {
        scheme: 'file',
        fsPath: `test.${fileExt}`
      }
    }
  };
};

class TestLanguageClient extends BaseLanguageClient {
  protected getLocale(): string {
    throw new Error('Method not implemented.');
  }
  constructor() {
    super('foo', 'foo', {});
  }
  protected createMessageTransports(): Promise<MessageTransports> {
    throw new Error('Method not implemented.');
  }
  start() {
    return {dispose: () => {}};
  }

  onReady() {
    return Promise.resolve();
  }
}

const vscodeStub = {
  LanguageClient: TestLanguageClient,
};

suite('languageServerClient', function () {
  this.timeout(20000);
  let extensionContext: vscode.ExtensionContext;
  let outputChannel: Partial<vscode.OutputChannel>;
  let telemetry: Telemetry;
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
    outputChannel = {appendLine: (value: string) => {}, show: () => {}};
    extensionContext = {...mocks.extensionContextMock};
    telemetry = new NoOpTelemetry();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('activateDotNetServer', () => {
    const module = setupProxies({'vscode-languageclient/node': vscodeStub});
    const dotnetPath = '/my/executable/path';
    let telemetrySpy: sinon.SinonSpy;

    const stubDotnetAcquire = (result: {} | undefined) => {
      return sandbox
        .stub(vscode.commands, 'executeCommand')
        .withArgs('dotnet.acquire', {
          version: '5.0',
          requestingExtensionId: 'stripe.vscode-stripe',
        })
        .resolves(result);
    };

    setup(() => {
      telemetrySpy = sandbox.spy(telemetry, 'sendEvent');
    });

    test('calls activate on dotnet client', async () => {
      sandbox.stub(utils, 'getOSType').returns(utils.OSType.macOSintel);
      const dotnetAcquireStub = stubDotnetAcquire({dotnetPath: dotnetPath});
      const projectFile = 'project/file.sln';

      await module.StripeLanguageClient.activateDotNetServer(
        extensionContext,
        <any>outputChannel,
        projectFile,
        telemetry,
      );

      assert.deepStrictEqual(dotnetAcquireStub.calledOnce, true);
      assert.deepStrictEqual(
        telemetrySpy.calledWith('dotnetRuntimeAcquisitionSkippedForM1'),
        false,
      );
      assert.deepStrictEqual(telemetrySpy.calledWith('dotnetRuntimeAcquisitionFailed'), false);
      assert.deepStrictEqual(telemetrySpy.calledWith('dotnetServerStarted'), true);
    });

    test('does not start server if on M1', async () => {
      sandbox.stub(utils, 'getOSType').returns(utils.OSType.macOSarm);
      const dotnetAcquireStub = stubDotnetAcquire({dotnetPath: dotnetPath});

      const projectFile = 'project/file.sln';

      await module.StripeLanguageClient.activateDotNetServer(
        extensionContext,
        <any>outputChannel,
        projectFile,
        telemetry,
      );

      assert.deepStrictEqual(telemetrySpy.calledWith('dotnetRuntimeAcquisitionSkippedForM1'), true);
      assert.deepStrictEqual(dotnetAcquireStub.calledOnce, false);
      assert.deepStrictEqual(telemetrySpy.calledWith('dotnetRuntimeAcquisitionFailed'), false);
      assert.deepStrictEqual(telemetrySpy.calledWith('dotnetServerStarted'), false);
    });

    test('does not start server error while acquiring dotnet', async () => {
      sandbox.stub(utils, 'getOSType').returns(utils.OSType.macOSintel);
      const dotnetAcquireStub = stubDotnetAcquire(undefined);

      const projectFile = 'project/file.sln';

      await module.StripeLanguageClient.activateDotNetServer(
        extensionContext,
        <any>outputChannel,
        projectFile,
        telemetry,
      );

      assert.deepStrictEqual(
        telemetrySpy.calledWith('dotnetRuntimeAcquisitionSkippedForM1'),
        false,
      );
      assert.deepStrictEqual(dotnetAcquireStub.calledOnce, true);
      assert.deepStrictEqual(telemetrySpy.calledWith('dotnetRuntimeAcquisitionFailed'), true);
      assert.deepStrictEqual(telemetrySpy.calledWith('dotnetServerStarted'), false);
    });
  });

  suite('getDotnetProjectFiles', () => {
    const workspaceRoot = vscode.Uri.file('my/path');
    const workspacePath = workspaceRoot.fsPath;

    test('returns empty when no workspaces', async () => {
      sandbox.stub(vscode.workspace, 'workspaceFolders').value([]);
      const projectFiles = await StripeLanguageClient.getDotnetProjectFiles();
      assert.deepStrictEqual(projectFiles, []);
    });

    test('returns empty when workspaceFolder is undefined', async () => {
      sandbox.stub(vscode.workspace, 'workspaceFolders').value(undefined);
      const projectFiles = await StripeLanguageClient.getDotnetProjectFiles();
      assert.deepStrictEqual(projectFiles, []);
    });

    test('returns sln project if it exists', async () => {
      const slnFile = vscode.Uri.file('project.sln');
      sandbox.stub(vscode.workspace, 'workspaceFolders').value([
        {
          index: 0,
          name: 'workspace',
          uri: vscode.Uri.file(workspacePath),
        },
      ]);
      sandbox.stub(vscode.workspace, 'findFiles').returns(Promise.resolve([slnFile]));

      const projectFiles = await StripeLanguageClient.getDotnetProjectFiles();
      assert.deepStrictEqual(projectFiles, [slnFile.fsPath]);
    });

    test('returns csproj if it exists', async () => {
      const csprojFile = vscode.Uri.file('project.csproj');
      sandbox.stub(vscode.workspace, 'workspaceFolders').value([
        {
          index: 0,
          name: 'workspace',
          uri: vscode.Uri.file(workspacePath),
        },
      ]);
      const fileFilesStub = sandbox.stub(vscode.workspace, 'findFiles');
      fileFilesStub
        .withArgs(new vscode.RelativePattern(workspacePath, '**/*.sln'))
        .returns(Promise.resolve([]));
      fileFilesStub
        .withArgs(new vscode.RelativePattern(workspacePath, '**/*.csproj'))
        .returns(Promise.resolve([csprojFile]));

      const projectFiles = await StripeLanguageClient.getDotnetProjectFiles();
      assert.deepStrictEqual(projectFiles, [csprojFile.fsPath]);
    });

    test('returns empty when no dotnet projects', async () => {
      sandbox.stub(vscode.workspace, 'workspaceFolders').value([
        {
          index: 0,
          name: 'workspace',
          uri: vscode.Uri.file(workspacePath),
        },
      ]);
      const fileFilesStub = sandbox.stub(vscode.workspace, 'findFiles');
      fileFilesStub.onCall(0).returns(Promise.resolve([]));
      fileFilesStub.onCall(1).returns(Promise.resolve([]));

      const projectFiles = await StripeLanguageClient.getDotnetProjectFiles();
      assert.deepStrictEqual(projectFiles, []);
    });

    test('filters out non-dotnet projects', async () => {
      const slnFile = vscode.Uri.file('project.sln');
      const workspacePath1 = vscode.Uri.file('path/to/workspace/1');
      const workspacePath2 = vscode.Uri.file('path/to/workspace/2');

      sandbox.stub(vscode.workspace, 'workspaceFolders').value([
        {
          index: 0,
          name: 'workspace',
          uri: workspacePath1,
        },
        {
          index: 1,
          name: 'another workspace',
          uri: workspacePath2,
        },
      ]);
      const fileFilesStub = sandbox.stub(vscode.workspace, 'findFiles');

      // first workspace has a solution
      fileFilesStub
        .withArgs(new vscode.RelativePattern(workspacePath1.fsPath, '**/*.sln'))
        .returns(Promise.resolve([slnFile]));

      // second workspace is not a dotnet project
      fileFilesStub
        .withArgs(new vscode.RelativePattern(workspacePath2.fsPath, '**/*.sln'))
        .returns(Promise.resolve([]));
      fileFilesStub
        .withArgs(new vscode.RelativePattern(workspacePath2.fsPath, '**/*.csproj'))
        .returns(Promise.resolve([]));

      const projectFiles = await StripeLanguageClient.getDotnetProjectFiles();
      assert.deepStrictEqual(projectFiles, [slnFile.fsPath]);
    });
  });

  suite('activateJavaServer', () => {
    const module = setupProxies({'vscode-languageclient': vscodeStub});
    const jdkInfo = {javaHome: '/path/to/java', javaVersion: 11};

    test('hybrid mode starts correct servers with correct workspace paths', async () => {
      sandbox.stub(javaClientUtils, 'getJavaServerLaunchMode').returns(javaClientUtils.ServerMode.HYBRID);
      sandbox.stub(javaClientUtils, 'hasNoBuildToolConflicts').returns(Promise.resolve(true));
      const connectToServerSpy = sandbox.stub(javaServerStarter, 'prepareExecutable');

      await module.StripeLanguageClient.activateJavaServer(
        extensionContext,
        jdkInfo,
        <any>outputChannel,
        ['file.java'],
        telemetry,
      );

      assert.strictEqual(connectToServerSpy.callCount, 2);

      let isSyntaxServer = true;
      assert.deepStrictEqual(connectToServerSpy.calledWith(sinon.match.any, sinon.match('ss_ws'), sinon.match.any, isSyntaxServer), true);

      isSyntaxServer = false;
      assert.deepStrictEqual(connectToServerSpy.calledWith(sinon.match.any, sinon.match('jdt_ws'), sinon.match.any, isSyntaxServer), true);
    });

    test('syntax mode starts syntax servers with syntax workspace paths', async () => {
      sandbox.stub(javaClientUtils, 'getJavaServerLaunchMode').returns(javaClientUtils.ServerMode.LIGHTWEIGHT);
      const connectToServerSpy = sandbox.stub(javaServerStarter, 'prepareExecutable');

      await module.StripeLanguageClient.activateJavaServer(
        extensionContext,
        jdkInfo,
        <any>outputChannel,
        ['file.java'],
        telemetry,
      );

      assert.strictEqual(connectToServerSpy.callCount, 1);

      const isSyntaxServer = true;
      assert.deepStrictEqual(connectToServerSpy.calledWith(sinon.match.any, sinon.match('ss_ws'), sinon.match.any, isSyntaxServer), true);
    });

    test('standard mode starts standard servers with standard workspace paths', async () => {
      sandbox.stub(javaClientUtils, 'getJavaServerLaunchMode').returns(javaClientUtils.ServerMode.STANDARD);
      sandbox.stub(javaClientUtils, 'hasNoBuildToolConflicts').returns(Promise.resolve(true));
      const connectToServerSpy = sandbox.stub(javaServerStarter, 'prepareExecutable');

      await module.StripeLanguageClient.activateJavaServer(
        extensionContext,
        jdkInfo,
        <any>outputChannel,
        ['file.java'],
        telemetry,
      );

      assert.strictEqual(connectToServerSpy.callCount, 1);

      const isSyntaxServer = false;
      assert.deepStrictEqual(connectToServerSpy.calledWith(sinon.match.any, sinon.match('jdt_ws'), sinon.match.any, isSyntaxServer), true);
    });
  });

  suite('getJavaProjectFiles', () => {
    test('returns empty when no active text editor open', async () => {
      sandbox.stub(vscode.window, 'activeTextEditor').value(undefined);
      const projectFiles = await StripeLanguageClient.getJavaProjectFiles();
      assert.deepStrictEqual(projectFiles, []);
    });

    test('returns empty when active open document does not end with .java', async () => {
      sandbox.stub(vscode.window, 'activeTextEditor').value(activeTextEditor('random'));
      const projectFiles = await StripeLanguageClient.getJavaProjectFiles();
      assert.deepStrictEqual(projectFiles, []);
    });

    test('returns java file when active open document end with .java', async () => {
      sandbox.stub(vscode.window, 'activeTextEditor').value(activeTextEditor('java'));
      const projectFiles = await StripeLanguageClient.getJavaProjectFiles();
      assert.deepStrictEqual(projectFiles, ['file:///test.java']);
    });
  });
});
