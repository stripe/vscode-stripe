import * as assert from 'assert';
import * as sinon from 'sinon';
import * as utils from '../../utils';
import * as vscode from 'vscode';
import {NoOpTelemetry} from '../../telemetry';
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

  suite('getCLIPath', () => {
    suite('with default CLI install path', () => {
      const osPathPairs: [utils.OSType, string][] = [
        [utils.OSType.linux, '/usr/local/bin/stripe'],
        [utils.OSType.macOS, '/usr/local/bin/stripe'],
        [utils.OSType.windows, 'scoop/shims/stripe.exe'],
      ];
      const resolvedPath = '/resolved/path/to/stripe';

      osPathPairs.forEach(([os, path]) => {
        suite(`on ${os}`, () => {

          let realpathStub: sinon.SinonStub;
          let statStub: sinon.SinonStub;

          setup(() => {
            sandbox.stub(utils, 'getOSType').returns(os);
            realpathStub = sandbox.stub(fs.promises, 'realpath')
              .withArgs(path)
              .returns(Promise.resolve(resolvedPath));
            statStub = sandbox.stub(fs.promises, 'stat').withArgs(resolvedPath);
          });

          test('detects installed', async () => {
            statStub.returns(Promise.resolve({isFile: () => true})); // the path is a file; CLI found
            const stripeClient = new StripeClient(new NoOpTelemetry());
            const cliPath = await stripeClient.getCLIPath();
            assert.strictEqual(cliPath, path);
            assert.deepStrictEqual(realpathStub.args[0], [path]);
            assert.deepStrictEqual(statStub.args[0], [resolvedPath]);
          });

          test('detects not installed', async () => {
            statStub.returns(Promise.resolve({isFile: () => false})); // the path is not a file; CLI not found
            const stripeClient = new StripeClient(new NoOpTelemetry());
            const cliPath = await stripeClient.getCLIPath();
            assert.strictEqual(cliPath, null);
            assert.deepStrictEqual(realpathStub.args[0], [path]);
            assert.deepStrictEqual(statStub.args[0], [resolvedPath]);
          });
        });
      });

      test('prompts install when CLI is not installed', async () => {
        sandbox.stub(fs.promises, 'stat').returns(Promise.resolve({isFile: () => false}));
        const showErrorMessageSpy = sandbox.stub(vscode.window, 'showErrorMessage');
        const stripeClient = new StripeClient(new NoOpTelemetry());
        const cliPath = await stripeClient.getCLIPath();
        assert.strictEqual(cliPath, null);
        assert.deepStrictEqual(
          showErrorMessageSpy.args[0],
          [
            'Welcome! Stripe is using the Stripe CLI behind the scenes, and requires it to be installed on your machine',
            {},
            'Read instructions on how to install Stripe CLI',
          ]
        );
      });
    });

    suite('with custom CLI install path', () => {
      const osTypes = [utils.OSType.linux, utils.OSType.macOS, utils.OSType.windows];
      const customPath = '/foo/bar/baz';
      const resolvedPath = '/resolved/path/to/stripe';

      let realpathStub: sinon.SinonStub;
      let statStub: sinon.SinonStub;

      setup(() => {
        sandbox.stub(vscode.workspace, 'getConfiguration')
          .withArgs('stripe')
          .returns(<any>{get: () => customPath});
        realpathStub = sandbox.stub(fs.promises, 'realpath')
          .withArgs(customPath)
          .returns(Promise.resolve(resolvedPath));
        statStub = sandbox.stub(fs.promises, 'stat').withArgs(resolvedPath);

      });

      osTypes.forEach((os) => {
        suite(`on ${os}`, () => {
          setup(() => {
            sandbox.stub(utils, 'getOSType').returns(os);
          });

          test('detects installed', async () => {
            statStub.returns(Promise.resolve({isFile: () => true})); // the path is a file; CLI found
            const stripeClient = new StripeClient(new NoOpTelemetry());
            const cliPath = await stripeClient.getCLIPath();
            assert.strictEqual(cliPath, customPath);
            assert.deepStrictEqual(realpathStub.args[0], [customPath]);
            assert.deepStrictEqual(statStub.args[0], [resolvedPath]);
          });

          test('detects not installed', async () => {
            statStub.returns(Promise.resolve({isFile: () => false})); // the path is not a file; CLI not found
            const stripeClient = new StripeClient(new NoOpTelemetry());
            const cliPath = await stripeClient.getCLIPath();
            assert.strictEqual(cliPath, null);
            assert.deepStrictEqual(realpathStub.args[0], [customPath]);
            assert.deepStrictEqual(statStub.args[0], [resolvedPath]);
          });
        });
      });

      test('shows error when CLI is not at that path', async () => {
        statStub.returns(Promise.resolve({isFile: () => false}));
        const showErrorMessageSpy = sandbox.stub(vscode.window, 'showErrorMessage');
        const stripeClient = new StripeClient(new NoOpTelemetry());
        const cliPath = await stripeClient.getCLIPath();
        assert.strictEqual(cliPath, null);
        assert.deepStrictEqual(
          showErrorMessageSpy.args[0],
          ["You set a custom installation path for the Stripe CLI, but we couldn't find the executable in '/foo/bar/baz'", 'Ok'],
        );
      });
    });
  });
});
