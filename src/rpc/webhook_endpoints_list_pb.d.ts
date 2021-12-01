// package: rpc
// file: webhook_endpoints_list.proto

import * as jspb from "google-protobuf";

export class WebhookEndpointsListRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WebhookEndpointsListRequest.AsObject;
  static toObject(includeInstance: boolean, msg: WebhookEndpointsListRequest): WebhookEndpointsListRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: WebhookEndpointsListRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): WebhookEndpointsListRequest;
  static deserializeBinaryFromReader(message: WebhookEndpointsListRequest, reader: jspb.BinaryReader): WebhookEndpointsListRequest;
}

export namespace WebhookEndpointsListRequest {
  export type AsObject = {
  }
}

export class WebhookEndpointsListResponse extends jspb.Message {
  clearEndpointsList(): void;
  getEndpointsList(): Array<WebhookEndpointsListResponse.WebhookEndpointData>;
  setEndpointsList(value: Array<WebhookEndpointsListResponse.WebhookEndpointData>): void;
  addEndpoints(value?: WebhookEndpointsListResponse.WebhookEndpointData, index?: number): WebhookEndpointsListResponse.WebhookEndpointData;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WebhookEndpointsListResponse.AsObject;
  static toObject(includeInstance: boolean, msg: WebhookEndpointsListResponse): WebhookEndpointsListResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: WebhookEndpointsListResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): WebhookEndpointsListResponse;
  static deserializeBinaryFromReader(message: WebhookEndpointsListResponse, reader: jspb.BinaryReader): WebhookEndpointsListResponse;
}

export namespace WebhookEndpointsListResponse {
  export type AsObject = {
    endpointsList: Array<WebhookEndpointsListResponse.WebhookEndpointData.AsObject>,
  }

  export class WebhookEndpointData extends jspb.Message {
    getApplication(): string;
    setApplication(value: string): void;

    clearEnabledeventsList(): void;
    getEnabledeventsList(): Array<string>;
    setEnabledeventsList(value: Array<string>): void;
    addEnabledevents(value: string, index?: number): string;

    getUrl(): string;
    setUrl(value: string): void;

    getStatus(): string;
    setStatus(value: string): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WebhookEndpointData.AsObject;
    static toObject(includeInstance: boolean, msg: WebhookEndpointData): WebhookEndpointData.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WebhookEndpointData, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WebhookEndpointData;
    static deserializeBinaryFromReader(message: WebhookEndpointData, reader: jspb.BinaryReader): WebhookEndpointData;
  }

  export namespace WebhookEndpointData {
    export type AsObject = {
      application: string,
      enabledeventsList: Array<string>,
      url: string,
      status: string,
    }
  }
}

