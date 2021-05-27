// package: rpc
// file: sample_configs.proto

import * as jspb from "google-protobuf";

export class SampleConfigsRequest extends jspb.Message {
  getSampleName(): string;
  setSampleName(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SampleConfigsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SampleConfigsRequest): SampleConfigsRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SampleConfigsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SampleConfigsRequest;
  static deserializeBinaryFromReader(message: SampleConfigsRequest, reader: jspb.BinaryReader): SampleConfigsRequest;
}

export namespace SampleConfigsRequest {
  export type AsObject = {
    sampleName: string,
  }
}

export class SampleConfigsResponse extends jspb.Message {
  clearIntegrationsList(): void;
  getIntegrationsList(): Array<SampleConfigsResponse.Integration>;
  setIntegrationsList(value: Array<SampleConfigsResponse.Integration>): void;
  addIntegrations(value?: SampleConfigsResponse.Integration, index?: number): SampleConfigsResponse.Integration;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SampleConfigsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: SampleConfigsResponse): SampleConfigsResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SampleConfigsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SampleConfigsResponse;
  static deserializeBinaryFromReader(message: SampleConfigsResponse, reader: jspb.BinaryReader): SampleConfigsResponse;
}

export namespace SampleConfigsResponse {
  export type AsObject = {
    integrationsList: Array<SampleConfigsResponse.Integration.AsObject>,
  }

  export class Integration extends jspb.Message {
    getIntegrationName(): string;
    setIntegrationName(value: string): void;

    clearClientsList(): void;
    getClientsList(): Array<string>;
    setClientsList(value: Array<string>): void;
    addClients(value: string, index?: number): string;

    clearServersList(): void;
    getServersList(): Array<string>;
    setServersList(value: Array<string>): void;
    addServers(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Integration.AsObject;
    static toObject(includeInstance: boolean, msg: Integration): Integration.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Integration, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Integration;
    static deserializeBinaryFromReader(message: Integration, reader: jspb.BinaryReader): Integration;
  }

  export namespace Integration {
    export type AsObject = {
      integrationName: string,
      clientsList: Array<string>,
      serversList: Array<string>,
    }
  }
}

