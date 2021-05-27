// package: rpc
// file: listen.proto

import * as jspb from "google-protobuf";
import * as common_pb from "./common_pb";

export class ListenRequest extends jspb.Message {
  clearConnectHeadersList(): void;
  getConnectHeadersList(): Array<string>;
  setConnectHeadersList(value: Array<string>): void;
  addConnectHeaders(value: string, index?: number): string;

  clearEventsList(): void;
  getEventsList(): Array<string>;
  setEventsList(value: Array<string>): void;
  addEvents(value: string, index?: number): string;

  getForwardConnectTo(): string;
  setForwardConnectTo(value: string): void;

  getForwardTo(): string;
  setForwardTo(value: string): void;

  clearHeadersList(): void;
  getHeadersList(): Array<string>;
  setHeadersList(value: Array<string>): void;
  addHeaders(value: string, index?: number): string;

  getLatest(): boolean;
  setLatest(value: boolean): void;

  getLive(): boolean;
  setLive(value: boolean): void;

  getSkipVerify(): boolean;
  setSkipVerify(value: boolean): void;

  getUseConfiguredWebhooks(): boolean;
  setUseConfiguredWebhooks(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListenRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListenRequest): ListenRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ListenRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListenRequest;
  static deserializeBinaryFromReader(message: ListenRequest, reader: jspb.BinaryReader): ListenRequest;
}

export namespace ListenRequest {
  export type AsObject = {
    connectHeadersList: Array<string>,
    eventsList: Array<string>,
    forwardConnectTo: string,
    forwardTo: string,
    headersList: Array<string>,
    latest: boolean,
    live: boolean,
    skipVerify: boolean,
    useConfiguredWebhooks: boolean,
  }
}

export class ListenResponse extends jspb.Message {
  hasState(): boolean;
  clearState(): void;
  getState(): ListenResponse.StateMap[keyof ListenResponse.StateMap];
  setState(value: ListenResponse.StateMap[keyof ListenResponse.StateMap]): void;

  hasStripeEvent(): boolean;
  clearStripeEvent(): void;
  getStripeEvent(): common_pb.StripeEvent | undefined;
  setStripeEvent(value?: common_pb.StripeEvent): void;

  hasEndpointResponse(): boolean;
  clearEndpointResponse(): void;
  getEndpointResponse(): ListenResponse.EndpointResponse | undefined;
  setEndpointResponse(value?: ListenResponse.EndpointResponse): void;

  getContentCase(): ListenResponse.ContentCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListenResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListenResponse): ListenResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ListenResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListenResponse;
  static deserializeBinaryFromReader(message: ListenResponse, reader: jspb.BinaryReader): ListenResponse;
}

export namespace ListenResponse {
  export type AsObject = {
    state: ListenResponse.StateMap[keyof ListenResponse.StateMap],
    stripeEvent?: common_pb.StripeEvent.AsObject,
    endpointResponse?: ListenResponse.EndpointResponse.AsObject,
  }

  export class EndpointResponse extends jspb.Message {
    hasData(): boolean;
    clearData(): void;
    getData(): ListenResponse.EndpointResponse.Data | undefined;
    setData(value?: ListenResponse.EndpointResponse.Data): void;

    hasError(): boolean;
    clearError(): void;
    getError(): string;
    setError(value: string): void;

    getContentCase(): EndpointResponse.ContentCase;
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EndpointResponse.AsObject;
    static toObject(includeInstance: boolean, msg: EndpointResponse): EndpointResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EndpointResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EndpointResponse;
    static deserializeBinaryFromReader(message: EndpointResponse, reader: jspb.BinaryReader): EndpointResponse;
  }

  export namespace EndpointResponse {
    export type AsObject = {
      data?: ListenResponse.EndpointResponse.Data.AsObject,
      error: string,
    }

    export class Data extends jspb.Message {
      getStatus(): number;
      setStatus(value: number): void;

      getHttpMethod(): ListenResponse.EndpointResponse.Data.HttpMethodMap[keyof ListenResponse.EndpointResponse.Data.HttpMethodMap];
      setHttpMethod(value: ListenResponse.EndpointResponse.Data.HttpMethodMap[keyof ListenResponse.EndpointResponse.Data.HttpMethodMap]): void;

      getUrl(): string;
      setUrl(value: string): void;

      getEventId(): string;
      setEventId(value: string): void;

      getBody(): string;
      setBody(value: string): void;

      serializeBinary(): Uint8Array;
      toObject(includeInstance?: boolean): Data.AsObject;
      static toObject(includeInstance: boolean, msg: Data): Data.AsObject;
      static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
      static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
      static serializeBinaryToWriter(message: Data, writer: jspb.BinaryWriter): void;
      static deserializeBinary(bytes: Uint8Array): Data;
      static deserializeBinaryFromReader(message: Data, reader: jspb.BinaryReader): Data;
    }

    export namespace Data {
      export type AsObject = {
        status: number,
        httpMethod: ListenResponse.EndpointResponse.Data.HttpMethodMap[keyof ListenResponse.EndpointResponse.Data.HttpMethodMap],
        url: string,
        eventId: string,
        body: string,
      }

      export interface HttpMethodMap {
        HTTP_METHOD_UNSPECIFIED: 0;
        HTTP_METHOD_GET: 1;
        HTTP_METHOD_POST: 2;
        HTTP_METHOD_DELETE: 3;
      }

      export const HttpMethod: HttpMethodMap;
    }

    export enum ContentCase {
      CONTENT_NOT_SET = 0,
      DATA = 1,
      ERROR = 2,
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
    STRIPE_EVENT = 2,
    ENDPOINT_RESPONSE = 3,
  }
}

