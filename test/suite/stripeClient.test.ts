import * as assert from 'assert';
import * as sinon from 'sinon';
import * as utils from '../../src/utils';
import * as vscode from 'vscode';
import {CLICommand, StripeClient} from '../../src/stripeClient';
import {Readable, Writable} from 'stream';
import {EventEmitter} from 'events';
import {NoOpTelemetry} from '../../src/telemetry';
import childProcess from 'child_process';

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
        [utils.OSType.macOSintel, '/usr/local/bin/stripe'],
        [utils.OSType.macOSarm, '/opt/homebrew/bin/stripe'],
        [utils.OSType.windows, 'scoop/shims/stripe.exe'],
      ];
      const resolvedPath = '/resolved/path/to/stripe';

      osPathPairs.forEach(([os, path]) => {
        suite(`on ${os}`, () => {
          let realpathStub: sinon.SinonStub;
          let statStub: sinon.SinonStub;

          setup(() => {
            sandbox.stub(utils, 'getOSType').returns(os);
            realpathStub = sandbox
              .stub(fs.promises, 'realpath')
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
        assert.deepStrictEqual(showErrorMessageSpy.args[0], [
          'Welcome! Stripe is using the Stripe CLI behind the scenes, and requires it to be installed on your machine',
          {modal: true},
          'Read instructions on how to install Stripe CLI',
        ]);
      });
    });

    suite('with custom CLI install path', () => {
      const osTypes = [utils.OSType.linux, utils.OSType.macOSintel, utils.OSType.macOSarm, utils.OSType.windows];
      const customPath = '/foo/bar/baz';
      const resolvedPath = '/resolved/path/to/stripe';

      let realpathStub: sinon.SinonStub;
      let statStub: sinon.SinonStub;

      setup(() => {
        sandbox
          .stub(vscode.workspace, 'getConfiguration')
          .withArgs('stripe')
          .returns(<any>{get: () => customPath});
        realpathStub = sandbox
          .stub(fs.promises, 'realpath')
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
        assert.deepStrictEqual(showErrorMessageSpy.args[0], [
          "You set a custom installation path for the Stripe CLI, but we couldn't find the executable in '/foo/bar/baz'",
          'Ok',
        ]);
      });
    });
  });

  suite('CLI processes', () => {
    let spawnStub: sinon.SinonStub;
    let cliProcessStub: childProcess.ChildProcess;

    setup(() => {
      cliProcessStub = <childProcess.ChildProcess>new EventEmitter();
      cliProcessStub.stdin = new Writable();
      cliProcessStub.stdout = <Readable>new EventEmitter();
      cliProcessStub.stderr = <Readable>new EventEmitter();
      cliProcessStub.kill = () => {};
      spawnStub = sandbox.stub(childProcess, 'spawn').returns(cliProcessStub);
    });

    test('spawns a child process with stripe logs tail', async () => {
      const stripeClient = new StripeClient(new NoOpTelemetry());
      sandbox.stub(stripeClient, 'getCLIPath').resolves('path/to/stripe');
      const stripeLogsTailProcess = await stripeClient.getOrCreateCLIProcess(CLICommand.LogsTail);
      assert.strictEqual(spawnStub.callCount, 1);
      assert.deepStrictEqual(spawnStub.args[0], ['path/to/stripe', ['logs', 'tail']]);
      assert.ok(stripeLogsTailProcess);
    });

    test('reuses existing stripe process if it already exists', async () => {
      const stripeClient = new StripeClient(new NoOpTelemetry());
      sandbox.stub(stripeClient, 'getCLIPath').resolves('path/to/stripe');
      const stripeLogsTailProcess = await stripeClient.getOrCreateCLIProcess(CLICommand.LogsTail);
      const stripeLogsTailProcess2 = await stripeClient.getOrCreateCLIProcess(CLICommand.LogsTail);
      assert.strictEqual(spawnStub.callCount, 1);
      assert.deepStrictEqual(spawnStub.args[0], ['path/to/stripe', ['logs', 'tail']]);
      assert.deepStrictEqual(stripeLogsTailProcess, stripeLogsTailProcess2);
    });

    test('passes flags to spawn', async () => {
      const flags = ['--format', 'JSON'];
      const stripeClient = new StripeClient(new NoOpTelemetry());
      sandbox.stub(stripeClient, 'getCLIPath').resolves('path/to/stripe');
      const stripeLogsTailProcess = await stripeClient.getOrCreateCLIProcess(
        CLICommand.LogsTail,
        flags,
      );
      assert.strictEqual(spawnStub.callCount, 1);
      assert.deepStrictEqual(spawnStub.args[0], [
        'path/to/stripe',
        ['logs', 'tail', '--format', 'JSON'],
      ]);
      assert.ok(stripeLogsTailProcess);
    });

    test('ends stripe process', async () => {
      const stripeClient = new StripeClient(new NoOpTelemetry());
      sandbox.stub(stripeClient, 'getCLIPath').resolves('path/to/stripe');
      const stripeLogsTailProcess = await stripeClient.getOrCreateCLIProcess(CLICommand.LogsTail);
      if (!stripeLogsTailProcess) {
        throw new assert.AssertionError();
      }
      const killStub = sandbox.stub(stripeLogsTailProcess, 'kill');
      assert.strictEqual(stripeClient.cliProcesses.has(CLICommand.LogsTail), true);
      stripeClient.endCLIProcess(CLICommand.LogsTail);
      assert.strictEqual(killStub.callCount, 1);
    });

    suite('on child process events', () => {
      ['exit', 'error'].forEach((event) => {
        test(`on ${event}, removes child process`, async () => {
          const stripeClient = new StripeClient(new NoOpTelemetry());
          sandbox.stub(stripeClient, 'getCLIPath').resolves('path/to/stripe');
          const stripeLogsTailProcess = await stripeClient.getOrCreateCLIProcess(
            CLICommand.LogsTail,
          );
          if (!stripeLogsTailProcess) {
            throw new assert.AssertionError();
          }

          assert.strictEqual(stripeClient.cliProcesses.has(CLICommand.LogsTail), true);
          const spy = sandbox.spy();
          stripeLogsTailProcess.on(event, spy);
          stripeLogsTailProcess.emit(event);
          assert.strictEqual(spawnStub.callCount, 1);
          assert.strictEqual(spy.callCount, 1);
          assert.strictEqual(stripeClient.cliProcesses.has(CLICommand.LogsTail), false);
        });
      });
    });
  });
});
