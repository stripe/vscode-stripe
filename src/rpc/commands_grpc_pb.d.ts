// GENERATED CODE -- DO NOT EDIT!

// package: rpc
// file: commands.proto

import * as commands_pb from "./commands_pb";
import * as events_resend_pb from "./events_resend_pb";
import * as fixtures_pb from "./fixtures_pb";
import * as listen_pb from "./listen_pb";
import * as login_pb from "./login_pb";
import * as login_status_pb from "./login_status_pb";
import * as logs_tail_pb from "./logs_tail_pb";
import * as sample_configs_pb from "./sample_configs_pb";
import * as sample_create_pb from "./sample_create_pb";
import * as samples_list_pb from "./samples_list_pb";
import * as trigger_pb from "./trigger_pb";
import * as triggers_list_pb from "./triggers_list_pb";
import * as version_pb from "./version_pb";
import * as webhook_endpoint_create_pb from "./webhook_endpoint_create_pb";
import * as webhook_endpoints_list_pb from "./webhook_endpoints_list_pb";
import * as grpc from "@grpc/grpc-js";

interface IStripeCLIService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
  eventsResend: grpc.MethodDefinition<events_resend_pb.EventsResendRequest, events_resend_pb.EventsResendResponse>;
  fixture: grpc.MethodDefinition<fixtures_pb.FixtureRequest, fixtures_pb.FixtureResponse>;
  listen: grpc.MethodDefinition<listen_pb.ListenRequest, listen_pb.ListenResponse>;
  login: grpc.MethodDefinition<login_pb.LoginRequest, login_pb.LoginResponse>;
  loginStatus: grpc.MethodDefinition<login_status_pb.LoginStatusRequest, login_status_pb.LoginStatusResponse>;
  logsTail: grpc.MethodDefinition<logs_tail_pb.LogsTailRequest, logs_tail_pb.LogsTailResponse>;
  sampleConfigs: grpc.MethodDefinition<sample_configs_pb.SampleConfigsRequest, sample_configs_pb.SampleConfigsResponse>;
  sampleCreate: grpc.MethodDefinition<sample_create_pb.SampleCreateRequest, sample_create_pb.SampleCreateResponse>;
  samplesList: grpc.MethodDefinition<samples_list_pb.SamplesListRequest, samples_list_pb.SamplesListResponse>;
  trigger: grpc.MethodDefinition<trigger_pb.TriggerRequest, trigger_pb.TriggerResponse>;
  triggersList: grpc.MethodDefinition<triggers_list_pb.TriggersListRequest, triggers_list_pb.TriggersListResponse>;
  version: grpc.MethodDefinition<version_pb.VersionRequest, version_pb.VersionResponse>;
  webhookEndpointCreate: grpc.MethodDefinition<webhook_endpoint_create_pb.WebhookEndpointCreateRequest, webhook_endpoint_create_pb.WebhookEndpointCreateResponse>;
  webhookEndpointsList: grpc.MethodDefinition<webhook_endpoints_list_pb.WebhookEndpointsListRequest, webhook_endpoints_list_pb.WebhookEndpointsListResponse>;
}

export const StripeCLIService: IStripeCLIService;

