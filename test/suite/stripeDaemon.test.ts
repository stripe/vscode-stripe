import * as assert from 'assert';
import * as sinon from 'sinon';
import {EventEmitter, Readable, Writable} from 'stream';
import {StripeCLIClient} from '../../src/rpc/commands_grpc_pb';
import {StripeClient} from '../stripeClient';
import {StripeDaemon} from '../../src/daemon/stripeDaemon';
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
    promptUpdateForDaemon: () => {},
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

    const module = setupProxies({execa: () => daemonProcessStub});
    return new module.StripeDaemon(stripeClient);
  };

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('setupClient', () => {
    test('returns a new client that connects to the daemon address', async () => {
      const stripeDaemon = getStripeDaemonWithExecaProxy(
        '{"host": "::1", "port": 12345}',
        <any>stripeClient,
      );

      const constructorStub = sandbox.stub();
      Object.setPrototypeOf(StripeCLIClient, constructorStub);

      await stripeDaemon.setupClient();
      assert.strictEqual(constructorStub.args[0][0], '[::1]:12345');
    });

    test('rejects with SyntaxError when stdout is invalid json', async () => {
      const stripeDaemon = getStripeDaemonWithExecaProxy(
        'unexpected string from stripe daemon',
        <any>stripeClient,
      );
      await assert.rejects(stripeDaemon.setupClient(), SyntaxError);
    });

    test('rejects with MalformedConfigError when stdout is valid json but not a daemon config', async () => {
      const stripeDaemon = getStripeDaemonWithExecaProxy('{"foo": "bar"}', <any>stripeClient);
      await assert.rejects(stripeDaemon.setupClient(), {
        name: 'MalformedConfigError',
        message: 'Received malformed config from stripe daemon: {"foo":"bar"}',
      });
    });

    test('rejects with NoDaemonCommandError when daemon command does not exist', async () => {
      const stripeDaemon = getStripeDaemonWithExecaProxy(
        'Unknown command "daemon" for "stripe".',
        <any>stripeClient,
      );
      await assert.rejects(stripeDaemon.setupClient(), {
        name: 'NoDaemonCommandError',
        message: 'Daemon is not available with this CLI version',
      });
    });
  });
});
