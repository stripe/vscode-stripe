import * as grpc from '@grpc/grpc-js';

// Required header for authenticating requests.
const REQUIRED_HEADER = 'sec-x-stripe-cli';

// Intercept outgoing messages to the server to add authentication.
export const authOutboundInterceptor: grpc.Interceptor = (options, nextCall) => {
  const requester: grpc.Requester = {
    start: (metadata, listener, next) => {
      metadata.add(REQUIRED_HEADER, '1'); // Value doesn't matter, only presence of header
      next(metadata, listener);
    },
  };

  return new grpc.InterceptingCall(nextCall(options), requester);
};

// Intercept incoming messages from the server to handle common errors.
export const errorInboundInterceptor: grpc.Interceptor = (options, nextCall) => {
  const listener: grpc.Listener = {
    onReceiveStatus: (status, next) => {
      if (status.code === grpc.status.UNAVAILABLE) {
        console.error('Server was not started for this request.');
      }
      next(status);
    },
  };

  const requester: grpc.Requester = {
    start: (metadata, _, next) => {
      next(metadata, listener);
    },
  };

  return new grpc.InterceptingCall(nextCall(options), requester);
};
