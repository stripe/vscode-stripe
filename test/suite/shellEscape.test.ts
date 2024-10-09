import * as assert from 'assert';
import * as shellEscape from '../../src/shellEscape';
import * as sinon from 'sinon';
import * as utils from '../../src/utils';


suite('shellEscape', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('shellEscape', () => {
    test('non windows case: flag with spaces', () => {
      sandbox.stub(utils, 'getOSType').returns(utils.OSType.macOSarm);
      const output = shellEscape.shellEscape(['--project-name', 'test | whoami']);
      assert.strictEqual(output, '--project-name \'test | whoami\'');
    });
    test.only('windows case: flag with space', () => {
      sandbox.stub(utils, 'getOSType').returns(utils.OSType.windows);
      const output = shellEscape.shellEscape(['--project-name', 'test | whoami']);
      assert.strictEqual(output, '--project-name \"test | whoami\"');
    })
  });
});