export interface IStripeCLIServer extends grpc.UntypedServiceImplementation {
  eventsResend: grpc.handleUnaryCall<events_resend_pb.EventsResendRequest, events_resend_pb.EventsResendResponse>;
  fixture: grpc.handleUnaryCall<fixtures_pb.FixtureRequest, fixtures_pb.FixtureResponse>;
  listen: grpc.handleServerStreamingCall<listen_pb.ListenRequest, listen_pb.ListenResponse>;
  login: grpc.handleUnaryCall<login_pb.LoginRequest, login_pb.LoginResponse>;
  loginStatus: grpc.handleUnaryCall<login_status_pb.LoginStatusRequest, login_status_pb.LoginStatusResponse>;
  logsTail: grpc.handleServerStreamingCall<logs_tail_pb.LogsTailRequest, logs_tail_pb.LogsTailResponse>;
  sampleConfigs: grpc.handleUnaryCall<sample_configs_pb.SampleConfigsRequest, sample_configs_pb.SampleConfigsResponse>;
  sampleCreate: grpc.handleUnaryCall<sample_create_pb.SampleCreateRequest, sample_create_pb.SampleCreateResponse>;
  samplesList: grpc.handleUnaryCall<samples_list_pb.SamplesListRequest, samples_list_pb.SamplesListResponse>;
  trigger: grpc.handleUnaryCall<trigger_pb.TriggerRequest, trigger_pb.TriggerResponse>;
  triggersList: grpc.handleUnaryCall<triggers_list_pb.TriggersListRequest, triggers_list_pb.TriggersListResponse>;
  version: grpc.handleUnaryCall<version_pb.VersionRequest, version_pb.VersionResponse>;
  webhookEndpointCreate: grpc.handleUnaryCall<webhook_endpoint_create_pb.WebhookEndpointCreateRequest, webhook_endpoint_create_pb.WebhookEndpointCreateResponse>;
  webhookEndpointsList: grpc.handleUnaryCall<webhook_endpoints_list_pb.WebhookEndpointsListRequest, webhook_endpoints_list_pb.WebhookEndpointsListResponse>;
}

