// package: rpc
// file: commands.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as commands_pb from "./commands_pb";
import * as events_resend_pb from "./events_resend_pb";
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

interface IStripeCLIService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    eventsResend: IStripeCLIService_IEventsResend;
    listen: IStripeCLIService_IListen;
    login: IStripeCLIService_ILogin;
    loginStatus: IStripeCLIService_ILoginStatus;
    logsTail: IStripeCLIService_ILogsTail;
    sampleConfigs: IStripeCLIService_ISampleConfigs;
    sampleCreate: IStripeCLIService_ISampleCreate;
    samplesList: IStripeCLIService_ISamplesList;
    trigger: IStripeCLIService_ITrigger;
    triggersList: IStripeCLIService_ITriggersList;
    version: IStripeCLIService_IVersion;
}

interface IStripeCLIService_IEventsResend extends grpc.MethodDefinition<events_resend_pb.EventsResendRequest, events_resend_pb.EventsResendResponse> {
    path: "/rpc.StripeCLI/EventsResend";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<events_resend_pb.EventsResendRequest>;
    requestDeserialize: grpc.deserialize<events_resend_pb.EventsResendRequest>;
    responseSerialize: grpc.serialize<events_resend_pb.EventsResendResponse>;
    responseDeserialize: grpc.deserialize<events_resend_pb.EventsResendResponse>;
}
interface IStripeCLIService_IListen extends grpc.MethodDefinition<listen_pb.ListenRequest, listen_pb.ListenResponse> {
    path: "/rpc.StripeCLI/Listen";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<listen_pb.ListenRequest>;
    requestDeserialize: grpc.deserialize<listen_pb.ListenRequest>;
    responseSerialize: grpc.serialize<listen_pb.ListenResponse>;
    responseDeserialize: grpc.deserialize<listen_pb.ListenResponse>;
}
interface IStripeCLIService_ILogin extends grpc.MethodDefinition<login_pb.LoginRequest, login_pb.LoginResponse> {
    path: "/rpc.StripeCLI/Login";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<login_pb.LoginRequest>;
    requestDeserialize: grpc.deserialize<login_pb.LoginRequest>;
    responseSerialize: grpc.serialize<login_pb.LoginResponse>;
    responseDeserialize: grpc.deserialize<login_pb.LoginResponse>;
}
interface IStripeCLIService_ILoginStatus extends grpc.MethodDefinition<login_status_pb.LoginStatusRequest, login_status_pb.LoginStatusResponse> {
    path: "/rpc.StripeCLI/LoginStatus";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<login_status_pb.LoginStatusRequest>;
    requestDeserialize: grpc.deserialize<login_status_pb.LoginStatusRequest>;
    responseSerialize: grpc.serialize<login_status_pb.LoginStatusResponse>;
    responseDeserialize: grpc.deserialize<login_status_pb.LoginStatusResponse>;
}
interface IStripeCLIService_ILogsTail extends grpc.MethodDefinition<logs_tail_pb.LogsTailRequest, logs_tail_pb.LogsTailResponse> {
    path: "/rpc.StripeCLI/LogsTail";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<logs_tail_pb.LogsTailRequest>;
    requestDeserialize: grpc.deserialize<logs_tail_pb.LogsTailRequest>;
    responseSerialize: grpc.serialize<logs_tail_pb.LogsTailResponse>;
    responseDeserialize: grpc.deserialize<logs_tail_pb.LogsTailResponse>;
}
interface IStripeCLIService_ISampleConfigs extends grpc.MethodDefinition<sample_configs_pb.SampleConfigsRequest, sample_configs_pb.SampleConfigsResponse> {
    path: "/rpc.StripeCLI/SampleConfigs";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<sample_configs_pb.SampleConfigsRequest>;
    requestDeserialize: grpc.deserialize<sample_configs_pb.SampleConfigsRequest>;
    responseSerialize: grpc.serialize<sample_configs_pb.SampleConfigsResponse>;
    responseDeserialize: grpc.deserialize<sample_configs_pb.SampleConfigsResponse>;
}
interface IStripeCLIService_ISampleCreate extends grpc.MethodDefinition<sample_create_pb.SampleCreateRequest, sample_create_pb.SampleCreateResponse> {
    path: "/rpc.StripeCLI/SampleCreate";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<sample_create_pb.SampleCreateRequest>;
    requestDeserialize: grpc.deserialize<sample_create_pb.SampleCreateRequest>;
    responseSerialize: grpc.serialize<sample_create_pb.SampleCreateResponse>;
    responseDeserialize: grpc.deserialize<sample_create_pb.SampleCreateResponse>;
}
interface IStripeCLIService_ISamplesList extends grpc.MethodDefinition<samples_list_pb.SamplesListRequest, samples_list_pb.SamplesListResponse> {
    path: "/rpc.StripeCLI/SamplesList";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<samples_list_pb.SamplesListRequest>;
    requestDeserialize: grpc.deserialize<samples_list_pb.SamplesListRequest>;
    responseSerialize: grpc.serialize<samples_list_pb.SamplesListResponse>;
    responseDeserialize: grpc.deserialize<samples_list_pb.SamplesListResponse>;
}
interface IStripeCLIService_ITrigger extends grpc.MethodDefinition<trigger_pb.TriggerRequest, trigger_pb.TriggerResponse> {
    path: "/rpc.StripeCLI/Trigger";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<trigger_pb.TriggerRequest>;
    requestDeserialize: grpc.deserialize<trigger_pb.TriggerRequest>;
    responseSerialize: grpc.serialize<trigger_pb.TriggerResponse>;
    responseDeserialize: grpc.deserialize<trigger_pb.TriggerResponse>;
}
interface IStripeCLIService_ITriggersList extends grpc.MethodDefinition<triggers_list_pb.TriggersListRequest, triggers_list_pb.TriggersListResponse> {
    path: "/rpc.StripeCLI/TriggersList";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<triggers_list_pb.TriggersListRequest>;
    requestDeserialize: grpc.deserialize<triggers_list_pb.TriggersListRequest>;
    responseSerialize: grpc.serialize<triggers_list_pb.TriggersListResponse>;
    responseDeserialize: grpc.deserialize<triggers_list_pb.TriggersListResponse>;
}
interface IStripeCLIService_IVersion extends grpc.MethodDefinition<version_pb.VersionRequest, version_pb.VersionResponse> {
    path: "/rpc.StripeCLI/Version";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<version_pb.VersionRequest>;
    requestDeserialize: grpc.deserialize<version_pb.VersionRequest>;
    responseSerialize: grpc.serialize<version_pb.VersionResponse>;
    responseDeserialize: grpc.deserialize<version_pb.VersionResponse>;
}

