import * as assert from 'assert';
import * as javaRuntimeUtils from '../../src/stripeJavaLanguageClient/javaRuntimesUtils';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import {mocks} from '../mocks/vscode';

const proxyquire = require('proxyquire');
const modulePath = '../../src/stripeJavaLanguageClient/javaRuntimesUtils';
const setupProxies = (proxies: any) => proxyquire(modulePath, proxies);

suite('JavaRuntimeUtils', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('getJavaSDKInfo', () => {
    let extensionContext: vscode.ExtensionContext;
    let outputChannel: Partial<vscode.OutputChannel>;
    let module: {
      getJavaSDKInfo: (
        extension: vscode.ExtensionContext,
        outputChannel: vscode.OutputChannel,
      ) => any;
    };

    setup(() => {
      outputChannel = {appendLine: (value: string) => {}, show: () => {}};
      extensionContext = {...mocks.extensionContextMock};
    });

    test('java home defined in config and jdk version meets requirement; expect user not prompted to update user settings', async () => {
      sandbox
        .stub(vscode.workspace, 'getConfiguration')
        .returns(<any>{get: () => '/path/to/java/home'});
      const updateWarningStub = sandbox
        .stub(vscode.window, 'showWarningMessage' as any)
        .resolves('Disallow');
      module = setupProxies({
        'fs-extra': {
          readFile: (file: string) => `JAVA_VERSION="${javaRuntimeUtils.REQUIRED_JDK_VERSION}"`,
        },
      });
      await module.getJavaSDKInfo(extensionContext, <any>outputChannel);
      assert.strictEqual(
        updateWarningStub.notCalled,
        true,
        'Should not prompt to update stripe.java.home',
      );
    });

    test('java home defined in config and installed JDK version does meet requirement; expect user prompted to check other JDK versions', async () => {
      sandbox
        .stub(vscode.workspace, 'getConfiguration')
        .returns(<any>{get: () => '/path/to/java/home'});
      const updateWarningStub = sandbox
        .stub(vscode.window, 'showWarningMessage' as any)
        .resolves('Disallow');
      const checkOtherJDKStub = sandbox
        .stub(vscode.window, 'showInformationMessage' as any)
        .resolves('Yes');
      module = setupProxies({
        'fs-extra': {
          readFile: (file: string) => `JAVA_VERSION="${javaRuntimeUtils.REQUIRED_JDK_VERSION - 1}"`,
        },
      });
      await module.getJavaSDKInfo(extensionContext, <any>outputChannel);
      assert.strictEqual(
        checkOtherJDKStub.calledWith(
          sinon.match('Do you want to check other installed JDK versions?'),
          'Yes',
          'No',
        ),
        true,
        'Should prompt to check other JDK settings.',
      );
      assert.strictEqual(
        updateWarningStub.notCalled,
        true,
        'Should not prompt to update stripe.java.home.',
      );
    });

    test('java home not defined in config and installed JDK version meets requirement; expect auto-detect other JDK versions and update user settings', async () => {
      sandbox.stub(vscode.workspace, 'getConfiguration').returns(<any>{get: () => ''});
      const updateWarningStub = sandbox
        .stub(vscode.window, 'showWarningMessage' as any)
        .resolves('Disallow');
      const checkOtherJDKStub = sandbox
        .stub(vscode.window, 'showInformationMessage' as any)
        .resolves('Yes');
      module = setupProxies({
        'fs-extra': {
          readFile: (file: string) => `JAVA_VERSION="${javaRuntimeUtils.REQUIRED_JDK_VERSION}"`,
        },
      });
      await module.getJavaSDKInfo(extensionContext, <any>outputChannel);
      assert.strictEqual(
        checkOtherJDKStub.notCalled,
        true,
        'Should not prompt to check other JDK settings. JDK detection should be automatic if not defined in user settings.',
      );
      assert.strictEqual(
        updateWarningStub.calledWith(
          sinon.match(
            `Do you allow Stripe extention to set the ${javaRuntimeUtils.STRIPE_JAVA_HOME} variable?`,
          ),
          'Disallow',
          'Allow',
        ),
        true,
        'Should prompt to update stripe.java.home',
      );
    });

    test('java home not defined in config and installed JDK version does meet requirement; expect auto-detect other JDK versions and does not update user settings', async () => {
      sandbox.stub(vscode.workspace, 'getConfiguration').returns(<any>{get: () => ''});
      const updateWarningStub = sandbox
        .stub(vscode.window, 'showWarningMessage' as any)
        .resolves('Disallow');
      const checkOtherJDKStub = sandbox
        .stub(vscode.window, 'showInformationMessage' as any)
        .resolves('Yes');
      module = setupProxies({
        'fs-extra': {
          readFile: (file: string) => `JAVA_VERSION="${javaRuntimeUtils.REQUIRED_JDK_VERSION - 1}"`,
        },
      });
      await module.getJavaSDKInfo(extensionContext, <any>outputChannel);
      assert.strictEqual(
        checkOtherJDKStub.notCalled,
        true,
        'Should not prompt to check other JDK settings. JDK detection should be automatic if not defined in user settings.',
      );
      assert.strictEqual(
        updateWarningStub.notCalled,
        true,
        'Should not prompt to update stripe.java.home',
      );
    });
  });
});
