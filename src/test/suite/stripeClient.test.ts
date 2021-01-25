import * as assert from 'assert';
import * as sinon from 'sinon';
import * as utils from '../../utils';
import * as vscode from 'vscode';
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
            statSyncStub.returns(<any>{isFile: () => true}); // the path is a file; CLI found
            const stripeClient = new StripeClient();
            stripeClient.detectInstalled();
            assert.deepStrictEqual(statSyncStub.args[0], [path]);
            assert.strictEqual(stripeClient.isInstalled, true);
            assert.strictEqual(stripeClient.cliPath, path);
          });

          test('detects not installed', () => {
            statSyncStub.returns(<any>{isFile: () => false}); // the path is not a file; CLI not found
            const stripeClient = new StripeClient();
            stripeClient.detectInstalled();
            assert.deepStrictEqual(statSyncStub.args[0], [path]);
            assert.strictEqual(stripeClient.isInstalled, false);
          });
        });
      });
    });

    suite('with custom CLI install path', () => {
      const osTypes = [utils.OSType.linux, utils.OSType.macOS, utils.OSType.windows];
      const customPath = '/foo/bar/baz';

      let statSyncStub: sinon.SinonStub;

      setup(() => {
        sandbox.stub(vscode.workspace, 'getConfiguration')
          .withArgs('stripe')
          .returns(<any>{get: () => customPath});
        statSyncStub = sandbox.stub(fs, 'statSync').withArgs(customPath);
      });

      osTypes.forEach((os) => {
        suite(`on ${os}`, () => {
          setup(() => {
            sandbox.stub(utils, 'getOSType').returns(os);
          });

          test('detects installed', () => {
            statSyncStub.returns(<any>{isFile: () => true}); // the path is a file; CLI found
            const stripeClient = new StripeClient();
            stripeClient.detectInstalled();
            assert.deepStrictEqual(statSyncStub.args[0], [customPath]);
            assert.strictEqual(stripeClient.isInstalled, true);
            assert.strictEqual(stripeClient.cliPath, customPath);
          });

          test('detects not installed', () => {
            statSyncStub.returns(<any>{isFile: () => false}); // the path is not a file; CLI not found
            const stripeClient = new StripeClient();
            stripeClient.detectInstalled();
            assert.deepStrictEqual(statSyncStub.args[0], [customPath]);
            assert.strictEqual(stripeClient.isInstalled, false);
          });
        });
      });
    });
  });
});
