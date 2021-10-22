// package: rpc
// file: logs_tail.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class LogsTailRequest extends jspb.Message { 
    clearFilterAccountsList(): void;
    getFilterAccountsList(): Array<LogsTailRequest.Account>;
    setFilterAccountsList(value: Array<LogsTailRequest.Account>): LogsTailRequest;
    addFilterAccounts(value: LogsTailRequest.Account, index?: number): LogsTailRequest.Account;
    clearFilterHttpMethodsList(): void;
    getFilterHttpMethodsList(): Array<LogsTailRequest.HttpMethod>;
    setFilterHttpMethodsList(value: Array<LogsTailRequest.HttpMethod>): LogsTailRequest;
    addFilterHttpMethods(value: LogsTailRequest.HttpMethod, index?: number): LogsTailRequest.HttpMethod;
    clearFilterIpAddressesList(): void;
    getFilterIpAddressesList(): Array<string>;
    setFilterIpAddressesList(value: Array<string>): LogsTailRequest;
    addFilterIpAddresses(value: string, index?: number): string;
    clearFilterRequestPathsList(): void;
    getFilterRequestPathsList(): Array<string>;
    setFilterRequestPathsList(value: Array<string>): LogsTailRequest;
    addFilterRequestPaths(value: string, index?: number): string;
    clearFilterRequestStatusesList(): void;
    getFilterRequestStatusesList(): Array<LogsTailRequest.RequestStatus>;
    setFilterRequestStatusesList(value: Array<LogsTailRequest.RequestStatus>): LogsTailRequest;
    addFilterRequestStatuses(value: LogsTailRequest.RequestStatus, index?: number): LogsTailRequest.RequestStatus;
    clearFilterSourcesList(): void;
    getFilterSourcesList(): Array<LogsTailRequest.Source>;
    setFilterSourcesList(value: Array<LogsTailRequest.Source>): LogsTailRequest;
    addFilterSources(value: LogsTailRequest.Source, index?: number): LogsTailRequest.Source;
    clearFilterStatusCodesList(): void;
    getFilterStatusCodesList(): Array<string>;
    setFilterStatusCodesList(value: Array<string>): LogsTailRequest;
    addFilterStatusCodes(value: string, index?: number): string;
    clearFilterStatusCodeTypesList(): void;
    getFilterStatusCodeTypesList(): Array<LogsTailRequest.StatusCodeType>;
    setFilterStatusCodeTypesList(value: Array<LogsTailRequest.StatusCodeType>): LogsTailRequest;
    addFilterStatusCodeTypes(value: LogsTailRequest.StatusCodeType, index?: number): LogsTailRequest.StatusCodeType;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LogsTailRequest.AsObject;
    static toObject(includeInstance: boolean, msg: LogsTailRequest): LogsTailRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LogsTailRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LogsTailRequest;
    static deserializeBinaryFromReader(message: LogsTailRequest, reader: jspb.BinaryReader): LogsTailRequest;
}

export namespace LogsTailRequest {
    export type AsObject = {
        filterAccountsList: Array<LogsTailRequest.Account>,
        filterHttpMethodsList: Array<LogsTailRequest.HttpMethod>,
        filterIpAddressesList: Array<string>,
        filterRequestPathsList: Array<string>,
        filterRequestStatusesList: Array<LogsTailRequest.RequestStatus>,
        filterSourcesList: Array<LogsTailRequest.Source>,
        filterStatusCodesList: Array<string>,
        filterStatusCodeTypesList: Array<LogsTailRequest.StatusCodeType>,
    }

    export enum Account {
    ACCOUNT_UNSPECIFIED = 0,
    ACCOUNT_CONNECT_IN = 1,
    ACCOUNT_CONNECT_OUT = 2,
    ACCOUNT_SELF = 3,
    }

