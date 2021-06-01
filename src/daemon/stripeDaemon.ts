import * as grpc from '@grpc/grpc-js';
import * as vscode from 'vscode';
import {DaemonConfig, MalformedConfigError, NoDaemonCommandError, isDaemonConfig} from './types';
import {authOutboundInterceptor, errorInboundInterceptor} from './interceptors';
import {LineStream} from 'byline';
import {StripeCLIClient} from '../rpc/commands_grpc_pb';
import {StripeClient} from '../stripeClient';
import {Writable} from 'stream';
import execa from 'execa';

/**
 * StripeDaemon handles starting and restarting the Stripe daemon gRPC server and creating the
 * client connection.
 */
export class StripeDaemon {
  private stripeClient: StripeClient;

  private config?: DaemonConfig;
  private daemonProcess?: execa.ExecaChildProcess;
  private stripeCLIClient?: StripeCLIClient;

  constructor(stripeClient: StripeClient) {
    this.stripeClient = stripeClient;

    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration('stripe.cliInstallPath')) {
        try {
          await this.restartDaemon();
        } catch (e) {
          console.error(e);
        }
      }
    });
  }

  /**
   * Objects that depend on StripeDaemon should always call this method to retrieve the client. It
   * handles all setup, including throwing a `NoDaemonCommandError` when the daemon command doesn't
   * exist.
   *
   * Get a gRPC client connected to a Stripe daemon gRPC server. If the server doesn't already
   * exist, start a new one and return a new client.
   */
  setupClient = async (): Promise<StripeCLIClient> => {
    // If there is no daemon process or config, restart everything and return a new client
    if (!this.config || !this.daemonProcess) {
      this.stripeCLIClient?.close();
      this.config = await this.restartDaemon();
      const address = `[${this.config.host}]:${this.config.port}`;
      return new StripeCLIClient(address, grpc.credentials.createInsecure(), {
        interceptors: [authOutboundInterceptor, errorInboundInterceptor],
      });
    }

    // If the daemon exists but there is no client, return a new client
    if (!this.stripeCLIClient) {
      const address = `[${this.config.host}]:${this.config.port}`;
      return new StripeCLIClient(address, grpc.credentials.createInsecure(), {
        interceptors: [authOutboundInterceptor, errorInboundInterceptor],
      });
    }

    // Daemon and client exist, so return the client
    return this.stripeCLIClient;
  };

  /**
   * Start the Stripe daemon process and parse its stdout to get the gRPC server config. Throws
   * MalformedConfigError, NoDaemonCommandError, or SyntaxError if the server can't be started.
   */
  private startDaemon = async (port?: number): Promise<DaemonConfig> => {
    const flags = port ? ['--port', port.toString()] : [];

    const cliPath = await this.stripeClient.getCLIPath();
    if (!cliPath) {
      throw new Error('Failed to get CLI path');
    }

    const daemonProcess = execa(cliPath, ['daemon', ...flags]);
    this.daemonProcess = daemonProcess;

    daemonProcess.on('exit', () => {
      this.config = undefined;
      this.daemonProcess = undefined;
    });

    return new Promise<DaemonConfig>((resolve, reject) => {
      const write = (
        chunk: string,
        encoding: string,
        callback: (error?: Error | null | undefined) => void,
      ) => {
        if (chunk.startsWith('Unknown command "daemon"')) {
          return reject(new NoDaemonCommandError());
        }
        try {
          const object = JSON.parse(chunk);
          if (isDaemonConfig(object)) {
            resolve(object);
          } else {
            reject(new MalformedConfigError(object));
          }
        } catch (e) {
          reject(e);
        } finally {
          // We can stop listening after reading the config.
          daemonProcess.stdout.removeAllListeners();
          callback();
        }
      };

      const stdoutStream = new Writable({write, decodeStrings: false});
      daemonProcess.stdout.setEncoding('utf8').pipe(new LineStream()).pipe(stdoutStream);
    });
  };

  private restartDaemon = async (): Promise<DaemonConfig> => {
    this.daemonProcess?.kill();
    this.config = await this.startDaemon(this.config?.port); // restart on same port
    return this.config;
  };
}
