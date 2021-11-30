// package: rpc
// file: sample_create.proto

import * as jspb from "google-protobuf";

export class SampleCreateRequest extends jspb.Message {
  getSampleName(): string;
  setSampleName(value: string): void;

  getIntegrationName(): string;
  setIntegrationName(value: string): void;

  getClient(): string;
  setClient(value: string): void;

  getServer(): string;
  setServer(value: string): void;

  getPath(): string;
  setPath(value: string): void;

  getForceRefresh(): boolean;
  setForceRefresh(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SampleCreateRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SampleCreateRequest): SampleCreateRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SampleCreateRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SampleCreateRequest;
  static deserializeBinaryFromReader(message: SampleCreateRequest, reader: jspb.BinaryReader): SampleCreateRequest;
}

export namespace SampleCreateRequest {
  export type AsObject = {
    sampleName: string,
    integrationName: string,
    client: string,
    server: string,
    path: string,
    forceRefresh: boolean,
  }
}

export class SampleCreateResponse extends jspb.Message {
  getPostInstall(): string;
  setPostInstall(value: string): void;

  getPath(): string;
  setPath(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SampleCreateResponse.AsObject;
  static toObject(includeInstance: boolean, msg: SampleCreateResponse): SampleCreateResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SampleCreateResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SampleCreateResponse;
  static deserializeBinaryFromReader(message: SampleCreateResponse, reader: jspb.BinaryReader): SampleCreateResponse;
}

export namespace SampleCreateResponse {
  export type AsObject = {
    postInstall: string,
    path: string,
  }
}