export class StripeCLIClient extends grpc.Client {
  constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
  eventsResend(argument: events_resend_pb.EventsResendRequest, callback: grpc.requestCallback<events_resend_pb.EventsResendResponse>): grpc.ClientUnaryCall;
  eventsResend(argument: events_resend_pb.EventsResendRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<events_resend_pb.EventsResendResponse>): grpc.ClientUnaryCall;
  eventsResend(argument: events_resend_pb.EventsResendRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<events_resend_pb.EventsResendResponse>): grpc.ClientUnaryCall;
  fixture(argument: fixtures_pb.FixtureRequest, callback: grpc.requestCallback<fixtures_pb.FixtureResponse>): grpc.ClientUnaryCall;
  fixture(argument: fixtures_pb.FixtureRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<fixtures_pb.FixtureResponse>): grpc.ClientUnaryCall;
  fixture(argument: fixtures_pb.FixtureRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<fixtures_pb.FixtureResponse>): grpc.ClientUnaryCall;
  listen(argument: listen_pb.ListenRequest, metadataOrOptions?: grpc.Metadata | grpc.CallOptions | null): grpc.ClientReadableStream<listen_pb.ListenResponse>;
  listen(argument: listen_pb.ListenRequest, metadata?: grpc.Metadata | null, options?: grpc.CallOptions | null): grpc.ClientReadableStream<listen_pb.ListenResponse>;
  login(argument: login_pb.LoginRequest, callback: grpc.requestCallback<login_pb.LoginResponse>): grpc.ClientUnaryCall;
  login(argument: login_pb.LoginRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<login_pb.LoginResponse>): grpc.ClientUnaryCall;
  login(argument: login_pb.LoginRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<login_pb.LoginResponse>): grpc.ClientUnaryCall;
  loginStatus(argument: login_status_pb.LoginStatusRequest, callback: grpc.requestCallback<login_status_pb.LoginStatusResponse>): grpc.ClientUnaryCall;
  loginStatus(argument: login_status_pb.LoginStatusRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<login_status_pb.LoginStatusResponse>): grpc.ClientUnaryCall;
  loginStatus(argument: login_status_pb.LoginStatusRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<login_status_pb.LoginStatusResponse>): grpc.ClientUnaryCall;
  logsTail(argument: logs_tail_pb.LogsTailRequest, metadataOrOptions?: grpc.Metadata | grpc.CallOptions | null): grpc.ClientReadableStream<logs_tail_pb.LogsTailResponse>;
  logsTail(argument: logs_tail_pb.LogsTailRequest, metadata?: grpc.Metadata | null, options?: grpc.CallOptions | null): grpc.ClientReadableStream<logs_tail_pb.LogsTailResponse>;
  sampleConfigs(argument: sample_configs_pb.SampleConfigsRequest, callback: grpc.requestCallback<sample_configs_pb.SampleConfigsResponse>): grpc.ClientUnaryCall;
  sampleConfigs(argument: sample_configs_pb.SampleConfigsRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<sample_configs_pb.SampleConfigsResponse>): grpc.ClientUnaryCall;
  sampleConfigs(argument: sample_configs_pb.SampleConfigsRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<sample_configs_pb.SampleConfigsResponse>): grpc.ClientUnaryCall;
  sampleCreate(argument: sample_create_pb.SampleCreateRequest, callback: grpc.requestCallback<sample_create_pb.SampleCreateResponse>): grpc.ClientUnaryCall;
  sampleCreate(argument: sample_create_pb.SampleCreateRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<sample_create_pb.SampleCreateResponse>): grpc.ClientUnaryCall;
  sampleCreate(argument: sample_create_pb.SampleCreateRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<sample_create_pb.SampleCreateResponse>): grpc.ClientUnaryCall;
  samplesList(argument: samples_list_pb.SamplesListRequest, callback: grpc.requestCallback<samples_list_pb.SamplesListResponse>): grpc.ClientUnaryCall;
  samplesList(argument: samples_list_pb.SamplesListRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<samples_list_pb.SamplesListResponse>): grpc.ClientUnaryCall;
  samplesList(argument: samples_list_pb.SamplesListRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<samples_list_pb.SamplesListResponse>): grpc.ClientUnaryCall;
  trigger(argument: trigger_pb.TriggerRequest, callback: grpc.requestCallback<trigger_pb.TriggerResponse>): grpc.ClientUnaryCall;
  trigger(argument: trigger_pb.TriggerRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<trigger_pb.TriggerResponse>): grpc.ClientUnaryCall;
  trigger(argument: trigger_pb.TriggerRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<trigger_pb.TriggerResponse>): grpc.ClientUnaryCall;
  triggersList(argument: triggers_list_pb.TriggersListRequest, callback: grpc.requestCallback<triggers_list_pb.TriggersListResponse>): grpc.ClientUnaryCall;
  triggersList(argument: triggers_list_pb.TriggersListRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<triggers_list_pb.TriggersListResponse>): grpc.ClientUnaryCall;
  triggersList(argument: triggers_list_pb.TriggersListRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<triggers_list_pb.TriggersListResponse>): grpc.ClientUnaryCall;
  version(argument: version_pb.VersionRequest, callback: grpc.requestCallback<version_pb.VersionResponse>): grpc.ClientUnaryCall;
  version(argument: version_pb.VersionRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<version_pb.VersionResponse>): grpc.ClientUnaryCall;
  version(argument: version_pb.VersionRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<version_pb.VersionResponse>): grpc.ClientUnaryCall;
  webhookEndpointCreate(argument: webhook_endpoint_create_pb.WebhookEndpointCreateRequest, callback: grpc.requestCallback<webhook_endpoint_create_pb.WebhookEndpointCreateResponse>): grpc.ClientUnaryCall;
  webhookEndpointCreate(argument: webhook_endpoint_create_pb.WebhookEndpointCreateRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<webhook_endpoint_create_pb.WebhookEndpointCreateResponse>): grpc.ClientUnaryCall;
  webhookEndpointCreate(argument: webhook_endpoint_create_pb.WebhookEndpointCreateRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<webhook_endpoint_create_pb.WebhookEndpointCreateResponse>): grpc.ClientUnaryCall;
  webhookEndpointsList(argument: webhook_endpoints_list_pb.WebhookEndpointsListRequest, callback: grpc.requestCallback<webhook_endpoints_list_pb.WebhookEndpointsListResponse>): grpc.ClientUnaryCall;
  webhookEndpointsList(argument: webhook_endpoints_list_pb.WebhookEndpointsListRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<webhook_endpoints_list_pb.WebhookEndpointsListResponse>): grpc.ClientUnaryCall;
  webhookEndpointsList(argument: webhook_endpoints_list_pb.WebhookEndpointsListRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<webhook_endpoints_list_pb.WebhookEndpointsListResponse>): grpc.ClientUnaryCall;
}
