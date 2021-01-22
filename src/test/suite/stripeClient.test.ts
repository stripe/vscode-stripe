import * as assert from 'assert';
import * as sinon from 'sinon';
import * as utils from '../../utils';
import {StripeClient} from '../../stripeClient';

const fs = require('fs');

suite('stripeClient', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('detectInstalled', () => {
    suite('with default CLI install path', () => {
      const osPathPairs: [utils.OSType, string][] = [
        [utils.OSType.linux, '/usr/local/bin/stripe'],
        [utils.OSType.macOS, '/usr/local/bin/stripe'],
        [utils.OSType.windows, 'scoop/shims/stripe.exe'],
      ];

      osPathPairs.forEach(([os, path]) => {
        suite(`on ${os}`, () => {
          let statSyncStub: sinon.SinonStub;

          setup(() => {
            sandbox.stub(utils, 'getOSType').returns(os);
            statSyncStub = sandbox.stub(fs, 'statSync').withArgs(path);
          });

          test('detects installed', () => {
            statSyncStub.returns(<any>{isFile: () => true});
            const stripeClient = new StripeClient();
            stripeClient.detectInstalled();
            assert.deepStrictEqual(statSyncStub.args[0], [path]);
            assert.strictEqual(stripeClient.isInstalled, true);
            assert.strictEqual(stripeClient.cliPath, path);
          });

          test('detects not installed', () => {
            statSyncStub.returns(<any>{isFile: () => false});
            const stripeClient = new StripeClient();
            stripeClient.detectInstalled();
            assert.deepStrictEqual(statSyncStub.args[0], [path]);
            assert.strictEqual(stripeClient.isInstalled, false);
          });
        });
      });
    });
  });
});
