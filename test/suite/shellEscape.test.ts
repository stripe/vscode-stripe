/* eslint-disable quotes */
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
      const output = shellEscape.shellEscape(['--project-name', 'test | whoami']); // test | whoami
      assert.strictEqual(output, `--project-name 'test | whoami'`); // --project-name 'test | whoami'
    });
    test('non windows case: flag with single quote around entire arg', () => {
      sandbox.stub(utils, 'getOSType').returns(utils.OSType.macOSarm);
      const output = shellEscape.shellEscape(['--project-name', `'test name'`]); // 'test name'
      assert.strictEqual(output, `--project-name \\''test name'\\'`); // --project-name \''test name'\'
    });
    test('non windows case: flag with double quote', () => {
      sandbox.stub(utils, 'getOSType').returns(utils.OSType.macOSarm);
      const output = shellEscape.shellEscape(['--project-name', `test "name"`]); // test "name"
      assert.strictEqual(output, `--project-name 'test "name"'`); // --project-name 'test "name"'
    });
    test('non windows case: flag with lots of quotes', () => {
      sandbox.stub(utils, 'getOSType').returns(utils.OSType.macOSarm);
      const output = shellEscape.shellEscape(['--project-name', `'test's "name"'`]); // 'test's "name"'
      assert.strictEqual(output, `--project-name \\''test'\\''s "name"'\\'`); // --project-name \''test'\''s "name"'\'
    });
    test.only('windows case: flag with space', () => {
      sandbox.stub(utils, 'getOSType').returns(utils.OSType.windows);
      const output = shellEscape.shellEscape(['--project-name', 'test | whoami']); // test | whoami
      assert.strictEqual(output, `--project-name "test | whoami"`); // --project-name "test | whoami"
    });
    test.only('windows case: flag with single quote around entire arg', () => {
      sandbox.stub(utils, 'getOSType').returns(utils.OSType.windows);
      const output = shellEscape.shellEscape(['--project-name', `'test name'`]); // 'test name'
      assert.strictEqual(output, `--project-name "'test name'"`); // --project-name "'test name'"
    });
    test.only('windows case: flag with double quote', () => {
      sandbox.stub(utils, 'getOSType').returns(utils.OSType.windows);
      const output = shellEscape.shellEscape(['--project-name', `test "name"`]); // test "name"
      assert.strictEqual(output, `--project-name "test \\"name\\""`); // --project-name "test \"name\""
    });
    test.only('windows case: flag with lots of quotes', () => {
      sandbox.stub(utils, 'getOSType').returns(utils.OSType.windows);
      const output = shellEscape.shellEscape(['--project-name', `'test's "name"'`]); // 'test's "name"'
      assert.strictEqual(output, `--project-name "'test's \\"name\\"'"`); // --project-name "'test's \"name\"'"
    });
  });
});
