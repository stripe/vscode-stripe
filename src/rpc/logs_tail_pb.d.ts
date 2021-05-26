// package: rpc
// file: logs_tail.proto

import * as jspb from "google-protobuf";

export class LogsTailRequest extends jspb.Message {
  clearFilterAccountsList(): void;
  getFilterAccountsList(): Array<LogsTailRequest.AccountMap[keyof LogsTailRequest.AccountMap]>;
  setFilterAccountsList(value: Array<LogsTailRequest.AccountMap[keyof LogsTailRequest.AccountMap]>): void;
  addFilterAccounts(value: LogsTailRequest.AccountMap[keyof LogsTailRequest.AccountMap], index?: number): LogsTailRequest.AccountMap[keyof LogsTailRequest.AccountMap];

  clearFilterHttpMethodsList(): void;
  getFilterHttpMethodsList(): Array<LogsTailRequest.HttpMethodMap[keyof LogsTailRequest.HttpMethodMap]>;
  setFilterHttpMethodsList(value: Array<LogsTailRequest.HttpMethodMap[keyof LogsTailRequest.HttpMethodMap]>): void;
  addFilterHttpMethods(value: LogsTailRequest.HttpMethodMap[keyof LogsTailRequest.HttpMethodMap], index?: number): LogsTailRequest.HttpMethodMap[keyof LogsTailRequest.HttpMethodMap];

  clearFilterIpAddressesList(): void;
  getFilterIpAddressesList(): Array<string>;
  setFilterIpAddressesList(value: Array<string>): void;
  addFilterIpAddresses(value: string, index?: number): string;

  clearFilterRequestPathsList(): void;
  getFilterRequestPathsList(): Array<string>;
  setFilterRequestPathsList(value: Array<string>): void;
  addFilterRequestPaths(value: string, index?: number): string;

  clearFilterRequestStatusesList(): void;
  getFilterRequestStatusesList(): Array<LogsTailRequest.RequestStatusMap[keyof LogsTailRequest.RequestStatusMap]>;
  setFilterRequestStatusesList(value: Array<LogsTailRequest.RequestStatusMap[keyof LogsTailRequest.RequestStatusMap]>): void;
  addFilterRequestStatuses(value: LogsTailRequest.RequestStatusMap[keyof LogsTailRequest.RequestStatusMap], index?: number): LogsTailRequest.RequestStatusMap[keyof LogsTailRequest.RequestStatusMap];

  clearFilterSourcesList(): void;
  getFilterSourcesList(): Array<LogsTailRequest.SourceMap[keyof LogsTailRequest.SourceMap]>;
  setFilterSourcesList(value: Array<LogsTailRequest.SourceMap[keyof LogsTailRequest.SourceMap]>): void;
  addFilterSources(value: LogsTailRequest.SourceMap[keyof LogsTailRequest.SourceMap], index?: number): LogsTailRequest.SourceMap[keyof LogsTailRequest.SourceMap];

  clearFilterStatusCodesList(): void;
  getFilterStatusCodesList(): Array<string>;
  setFilterStatusCodesList(value: Array<string>): void;
  addFilterStatusCodes(value: string, index?: number): string;

