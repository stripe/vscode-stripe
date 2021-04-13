import * as assert from 'assert';
import * as sinon from 'sinon';
import * as utils from '../../src/utils';
import * as vscode from 'vscode';
import {CLICommand, StripeClient} from '../../src/stripeClient';
import {Readable, Writable} from 'stream';
import {EventEmitter} from 'events';
import {NoOpTelemetry} from '../../src/telemetry';
import childProcess from 'child_process';
import {mocks} from '../mocks/vscode';

const fs = require('fs');
const proxyquire = require('proxyquire');
const modulePath = '../../src/stripeClient';

// Helper functions
const setupProxies = (proxies: any) => proxyquire(modulePath, proxies);

suite('stripeClient', () => {
  let sandbox: sinon.SinonSandbox;

  // Get an instance of a client with the mocked execa module
  const getStripeClientWithExecaProxy = (stdout: string) => {
    const extensionContext = {...mocks.extensionContextMock};
    const execa = sinon.stub().resolves({stdout: stdout});
    const module = setupProxies({execa});
    return new module.StripeClient(new NoOpTelemetry(), extensionContext);
  };

  // Get an instance of the stripeCLient
  const getStripeClient = () => {
    const extensionContext = {...mocks.extensionContextMock};
    return new StripeClient(new NoOpTelemetry(), extensionContext);
  };

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
            const stripeClient = getStripeClient();
            sandbox.stub(stripeClient, 'checkCLIVersion');
            sandbox.stub(stripeClient, 'isAuthenticated').resolves(true);
            const cliPath = await stripeClient.getCLIPath();

            assert.strictEqual(cliPath, path);
            assert.deepStrictEqual(realpathStub.args[0], [path]);
            assert.deepStrictEqual(statStub.args[0], [resolvedPath]);
          });

          test('detects not installed', async () => {
            statStub.returns(Promise.resolve({isFile: () => false})); // the path is not a file; CLI not found
            const stripeClient = getStripeClient();
            sandbox.stub(stripeClient, 'checkCLIVersion');
            sandbox.stub(stripeClient, 'isAuthenticated').resolves(true);
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
        const stripeClient = getStripeClient();
        sandbox.stub(stripeClient, 'checkCLIVersion');
        sandbox.stub(stripeClient, 'isAuthenticated').resolves(true);
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
      const osTypes = [
        utils.OSType.linux,
        utils.OSType.macOSintel,
        utils.OSType.macOSarm,
        utils.OSType.windows,
      ];
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
            const stripeClient = getStripeClient();
            sandbox.stub(stripeClient, 'checkCLIVersion');
            sandbox.stub(stripeClient, 'isAuthenticated').resolves(true);
            const cliPath = await stripeClient.getCLIPath();
            assert.strictEqual(cliPath, customPath);
            assert.deepStrictEqual(realpathStub.args[0], [customPath]);
            assert.deepStrictEqual(statStub.args[0], [resolvedPath]);
          });

          test('detects not installed', async () => {
            statStub.returns(Promise.resolve({isFile: () => false})); // the path is not a file; CLI not found
            const stripeClient = getStripeClient();
            sandbox.stub(stripeClient, 'checkCLIVersion');
            sandbox.stub(stripeClient, 'isAuthenticated').resolves(true);
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
        const stripeClient = getStripeClient();
        sandbox.stub(stripeClient, 'checkCLIVersion');
        sandbox.stub(stripeClient, 'isAuthenticated').resolves(true);
        const cliPath = await stripeClient.getCLIPath();
        assert.strictEqual(cliPath, null);
        assert.deepStrictEqual(showErrorMessageSpy.args[0], [
          "You set a custom installation path for the Stripe CLI, but we couldn't find the executable in '/foo/bar/baz'",
          'Ok',
        ]);
      });
    });
  });

  suite('Check CLI version', () => {
    let getCLIPathStub: sinon.SinonStub<any>;

    setup(() => {
      getCLIPathStub = sinon.stub(StripeClient, 'detectInstallation').resolves('path/to/stripe');
    });

    teardown(() => {
      getCLIPathStub.restore();
    });

    test('prompts for update when current version is lower', async () => {
      const stripeClient = getStripeClientWithExecaProxy(
        'stripe version 1.1.1\nThere is a newer version available...',
      );
      const promptSpy = sinon.spy(stripeClient, 'promptUpdate');
      await stripeClient.checkCLIVersion();

      // Verify promptUpdate called
      assert.strictEqual(promptSpy.callCount, 1);
    });

    test('does not prompt for update when current versions is higher', async () => {
      const stripeClient = getStripeClientWithExecaProxy(
        'stripe version 12.0.1\nThere is a newer version available...',
      );

      const promptSpy = sinon.spy(stripeClient, 'promptUpdate');
      await stripeClient.checkCLIVersion();

      // Verify promptUpdate not called
      assert.strictEqual(promptSpy.callCount, 0);
    });

    test('does not prompt for update when using development bundle', async () => {
      const stripeClient = getStripeClientWithExecaProxy('stripe version master');

      const promptSpy = sinon.spy(stripeClient, 'promptUpdate');
      await stripeClient.checkCLIVersion();

      // Verify promptUpdate not called
      assert.strictEqual(promptSpy.callCount, 0);
    });
  });

  suite('CLI processes', () => {
    let spawnStub: sinon.SinonStub;
    let cliProcessStub: childProcess.ChildProcess;
    let getCLIPathStub: sinon.SinonStub;

    setup(() => {
      cliProcessStub = <childProcess.ChildProcess>new EventEmitter();
      cliProcessStub.stdin = new Writable();
      cliProcessStub.stdout = <Readable>new EventEmitter();
      cliProcessStub.stderr = <Readable>new EventEmitter();
      cliProcessStub.kill = () => {};
      spawnStub = sandbox.stub(childProcess, 'spawn').returns(cliProcessStub);
      getCLIPathStub = sinon.stub(StripeClient, 'detectInstallation').resolves('path/to/stripe');
    });

    teardown(() => {
      spawnStub.restore();
      getCLIPathStub.restore();
    });

    test('spawns a child process with stripe logs tail', async () => {
      const stripeClient = getStripeClient();
      sandbox.stub(stripeClient, 'checkCLIVersion');
      sandbox.stub(stripeClient, 'isAuthenticated').resolves(true);
      const stripeLogsTailProcess = await stripeClient.getOrCreateCLIProcess(CLICommand.LogsTail);
      assert.strictEqual(spawnStub.callCount, 1);
      assert.deepStrictEqual(spawnStub.args[0], ['path/to/stripe', ['logs', 'tail']]);
      assert.ok(stripeLogsTailProcess);
    });

    test('reuses existing stripe process if it already exists', async () => {
      const stripeClient = getStripeClient();
      sandbox.stub(stripeClient, 'checkCLIVersion');
      sandbox.stub(stripeClient, 'isAuthenticated').resolves(true);
      const stripeLogsTailProcess = await stripeClient.getOrCreateCLIProcess(CLICommand.LogsTail);
      const stripeLogsTailProcess2 = await stripeClient.getOrCreateCLIProcess(CLICommand.LogsTail);
      assert.strictEqual(spawnStub.callCount, 1);
      assert.deepStrictEqual(spawnStub.args[0], ['path/to/stripe', ['logs', 'tail']]);
      assert.deepStrictEqual(stripeLogsTailProcess, stripeLogsTailProcess2);
    });

    test('passes flags to spawn', async () => {
      const flags = ['--format', 'JSON'];
      const stripeClient = getStripeClient();
      sandbox.stub(stripeClient, 'checkCLIVersion');
      sandbox.stub(stripeClient, 'isAuthenticated').resolves(true);
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
      const stripeClient = getStripeClient();
      sandbox.stub(stripeClient, 'checkCLIVersion');
      sandbox.stub(stripeClient, 'isAuthenticated').resolves(true);
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
          const stripeClient = getStripeClient();
          sandbox.stub(stripeClient, 'checkCLIVersion');
          sandbox.stub(stripeClient, 'isAuthenticated').resolves(true);
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
