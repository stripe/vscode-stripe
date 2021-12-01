// package: rpc
// file: fixtures.proto

import * as jspb from "google-protobuf";

export class FixtureRequest extends jspb.Message {
  getEvent(): string;
  setEvent(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FixtureRequest.AsObject;
  static toObject(includeInstance: boolean, msg: FixtureRequest): FixtureRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: FixtureRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FixtureRequest;
  static deserializeBinaryFromReader(message: FixtureRequest, reader: jspb.BinaryReader): FixtureRequest;
}

export namespace FixtureRequest {
  export type AsObject = {
    event: string,
  }
}

export class FixtureResponse extends jspb.Message {
  getFixture(): string;
  setFixture(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FixtureResponse.AsObject;
  static toObject(includeInstance: boolean, msg: FixtureResponse): FixtureResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: FixtureResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FixtureResponse;
  static deserializeBinaryFromReader(message: FixtureResponse, reader: jspb.BinaryReader): FixtureResponse;
}

export namespace FixtureResponse {
  export type AsObject = {
    fixture: string,
  }
}

