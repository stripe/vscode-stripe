// package: rpc
// file: webhook_endpoint_create.proto

import * as jspb from "google-protobuf";

export class WebhookEndpointCreateRequest extends jspb.Message {
  getUrl(): string;
  setUrl(value: string): void;

  getDescription(): string;
  setDescription(value: string): void;

  getConnect(): boolean;
  setConnect(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WebhookEndpointCreateRequest.AsObject;
  static toObject(includeInstance: boolean, msg: WebhookEndpointCreateRequest): WebhookEndpointCreateRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: WebhookEndpointCreateRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): WebhookEndpointCreateRequest;
  static deserializeBinaryFromReader(message: WebhookEndpointCreateRequest, reader: jspb.BinaryReader): WebhookEndpointCreateRequest;
}

export namespace WebhookEndpointCreateRequest {
  export type AsObject = {
    url: string,
    description: string,
    connect: boolean,
  }
}

export class WebhookEndpointCreateResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WebhookEndpointCreateResponse.AsObject;
  static toObject(includeInstance: boolean, msg: WebhookEndpointCreateResponse): WebhookEndpointCreateResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: WebhookEndpointCreateResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): WebhookEndpointCreateResponse;
  static deserializeBinaryFromReader(message: WebhookEndpointCreateResponse, reader: jspb.BinaryReader): WebhookEndpointCreateResponse;
}

export namespace WebhookEndpointCreateResponse {
  export type AsObject = {
  }
}