export const StripeCLIService: IStripeCLIService;

export interface IStripeCLIServer {
    eventsResend: grpc.handleUnaryCall<events_resend_pb.EventsResendRequest, events_resend_pb.EventsResendResponse>;
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
}

export interface IStripeCLIClient {
    eventsResend(request: events_resend_pb.EventsResendRequest, callback: (error: grpc.ServiceError | null, response: events_resend_pb.EventsResendResponse) => void): grpc.ClientUnaryCall;
    eventsResend(request: events_resend_pb.EventsResendRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: events_resend_pb.EventsResendResponse) => void): grpc.ClientUnaryCall;
    eventsResend(request: events_resend_pb.EventsResendRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: events_resend_pb.EventsResendResponse) => void): grpc.ClientUnaryCall;
    listen(request: listen_pb.ListenRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<listen_pb.ListenResponse>;
    listen(request: listen_pb.ListenRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<listen_pb.ListenResponse>;
    login(request: login_pb.LoginRequest, callback: (error: grpc.ServiceError | null, response: login_pb.LoginResponse) => void): grpc.ClientUnaryCall;
    login(request: login_pb.LoginRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: login_pb.LoginResponse) => void): grpc.ClientUnaryCall;
    login(request: login_pb.LoginRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: login_pb.LoginResponse) => void): grpc.ClientUnaryCall;
    loginStatus(request: login_status_pb.LoginStatusRequest, callback: (error: grpc.ServiceError | null, response: login_status_pb.LoginStatusResponse) => void): grpc.ClientUnaryCall;
    loginStatus(request: login_status_pb.LoginStatusRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: login_status_pb.LoginStatusResponse) => void): grpc.ClientUnaryCall;
    loginStatus(request: login_status_pb.LoginStatusRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: login_status_pb.LoginStatusResponse) => void): grpc.ClientUnaryCall;
    logsTail(request: logs_tail_pb.LogsTailRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<logs_tail_pb.LogsTailResponse>;
    logsTail(request: logs_tail_pb.LogsTailRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<logs_tail_pb.LogsTailResponse>;
    sampleConfigs(request: sample_configs_pb.SampleConfigsRequest, callback: (error: grpc.ServiceError | null, response: sample_configs_pb.SampleConfigsResponse) => void): grpc.ClientUnaryCall;
    sampleConfigs(request: sample_configs_pb.SampleConfigsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: sample_configs_pb.SampleConfigsResponse) => void): grpc.ClientUnaryCall;
    sampleConfigs(request: sample_configs_pb.SampleConfigsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: sample_configs_pb.SampleConfigsResponse) => void): grpc.ClientUnaryCall;
    sampleCreate(request: sample_create_pb.SampleCreateRequest, callback: (error: grpc.ServiceError | null, response: sample_create_pb.SampleCreateResponse) => void): grpc.ClientUnaryCall;
    sampleCreate(request: sample_create_pb.SampleCreateRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: sample_create_pb.SampleCreateResponse) => void): grpc.ClientUnaryCall;
    sampleCreate(request: sample_create_pb.SampleCreateRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: sample_create_pb.SampleCreateResponse) => void): grpc.ClientUnaryCall;
    samplesList(request: samples_list_pb.SamplesListRequest, callback: (error: grpc.ServiceError | null, response: samples_list_pb.SamplesListResponse) => void): grpc.ClientUnaryCall;
    samplesList(request: samples_list_pb.SamplesListRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: samples_list_pb.SamplesListResponse) => void): grpc.ClientUnaryCall;
    samplesList(request: samples_list_pb.SamplesListRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: samples_list_pb.SamplesListResponse) => void): grpc.ClientUnaryCall;
    trigger(request: trigger_pb.TriggerRequest, callback: (error: grpc.ServiceError | null, response: trigger_pb.TriggerResponse) => void): grpc.ClientUnaryCall;
    trigger(request: trigger_pb.TriggerRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: trigger_pb.TriggerResponse) => void): grpc.ClientUnaryCall;
    trigger(request: trigger_pb.TriggerRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: trigger_pb.TriggerResponse) => void): grpc.ClientUnaryCall;
    triggersList(request: triggers_list_pb.TriggersListRequest, callback: (error: grpc.ServiceError | null, response: triggers_list_pb.TriggersListResponse) => void): grpc.ClientUnaryCall;
    triggersList(request: triggers_list_pb.TriggersListRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: triggers_list_pb.TriggersListResponse) => void): grpc.ClientUnaryCall;
    triggersList(request: triggers_list_pb.TriggersListRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: triggers_list_pb.TriggersListResponse) => void): grpc.ClientUnaryCall;
    version(request: version_pb.VersionRequest, callback: (error: grpc.ServiceError | null, response: version_pb.VersionResponse) => void): grpc.ClientUnaryCall;
    version(request: version_pb.VersionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: version_pb.VersionResponse) => void): grpc.ClientUnaryCall;
    version(request: version_pb.VersionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: version_pb.VersionResponse) => void): grpc.ClientUnaryCall;
}

