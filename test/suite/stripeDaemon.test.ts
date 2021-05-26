import * as assert from 'assert';
import * as sinon from 'sinon';
import {EventEmitter, Readable, Writable} from 'stream';
import {StripeClient} from '../stripeClient';
import {StripeDaemon} from '../../src//daemon/stripeDaemon';
import execa from 'execa';
import proxyquire from 'proxyquire';

const modulePath = '../../src/daemon/stripeDaemon';

// Helper functions
const setupProxies = (proxies: any) => proxyquire(modulePath, proxies);

suite('StripeDaemon', () => {
  let daemonProcessStub: execa.ExecaChildProcess;
  let sandbox: sinon.SinonSandbox;

  const stripeClient = <Partial<StripeClient>>{
    getCLIPath: () => Promise.resolve('/path/to/cli'),
  };

  // Get an instance of StripeDaemon with the mocked execa module
  const getStripeDaemonWithExecaProxy = (
    stdout: string,
    stripeClient: StripeClient,
  ): StripeDaemon => {
    daemonProcessStub = <execa.ExecaChildProcess<string>>new EventEmitter();
    daemonProcessStub.stdin = new Writable({write: () => {}});
    daemonProcessStub.stdout = new Readable({
      read() {
        this.push(stdout, 'utf8');
        this.push(null); // nothing left to read
      },
    });
    daemonProcessStub.stderr = new Readable({read: () => {}});
    daemonProcessStub.kill = () => {};

    // const execa = sandbox.stub().resolves(daemonProcessStub);
    const module = setupProxies({execa: () => daemonProcessStub});
    return new module.StripeDaemon(stripeClient);
  };

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('startDaemon', () => {
    test('reads config from stdout', async () => {
      const stripeDaemon = getStripeDaemonWithExecaProxy(
        '{"host": "::1", "port": 12345}',
        <any>stripeClient,
      );

      const config = await stripeDaemon.startDaemon();
      assert.strictEqual(config.host, '::1');
      assert.strictEqual(config.port, 12345);
    });

    test('restarts daemon on the same port when it dies', async () => {
      const stripeDaemon = getStripeDaemonWithExecaProxy(
        '{"host": "::1", "port": 12345}',
        <any>stripeClient,
      );

      const startDaemonSpy = sinon.spy(stripeDaemon, 'startDaemon');

      await stripeDaemon.startDaemon();

      daemonProcessStub.emit('exit');

      assert.deepStrictEqual(startDaemonSpy.secondCall.args, [12345]);
    });

    test('rejects with SyntaxError when stdout is invalid json', async () => {
      const stripeDaemon = getStripeDaemonWithExecaProxy(
        'unexpected string from stripe daemon',
        <any>stripeClient,
      );
      await assert.rejects(stripeDaemon.startDaemon(), SyntaxError);
    });

    test('rejects with MalformedConfigError when stdout is valid json but not a daemon config', async () => {
      const stripeDaemon = getStripeDaemonWithExecaProxy('{"foo": "bar"}', <any>stripeClient);
      await assert.rejects(stripeDaemon.startDaemon(), {
        name: 'MalformedConfigError',
        message: 'Received malformed config from stripe daemon: {"foo":"bar"}',
      });
    });

    test('rejects with NoDaemonCommandError when daemon command does not exist', async () => {
      const stripeDaemon = getStripeDaemonWithExecaProxy(
        'Unknown command "daemon" for "stripe".',
        <any>stripeClient,
      );
      await assert.rejects(stripeDaemon.startDaemon(), {
        name: 'NoDaemonCommandError',
        message: 'Daemon is not available with this CLI version',
      });
    });
  });
});
