/**
 * DaemonConfig is the config of the gRPC server from `stripe daemon`.
 */
export type DaemonConfig = {
  host: string;
  port: number;
};

export const isDaemonConfig = (object: any): object is DaemonConfig => {
  if (!object) {
    return false;
  }
  const possibleDaemonConfig = object as DaemonConfig;
  return (
    typeof possibleDaemonConfig.host === 'string' && typeof possibleDaemonConfig.port === 'number'
  );
};

/**
 * Config couldn't be parsed
 */
export class MalformedConfigError extends Error {
  constructor(object: any) {
    super();
    this.name = 'MalformedConfigError';
    this.message = `Received malformed config from stripe daemon: ${JSON.stringify(object)}`;
  }
}

/**
 * The daemon command doesn't exist in this CLI version.
 */
export class NoDaemonCommandError extends Error {
  constructor() {
    super();
    this.name = 'NoDaemonCommandError';
    this.message = 'Daemon is not available with this CLI version';
  }
}
