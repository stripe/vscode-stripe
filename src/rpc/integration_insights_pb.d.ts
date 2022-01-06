// package: rpc
// file: integration_insights.proto

import * as jspb from "google-protobuf";

export class IntegrationInsightRequest extends jspb.Message {
  getLog(): string;
  setLog(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): IntegrationInsightRequest.AsObject;
  static toObject(includeInstance: boolean, msg: IntegrationInsightRequest): IntegrationInsightRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: IntegrationInsightRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): IntegrationInsightRequest;
  static deserializeBinaryFromReader(message: IntegrationInsightRequest, reader: jspb.BinaryReader): IntegrationInsightRequest;
}

export namespace IntegrationInsightRequest {
  export type AsObject = {
    log: string,
  }
}

export class IntegrationInsightResponse extends jspb.Message {
  getMessage(): string;
  setMessage(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): IntegrationInsightResponse.AsObject;
  static toObject(includeInstance: boolean, msg: IntegrationInsightResponse): IntegrationInsightResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: IntegrationInsightResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): IntegrationInsightResponse;
  static deserializeBinaryFromReader(message: IntegrationInsightResponse, reader: jspb.BinaryReader): IntegrationInsightResponse;
}

export namespace IntegrationInsightResponse {
  export type AsObject = {
    message: string,
  }
}