export class StripeCLIClient extends grpc.Client implements IStripeCLIClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public eventsResend(request: events_resend_pb.EventsResendRequest, callback: (error: grpc.ServiceError | null, response: events_resend_pb.EventsResendResponse) => void): grpc.ClientUnaryCall;
    public eventsResend(request: events_resend_pb.EventsResendRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: events_resend_pb.EventsResendResponse) => void): grpc.ClientUnaryCall;
    public eventsResend(request: events_resend_pb.EventsResendRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: events_resend_pb.EventsResendResponse) => void): grpc.ClientUnaryCall;
    public listen(request: listen_pb.ListenRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<listen_pb.ListenResponse>;
    public listen(request: listen_pb.ListenRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<listen_pb.ListenResponse>;
    public login(request: login_pb.LoginRequest, callback: (error: grpc.ServiceError | null, response: login_pb.LoginResponse) => void): grpc.ClientUnaryCall;
    public login(request: login_pb.LoginRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: login_pb.LoginResponse) => void): grpc.ClientUnaryCall;
    public login(request: login_pb.LoginRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: login_pb.LoginResponse) => void): grpc.ClientUnaryCall;
    public loginStatus(request: login_status_pb.LoginStatusRequest, callback: (error: grpc.ServiceError | null, response: login_status_pb.LoginStatusResponse) => void): grpc.ClientUnaryCall;
    public loginStatus(request: login_status_pb.LoginStatusRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: login_status_pb.LoginStatusResponse) => void): grpc.ClientUnaryCall;
    public loginStatus(request: login_status_pb.LoginStatusRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: login_status_pb.LoginStatusResponse) => void): grpc.ClientUnaryCall;
    public logsTail(request: logs_tail_pb.LogsTailRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<logs_tail_pb.LogsTailResponse>;
    public logsTail(request: logs_tail_pb.LogsTailRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<logs_tail_pb.LogsTailResponse>;
    public sampleConfigs(request: sample_configs_pb.SampleConfigsRequest, callback: (error: grpc.ServiceError | null, response: sample_configs_pb.SampleConfigsResponse) => void): grpc.ClientUnaryCall;
    public sampleConfigs(request: sample_configs_pb.SampleConfigsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: sample_configs_pb.SampleConfigsResponse) => void): grpc.ClientUnaryCall;
    public sampleConfigs(request: sample_configs_pb.SampleConfigsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: sample_configs_pb.SampleConfigsResponse) => void): grpc.ClientUnaryCall;
    public sampleCreate(request: sample_create_pb.SampleCreateRequest, callback: (error: grpc.ServiceError | null, response: sample_create_pb.SampleCreateResponse) => void): grpc.ClientUnaryCall;
    public sampleCreate(request: sample_create_pb.SampleCreateRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: sample_create_pb.SampleCreateResponse) => void): grpc.ClientUnaryCall;
    public sampleCreate(request: sample_create_pb.SampleCreateRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: sample_create_pb.SampleCreateResponse) => void): grpc.ClientUnaryCall;
    public samplesList(request: samples_list_pb.SamplesListRequest, callback: (error: grpc.ServiceError | null, response: samples_list_pb.SamplesListResponse) => void): grpc.ClientUnaryCall;
    public samplesList(request: samples_list_pb.SamplesListRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: samples_list_pb.SamplesListResponse) => void): grpc.ClientUnaryCall;
    public samplesList(request: samples_list_pb.SamplesListRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: samples_list_pb.SamplesListResponse) => void): grpc.ClientUnaryCall;
    public trigger(request: trigger_pb.TriggerRequest, callback: (error: grpc.ServiceError | null, response: trigger_pb.TriggerResponse) => void): grpc.ClientUnaryCall;
    public trigger(request: trigger_pb.TriggerRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: trigger_pb.TriggerResponse) => void): grpc.ClientUnaryCall;
    public trigger(request: trigger_pb.TriggerRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: trigger_pb.TriggerResponse) => void): grpc.ClientUnaryCall;
    public triggersList(request: triggers_list_pb.TriggersListRequest, callback: (error: grpc.ServiceError | null, response: triggers_list_pb.TriggersListResponse) => void): grpc.ClientUnaryCall;
    public triggersList(request: triggers_list_pb.TriggersListRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: triggers_list_pb.TriggersListResponse) => void): grpc.ClientUnaryCall;
    public triggersList(request: triggers_list_pb.TriggersListRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: triggers_list_pb.TriggersListResponse) => void): grpc.ClientUnaryCall;
    public version(request: version_pb.VersionRequest, callback: (error: grpc.ServiceError | null, response: version_pb.VersionResponse) => void): grpc.ClientUnaryCall;
    public version(request: version_pb.VersionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: version_pb.VersionResponse) => void): grpc.ClientUnaryCall;
    public version(request: version_pb.VersionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: version_pb.VersionResponse) => void): grpc.ClientUnaryCall;
}