  clearFilterStatusCodeTypesList(): void;
  getFilterStatusCodeTypesList(): Array<LogsTailRequest.StatusCodeTypeMap[keyof LogsTailRequest.StatusCodeTypeMap]>;
  setFilterStatusCodeTypesList(value: Array<LogsTailRequest.StatusCodeTypeMap[keyof LogsTailRequest.StatusCodeTypeMap]>): void;
  addFilterStatusCodeTypes(value: LogsTailRequest.StatusCodeTypeMap[keyof LogsTailRequest.StatusCodeTypeMap], index?: number): LogsTailRequest.StatusCodeTypeMap[keyof LogsTailRequest.StatusCodeTypeMap];

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
    filterAccountsList: Array<LogsTailRequest.AccountMap[keyof LogsTailRequest.AccountMap]>,
    filterHttpMethodsList: Array<LogsTailRequest.HttpMethodMap[keyof LogsTailRequest.HttpMethodMap]>,
    filterIpAddressesList: Array<string>,
    filterRequestPathsList: Array<string>,
    filterRequestStatusesList: Array<LogsTailRequest.RequestStatusMap[keyof LogsTailRequest.RequestStatusMap]>,
    filterSourcesList: Array<LogsTailRequest.SourceMap[keyof LogsTailRequest.SourceMap]>,
    filterStatusCodesList: Array<string>,
    filterStatusCodeTypesList: Array<LogsTailRequest.StatusCodeTypeMap[keyof LogsTailRequest.StatusCodeTypeMap]>,
  }

  export interface AccountMap {
    ACCOUNT_UNSPECIFIED: 0;
    ACCOUNT_CONNECT_IN: 1;
    ACCOUNT_CONNECT_OUT: 2;
    ACCOUNT_SELF: 3;
  }

  export const Account: AccountMap;

  export interface HttpMethodMap {
    HTTP_METHOD_UNSPECIFIED: 0;
    HTTP_METHOD_GET: 1;
    HTTP_METHOD_POST: 2;
    HTTP_METHOD_DELETE: 3;
  }

  export const HttpMethod: HttpMethodMap;

  export interface RequestStatusMap {
    REQUEST_STATUS_UNSPECIFIED: 0;
    REQUEST_STATUS_SUCCEEDED: 1;
    REQUEST_STATUS_FAILED: 2;
  }

  export const RequestStatus: RequestStatusMap;

  export interface SourceMap {
    SOURCE_UNSPECIFIED: 0;
    SOURCE_API: 1;
    SOURCE_DASHBOARD: 2;
  }

  export const Source: SourceMap;

  export interface StatusCodeTypeMap {
    STATUS_CODE_TYPE_UNSPECIFIED: 0;
    STATUS_CODE_TYPE_2XX: 1;
    STATUS_CODE_TYPE_4XX: 2;
    STATUS_CODE_TYPE_5XX: 3;
  }

  export const StatusCodeType: StatusCodeTypeMap;
}

export class LogsTailResponse extends jspb.Message {
  hasState(): boolean;
  clearState(): void;
  getState(): LogsTailResponse.StateMap[keyof LogsTailResponse.StateMap];
  setState(value: LogsTailResponse.StateMap[keyof LogsTailResponse.StateMap]): void;

  hasLog(): boolean;
  clearLog(): void;
  getLog(): LogsTailResponse.Log | undefined;
  setLog(value?: LogsTailResponse.Log): void;

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
    state: LogsTailResponse.StateMap[keyof LogsTailResponse.StateMap],
    log?: LogsTailResponse.Log.AsObject,
  }

  export class Log extends jspb.Message {
    getLivemode(): boolean;
    setLivemode(value: boolean): void;

    getMethod(): string;
    setMethod(value: string): void;

    getUrl(): string;
    setUrl(value: string): void;

    getStatus(): number;
    setStatus(value: number): void;

    getRequestId(): string;
    setRequestId(value: string): void;

    getCreatedAt(): number;
    setCreatedAt(value: number): void;

    hasError(): boolean;
    clearError(): void;
    getError(): LogsTailResponse.Log.Error | undefined;
    setError(value?: LogsTailResponse.Log.Error): void;

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
      setType(value: string): void;

      getCharge(): string;
      setCharge(value: string): void;

      getCode(): string;
      setCode(value: string): void;

      getDeclineCode(): string;
      setDeclineCode(value: string): void;

      getMessage(): string;
      setMessage(value: string): void;

      getParam(): string;
      setParam(value: string): void;

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

  export interface StateMap {
    STATE_UNSPECIFIED: 0;
    STATE_LOADING: 1;
    STATE_RECONNECTING: 2;
    STATE_READY: 3;
    STATE_DONE: 4;
  }

  export const State: StateMap;

  export enum ContentCase {
    CONTENT_NOT_SET = 0,
    STATE = 1,
    LOG = 2,
  }
}

