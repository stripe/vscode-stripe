import * as assert from 'assert';
import * as javaClientUtils from '../../src/stripeJavaLanguageClient/utils';
import * as javaServerStarter from '../../src/stripeJavaLanguageClient/javaServerStarter';
import * as sinon from 'sinon';
import {mocks} from '../mocks/vscode';

suite('JavaServerStarter', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('prepareExecutable', () => {
    const isSyntaxServer = true;
    const workspacePath = '/path/to/workspace';
    const extensionContext = {...mocks.extensionContextMock};

    setup(() => {
      sandbox.stub(javaClientUtils, 'getJavaEncoding').returns('utf8');
      sandbox.stub(javaClientUtils, 'getServerLauncher').returns(['/path/to/server.jar']);
      sandbox.stub(javaClientUtils, 'ensureExists');
      sandbox.stub(javaClientUtils, 'checkPathExists').returns(true);
      sandbox.stub(javaClientUtils, 'getTimestamp').returns(-1);
    });

    test('get params for jdk version > 8, not in debug or dev mode', () => {
      const jdkInfo = {javaHome: '/path/to/java', javaVersion: 11};
      sandbox.stub(javaClientUtils, 'startedInDebugMode').returns(false);
      sandbox.stub(javaClientUtils, 'startedFromSources').returns(false);

      const exec = javaServerStarter.prepareExecutable(
        jdkInfo,
        workspacePath,
        extensionContext,
        isSyntaxServer,
      );

      assert.strictEqual(exec.args?.length, 15);
      assert.strictEqual(exec.args?.includes('--add-modules=ALL-SYSTEM'), true);
      assert.strictEqual(exec.args?.includes('--add-opens'), true);
      assert.strictEqual(exec.args?.includes('java.base/java.util=ALL-UNNAMED'), true);
      assert.strictEqual(exec.args?.includes('java.base/java.lang=ALL-UNNAMED'), true);
      assert.strictEqual(
        exec.args?.includes('-Declipse.application=org.eclipse.jdt.ls.core.id1'),
        true,
      );
      assert.strictEqual(exec.args?.includes('-Dosgi.bundles.defaultStartLevel=4'), true);
      assert.strictEqual(
        exec.args?.includes('-Declipse.product=org.eclipse.jdt.ls.core.product'),
        true,
      );
      assert.strictEqual(exec.args?.includes('-Dosgi.bundles.defaultStartLevel=4'), true);
      assert.strictEqual(exec.args?.includes('-Dfile.encoding=utf8'), true);
      assert.strictEqual(exec.args?.includes('-jar'), true);
      assert.strictEqual(exec.args?.includes('-configuration'), true);
      assert.strictEqual(exec.args?.includes('-data'), true);
      assert.strictEqual(exec.args?.includes(workspacePath), true);
    });

    test('get params for jdk version > 8, in debug mode', () => {
      const jdkInfo = {javaHome: '/path/to/java', javaVersion: 11};
      sandbox.stub(javaClientUtils, 'startedInDebugMode').returns(true);
      sandbox.stub(javaClientUtils, 'startedFromSources').returns(false);

      const exec = javaServerStarter.prepareExecutable(
        jdkInfo,
        workspacePath,
        extensionContext,
        isSyntaxServer,
      );

      assert.strictEqual(exec.args?.length, 17);
      assert.strictEqual(
        exec.args?.includes(
          '-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=1047,quiet=y',
        ),
        true,
      );
      assert.strictEqual(exec.args?.includes('--add-modules=ALL-SYSTEM'), true);
      assert.strictEqual(exec.args?.includes('--add-opens'), true);
      assert.strictEqual(exec.args?.includes('java.base/java.util=ALL-UNNAMED'), true);
      assert.strictEqual(exec.args?.includes('java.base/java.lang=ALL-UNNAMED'), true);
      assert.strictEqual(
        exec.args?.includes('-Declipse.application=org.eclipse.jdt.ls.core.id1'),
        true,
      );
      assert.strictEqual(exec.args?.includes('-Dosgi.bundles.defaultStartLevel=4'), true);
      assert.strictEqual(
        exec.args?.includes('-Declipse.product=org.eclipse.jdt.ls.core.product'),
        true,
      );
      assert.strictEqual(exec.args?.includes('-Dosgi.bundles.defaultStartLevel=4'), true);
      assert.strictEqual(exec.args?.includes('-Dlog.level=ALL'), true);
      assert.strictEqual(exec.args?.includes('-Dfile.encoding=utf8'), true);
      assert.strictEqual(exec.args?.includes('-jar'), true);
      assert.strictEqual(exec.args?.includes('-configuration'), true);
      assert.strictEqual(exec.args?.includes('-data'), true);
      assert.strictEqual(exec.args?.includes(workspacePath), true);
    });

    test('get params for jdk version > 8, in dev mode', () => {
      const jdkInfo = {javaHome: '/path/to/java', javaVersion: 11};
      sandbox.stub(javaClientUtils, 'startedInDebugMode').returns(false);
      sandbox.stub(javaClientUtils, 'startedFromSources').returns(true);

      const exec = javaServerStarter.prepareExecutable(
        jdkInfo,
        workspacePath,
        extensionContext,
        isSyntaxServer,
      );

      assert.strictEqual(exec.args?.length, 15);
      assert.strictEqual(exec.args?.includes('--add-modules=ALL-SYSTEM'), true);
      assert.strictEqual(exec.args?.includes('--add-opens'), true);
      assert.strictEqual(exec.args?.includes('java.base/java.util=ALL-UNNAMED'), true);
      assert.strictEqual(exec.args?.includes('java.base/java.lang=ALL-UNNAMED'), true);
      assert.strictEqual(
        exec.args?.includes('-Declipse.application=org.eclipse.jdt.ls.core.id1'),
        true,
      );
      assert.strictEqual(exec.args?.includes('-Dosgi.bundles.defaultStartLevel=4'), true);
      assert.strictEqual(
        exec.args?.includes('-Declipse.product=org.eclipse.jdt.ls.core.product'),
        true,
      );
      assert.strictEqual(exec.args?.includes('-Dosgi.bundles.defaultStartLevel=4'), true);
      assert.strictEqual(exec.args?.includes('-Dfile.encoding=utf8'), true);
      assert.strictEqual(exec.args?.includes('-jar'), true);
      assert.strictEqual(exec.args?.includes('-configuration'), true);
      assert.strictEqual(exec.args?.includes('-data'), true);
      assert.strictEqual(exec.args?.includes(workspacePath), true);
    });

    test('get params for jdk version < 8, not in debug or dev mode', () => {
      const jdkInfo = {javaHome: '/path/to/java', javaVersion: 7};
      sandbox.stub(javaClientUtils, 'startedInDebugMode').returns(false);
      sandbox.stub(javaClientUtils, 'startedFromSources').returns(false);

      const exec = javaServerStarter.prepareExecutable(
        jdkInfo,
        workspacePath,
        extensionContext,
        isSyntaxServer,
      );

      assert.strictEqual(exec.args?.length, 10);
      assert.strictEqual(
        exec.args?.includes('-Declipse.application=org.eclipse.jdt.ls.core.id1'),
        true,
      );
      assert.strictEqual(exec.args?.includes('-Dosgi.bundles.defaultStartLevel=4'), true);
      assert.strictEqual(
        exec.args?.includes('-Declipse.product=org.eclipse.jdt.ls.core.product'),
        true,
      );
      assert.strictEqual(exec.args?.includes('-Dosgi.bundles.defaultStartLevel=4'), true);
      assert.strictEqual(exec.args?.includes('-Dfile.encoding=utf8'), true);
      assert.strictEqual(exec.args?.includes('-jar'), true);
      assert.strictEqual(exec.args?.includes('-configuration'), true);
      assert.strictEqual(exec.args?.includes('-data'), true);
      assert.strictEqual(exec.args?.includes(workspacePath), true);
    });
  });
});
