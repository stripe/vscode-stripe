import * as grpc from '@grpc/grpc-js';
import {StripeCLIClient} from './rpc/commands_grpc_pb';

// Required header for authenticating requests.
const requiredHeader = 'sec-x-stripe-cli';

export function createStripeCLIClient(): StripeCLIClient {
  // Intercept outgoing messages to the server to add authentication.
  const authOutboundInterceptor: grpc.Interceptor = (options, nextCall) => {
    const requester = new grpc.RequesterBuilder()
      .withStart((metadata, listener, next) => {
        metadata.add(requiredHeader, '1'); // Value doesn't matter, only presence of header
        next(metadata, listener);
      })
      .build();

    return new grpc.InterceptingCall(nextCall(options), requester);
  };

  // Intercept incoming messages from the server to handle common errors.
  const errorInboundInterceptor: grpc.Interceptor = (options, nextCall) => {
    const listener = new grpc.ListenerBuilder()
      .withOnReceiveStatus((status, next) => {
        if (status.code === grpc.status.UNAVAILABLE) {
          console.error('THE SERVER IS NOT AVAILABLE. START THE SERVER.');
        }
        next(status);
      })
      .build();

    const requester = new grpc.RequesterBuilder()
      .withStart((metadata, _, next) => {
        next(metadata, listener);
      })
      .build();

    return new grpc.InterceptingCall(nextCall(options), requester);
  };

  const serverAddress = getAddress();

  return new StripeCLIClient(serverAddress, grpc.credentials.createInsecure(), {
    interceptors: [authOutboundInterceptor, errorInboundInterceptor],
  });
}

function getAddress(): string {
  // eslint-disable-next-line no-warning-comments
  // TODO: should run `stripe daemon` and read stderr to get the address.
  return '127.0.0.1:13113';
}