    export enum HttpMethod {
    HTTP_METHOD_UNSPECIFIED = 0,
    HTTP_METHOD_GET = 1,
    HTTP_METHOD_POST = 2,
    HTTP_METHOD_DELETE = 3,
    }

    export enum RequestStatus {
    REQUEST_STATUS_UNSPECIFIED = 0,
    REQUEST_STATUS_SUCCEEDED = 1,
    REQUEST_STATUS_FAILED = 2,
    }

    export enum Source {
    SOURCE_UNSPECIFIED = 0,
    SOURCE_API = 1,
    SOURCE_DASHBOARD = 2,
    }

    export enum StatusCodeType {
    STATUS_CODE_TYPE_UNSPECIFIED = 0,
    STATUS_CODE_TYPE_2XX = 1,
    STATUS_CODE_TYPE_4XX = 2,
    STATUS_CODE_TYPE_5XX = 3,
    }

}

export class LogsTailResponse extends jspb.Message { 

    hasState(): boolean;
    clearState(): void;
    getState(): LogsTailResponse.State;
    setState(value: LogsTailResponse.State): LogsTailResponse;

    hasLog(): boolean;
    clearLog(): void;
    getLog(): LogsTailResponse.Log | undefined;
    setLog(value?: LogsTailResponse.Log): LogsTailResponse;

    getContentCase(): LogsTailResponse.ContentCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LogsTailResponse.AsObject;
    static toObject(includeInstance: boolean, msg: LogsTailResponse): LogsTailResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LogsTailResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LogsTailResponse;
    static deserializeBinaryFromReader(message: LogsTailResponse, reader: jspb.BinaryReader): LogsTailResponse;
}

export namespace LogsTailResponse {
    export type AsObject = {
        state: LogsTailResponse.State,
        log?: LogsTailResponse.Log.AsObject,
    }


    export class Log extends jspb.Message { 
        getLivemode(): boolean;
        setLivemode(value: boolean): Log;
        getMethod(): string;
        setMethod(value: string): Log;
        getUrl(): string;
        setUrl(value: string): Log;
        getStatus(): number;
        setStatus(value: number): Log;
        getRequestId(): string;
        setRequestId(value: string): Log;
        getCreatedAt(): number;
        setCreatedAt(value: number): Log;

        hasError(): boolean;
        clearError(): void;
        getError(): LogsTailResponse.Log.Error | undefined;
        setError(value?: LogsTailResponse.Log.Error): Log;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Log.AsObject;
        static toObject(includeInstance: boolean, msg: Log): Log.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Log, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Log;
        static deserializeBinaryFromReader(message: Log, reader: jspb.BinaryReader): Log;
    }

    export namespace Log {
        export type AsObject = {
            livemode: boolean,
            method: string,
            url: string,
            status: number,
            requestId: string,
            createdAt: number,
            error?: LogsTailResponse.Log.Error.AsObject,
        }


        export class Error extends jspb.Message { 
            getType(): string;
            setType(value: string): Error;
            getCharge(): string;
            setCharge(value: string): Error;
            getCode(): string;
            setCode(value: string): Error;
            getDeclineCode(): string;
            setDeclineCode(value: string): Error;
            getMessage(): string;
            setMessage(value: string): Error;
            getParam(): string;
            setParam(value: string): Error;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Error.AsObject;
            static toObject(includeInstance: boolean, msg: Error): Error.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Error, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Error;
            static deserializeBinaryFromReader(message: Error, reader: jspb.BinaryReader): Error;
        }

        export namespace Error {
            export type AsObject = {
                type: string,
                charge: string,
                code: string,
                declineCode: string,
                message: string,
                param: string,
            }
        }

    }


    export enum State {
    STATE_UNSPECIFIED = 0,
    STATE_LOADING = 1,
    STATE_RECONNECTING = 2,
    STATE_READY = 3,
    STATE_DONE = 4,
    }


    export enum ContentCase {
        CONTENT_NOT_SET = 0,
        STATE = 1,
        LOG = 2,
    }

}
