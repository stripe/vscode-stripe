// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var events_resend_pb = require('./events_resend_pb.js');
var listen_pb = require('./listen_pb.js');
var login_pb = require('./login_pb.js');
var login_status_pb = require('./login_status_pb.js');
var logs_tail_pb = require('./logs_tail_pb.js');
var sample_configs_pb = require('./sample_configs_pb.js');
var sample_create_pb = require('./sample_create_pb.js');
var samples_list_pb = require('./samples_list_pb.js');
var trigger_pb = require('./trigger_pb.js');
var triggers_list_pb = require('./triggers_list_pb.js');
var version_pb = require('./version_pb.js');

function serialize_rpc_EventsResendRequest(arg) {
  if (!(arg instanceof events_resend_pb.EventsResendRequest)) {
    throw new Error('Expected argument of type rpc.EventsResendRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_rpc_EventsResendRequest(buffer_arg) {
  return events_resend_pb.EventsResendRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_rpc_EventsResendResponse(arg) {
  if (!(arg instanceof events_resend_pb.EventsResendResponse)) {
    throw new Error('Expected argument of type rpc.EventsResendResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_rpc_EventsResendResponse(buffer_arg) {
  return events_resend_pb.EventsResendResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_rpc_ListenRequest(arg) {
  if (!(arg instanceof listen_pb.ListenRequest)) {
    throw new Error('Expected argument of type rpc.ListenRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_rpc_ListenRequest(buffer_arg) {
  return listen_pb.ListenRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_rpc_ListenResponse(arg) {
  if (!(arg instanceof listen_pb.ListenResponse)) {
    throw new Error('Expected argument of type rpc.ListenResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_rpc_ListenResponse(buffer_arg) {
  return listen_pb.ListenResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_rpc_LoginRequest(arg) {
  if (!(arg instanceof login_pb.LoginRequest)) {
    throw new Error('Expected argument of type rpc.LoginRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_rpc_LoginRequest(buffer_arg) {
  return login_pb.LoginRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_rpc_LoginResponse(arg) {
  if (!(arg instanceof login_pb.LoginResponse)) {
    throw new Error('Expected argument of type rpc.LoginResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_rpc_LoginResponse(buffer_arg) {
  return login_pb.LoginResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_rpc_LoginStatusRequest(arg) {
  if (!(arg instanceof login_status_pb.LoginStatusRequest)) {
    throw new Error('Expected argument of type rpc.LoginStatusRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_rpc_LoginStatusRequest(buffer_arg) {
  return login_status_pb.LoginStatusRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_rpc_LoginStatusResponse(arg) {
  if (!(arg instanceof login_status_pb.LoginStatusResponse)) {
    throw new Error('Expected argument of type rpc.LoginStatusResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_rpc_LoginStatusResponse(buffer_arg) {
  return login_status_pb.LoginStatusResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_rpc_LogsTailRequest(arg) {
  if (!(arg instanceof logs_tail_pb.LogsTailRequest)) {
    throw new Error('Expected argument of type rpc.LogsTailRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_rpc_LogsTailRequest(buffer_arg) {
  return logs_tail_pb.LogsTailRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_rpc_LogsTailResponse(arg) {
  if (!(arg instanceof logs_tail_pb.LogsTailResponse)) {
    throw new Error('Expected argument of type rpc.LogsTailResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_rpc_LogsTailResponse(buffer_arg) {
  return logs_tail_pb.LogsTailResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_rpc_SampleConfigsRequest(arg) {
  if (!(arg instanceof sample_configs_pb.SampleConfigsRequest)) {
    throw new Error('Expected argument of type rpc.SampleConfigsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_rpc_SampleConfigsRequest(buffer_arg) {
  return sample_configs_pb.SampleConfigsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_rpc_SampleConfigsResponse(arg) {
  if (!(arg instanceof sample_configs_pb.SampleConfigsResponse)) {
    throw new Error('Expected argument of type rpc.SampleConfigsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_rpc_SampleConfigsResponse(buffer_arg) {
  return sample_configs_pb.SampleConfigsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_rpc_SampleCreateRequest(arg) {
  if (!(arg instanceof sample_create_pb.SampleCreateRequest)) {
    throw new Error('Expected argument of type rpc.SampleCreateRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_rpc_SampleCreateRequest(buffer_arg) {
  return sample_create_pb.SampleCreateRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_rpc_SampleCreateResponse(arg) {
  if (!(arg instanceof sample_create_pb.SampleCreateResponse)) {
    throw new Error('Expected argument of type rpc.SampleCreateResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_rpc_SampleCreateResponse(buffer_arg) {
  return sample_create_pb.SampleCreateResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_rpc_SamplesListRequest(arg) {
  if (!(arg instanceof samples_list_pb.SamplesListRequest)) {
    throw new Error('Expected argument of type rpc.SamplesListRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_rpc_SamplesListRequest(buffer_arg) {
  return samples_list_pb.SamplesListRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_rpc_SamplesListResponse(arg) {
  if (!(arg instanceof samples_list_pb.SamplesListResponse)) {
    throw new Error('Expected argument of type rpc.SamplesListResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_rpc_SamplesListResponse(buffer_arg) {
  return samples_list_pb.SamplesListResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_rpc_TriggerRequest(arg) {
  if (!(arg instanceof trigger_pb.TriggerRequest)) {
    throw new Error('Expected argument of type rpc.TriggerRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_rpc_TriggerRequest(buffer_arg) {
  return trigger_pb.TriggerRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_rpc_TriggerResponse(arg) {
  if (!(arg instanceof trigger_pb.TriggerResponse)) {
    throw new Error('Expected argument of type rpc.TriggerResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_rpc_TriggerResponse(buffer_arg) {
  return trigger_pb.TriggerResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_rpc_TriggersListRequest(arg) {
  if (!(arg instanceof triggers_list_pb.TriggersListRequest)) {
    throw new Error('Expected argument of type rpc.TriggersListRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_rpc_TriggersListRequest(buffer_arg) {
  return triggers_list_pb.TriggersListRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_rpc_TriggersListResponse(arg) {
  if (!(arg instanceof triggers_list_pb.TriggersListResponse)) {
    throw new Error('Expected argument of type rpc.TriggersListResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_rpc_TriggersListResponse(buffer_arg) {
  return triggers_list_pb.TriggersListResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_rpc_VersionRequest(arg) {
  if (!(arg instanceof version_pb.VersionRequest)) {
    throw new Error('Expected argument of type rpc.VersionRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_rpc_VersionRequest(buffer_arg) {
  return version_pb.VersionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_rpc_VersionResponse(arg) {
  if (!(arg instanceof version_pb.VersionResponse)) {
    throw new Error('Expected argument of type rpc.VersionResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_rpc_VersionResponse(buffer_arg) {
  return version_pb.VersionResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var StripeCLIService = exports.StripeCLIService = {
  // Resend an event given an event ID. Like `stripe events resend`.
eventsResend: {
    path: '/rpc.StripeCLI/EventsResend',
    requestStream: false,
    responseStream: false,
    requestType: events_resend_pb.EventsResendRequest,
    responseType: events_resend_pb.EventsResendResponse,
    requestSerialize: serialize_rpc_EventsResendRequest,
    requestDeserialize: deserialize_rpc_EventsResendRequest,
    responseSerialize: serialize_rpc_EventsResendResponse,
    responseDeserialize: deserialize_rpc_EventsResendResponse,
  },
  // Receive webhook events from the Stripe API to your local machine. Like `stripe listen`.
listen: {
    path: '/rpc.StripeCLI/Listen',
    requestStream: false,
    responseStream: true,
    requestType: listen_pb.ListenRequest,
    responseType: listen_pb.ListenResponse,
    requestSerialize: serialize_rpc_ListenRequest,
    requestDeserialize: deserialize_rpc_ListenRequest,
    responseSerialize: serialize_rpc_ListenResponse,
    responseDeserialize: deserialize_rpc_ListenResponse,
  },
  // Get a link to log in to the Stripe CLI. The client will have to open the browser to complete
// the login. Use `LoginStatus` after this method to wait for success. Like `stripe login`.
login: {
    path: '/rpc.StripeCLI/Login',
    requestStream: false,
    responseStream: false,
    requestType: login_pb.LoginRequest,
    responseType: login_pb.LoginResponse,
    requestSerialize: serialize_rpc_LoginRequest,
    requestDeserialize: deserialize_rpc_LoginRequest,
    responseSerialize: serialize_rpc_LoginResponse,
    responseDeserialize: deserialize_rpc_LoginResponse,
  },
  // Successfully returns when login has succeeded, or returns an error if login has failed or timed
// out. Use this method after `Login` to check for success.
loginStatus: {
    path: '/rpc.StripeCLI/LoginStatus',
    requestStream: false,
    responseStream: false,
    requestType: login_status_pb.LoginStatusRequest,
    responseType: login_status_pb.LoginStatusResponse,
    requestSerialize: serialize_rpc_LoginStatusRequest,
    requestDeserialize: deserialize_rpc_LoginStatusRequest,
    responseSerialize: serialize_rpc_LoginStatusResponse,
    responseDeserialize: deserialize_rpc_LoginStatusResponse,
  },
  // Get a realtime stream of API logs. Like `stripe logs tail`.
logsTail: {
    path: '/rpc.StripeCLI/LogsTail',
    requestStream: false,
    responseStream: true,
    requestType: logs_tail_pb.LogsTailRequest,
    responseType: logs_tail_pb.LogsTailResponse,
    requestSerialize: serialize_rpc_LogsTailRequest,
    requestDeserialize: deserialize_rpc_LogsTailRequest,
    responseSerialize: serialize_rpc_LogsTailResponse,
    responseDeserialize: deserialize_rpc_LogsTailResponse,
  },
  // Get a list of available configs for a given Stripe sample.
sampleConfigs: {
    path: '/rpc.StripeCLI/SampleConfigs',
    requestStream: false,
    responseStream: false,
    requestType: sample_configs_pb.SampleConfigsRequest,
    responseType: sample_configs_pb.SampleConfigsResponse,
    requestSerialize: serialize_rpc_SampleConfigsRequest,
    requestDeserialize: deserialize_rpc_SampleConfigsRequest,
    responseSerialize: serialize_rpc_SampleConfigsResponse,
    responseDeserialize: deserialize_rpc_SampleConfigsResponse,
  },
  // Clone a Stripe sample. Like `stripe samples create`.
sampleCreate: {
    path: '/rpc.StripeCLI/SampleCreate',
    requestStream: false,
    responseStream: false,
    requestType: sample_create_pb.SampleCreateRequest,
    responseType: sample_create_pb.SampleCreateResponse,
    requestSerialize: serialize_rpc_SampleCreateRequest,
    requestDeserialize: deserialize_rpc_SampleCreateRequest,
    responseSerialize: serialize_rpc_SampleCreateResponse,
    responseDeserialize: deserialize_rpc_SampleCreateResponse,
  },
  // Get a list of available Stripe samples. Like `stripe samples list`.
samplesList: {
    path: '/rpc.StripeCLI/SamplesList',
    requestStream: false,
    responseStream: false,
    requestType: samples_list_pb.SamplesListRequest,
    responseType: samples_list_pb.SamplesListResponse,
    requestSerialize: serialize_rpc_SamplesListRequest,
    requestDeserialize: deserialize_rpc_SamplesListRequest,
    responseSerialize: serialize_rpc_SamplesListResponse,
    responseDeserialize: deserialize_rpc_SamplesListResponse,
  },
  // Trigger a webhook event. Like `stripe trigger`.
trigger: {
    path: '/rpc.StripeCLI/Trigger',
    requestStream: false,
    responseStream: false,
    requestType: trigger_pb.TriggerRequest,
    responseType: trigger_pb.TriggerResponse,
    requestSerialize: serialize_rpc_TriggerRequest,
    requestDeserialize: deserialize_rpc_TriggerRequest,
    responseSerialize: serialize_rpc_TriggerResponse,
    responseDeserialize: deserialize_rpc_TriggerResponse,
  },
  // Get a list of supported events for `Trigger`.
triggersList: {
    path: '/rpc.StripeCLI/TriggersList',
    requestStream: false,
    responseStream: false,
    requestType: triggers_list_pb.TriggersListRequest,
    responseType: triggers_list_pb.TriggersListResponse,
    requestSerialize: serialize_rpc_TriggersListRequest,
    requestDeserialize: deserialize_rpc_TriggersListRequest,
    responseSerialize: serialize_rpc_TriggersListResponse,
    responseDeserialize: deserialize_rpc_TriggersListResponse,
  },
  // Get the version of the Stripe CLI. Like `stripe version`.
version: {
    path: '/rpc.StripeCLI/Version',
    requestStream: false,
    responseStream: false,
    requestType: version_pb.VersionRequest,
    responseType: version_pb.VersionResponse,
    requestSerialize: serialize_rpc_VersionRequest,
    requestDeserialize: deserialize_rpc_VersionRequest,
    responseSerialize: serialize_rpc_VersionResponse,
    responseDeserialize: deserialize_rpc_VersionResponse,
  },
};

exports.StripeCLIClient = grpc.makeGenericClientConstructor(StripeCLIService);
