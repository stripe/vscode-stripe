// package: rpc
// file: samples_list.proto

import * as jspb from "google-protobuf";

export class SamplesListRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SamplesListRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SamplesListRequest): SamplesListRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SamplesListRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SamplesListRequest;
  static deserializeBinaryFromReader(message: SamplesListRequest, reader: jspb.BinaryReader): SamplesListRequest;
}

export namespace SamplesListRequest {
  export type AsObject = {
  }
}

export class SamplesListResponse extends jspb.Message {
  clearSamplesList(): void;
  getSamplesList(): Array<SamplesListResponse.SampleData>;
  setSamplesList(value: Array<SamplesListResponse.SampleData>): void;
  addSamples(value?: SamplesListResponse.SampleData, index?: number): SamplesListResponse.SampleData;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SamplesListResponse.AsObject;
  static toObject(includeInstance: boolean, msg: SamplesListResponse): SamplesListResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SamplesListResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SamplesListResponse;
  static deserializeBinaryFromReader(message: SamplesListResponse, reader: jspb.BinaryReader): SamplesListResponse;
}

export namespace SamplesListResponse {
  export type AsObject = {
    samplesList: Array<SamplesListResponse.SampleData.AsObject>,
  }

  export class SampleData extends jspb.Message {
    getName(): string;
    setName(value: string): void;

    getUrl(): string;
    setUrl(value: string): void;

    getDescription(): string;
    setDescription(value: string): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SampleData.AsObject;
    static toObject(includeInstance: boolean, msg: SampleData): SampleData.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SampleData, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SampleData;
    static deserializeBinaryFromReader(message: SampleData, reader: jspb.BinaryReader): SampleData;
  }

  export namespace SampleData {
    export type AsObject = {
      name: string,
      url: string,
      description: string,
    }
  }
}

