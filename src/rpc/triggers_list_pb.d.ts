// package: rpc
// file: triggers_list.proto

import * as jspb from "google-protobuf";

export class TriggersListRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TriggersListRequest.AsObject;
  static toObject(includeInstance: boolean, msg: TriggersListRequest): TriggersListRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TriggersListRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TriggersListRequest;
  static deserializeBinaryFromReader(message: TriggersListRequest, reader: jspb.BinaryReader): TriggersListRequest;
}

export namespace TriggersListRequest {
  export type AsObject = {
  }
}

export class TriggersListResponse extends jspb.Message {
  clearEventsList(): void;
  getEventsList(): Array<string>;
  setEventsList(value: Array<string>): void;
  addEvents(value: string, index?: number): string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TriggersListResponse.AsObject;
  static toObject(includeInstance: boolean, msg: TriggersListResponse): TriggersListResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TriggersListResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TriggersListResponse;
  static deserializeBinaryFromReader(message: TriggersListResponse, reader: jspb.BinaryReader): TriggersListResponse;
}

export namespace TriggersListResponse {
  export type AsObject = {
    eventsList: Array<string>,
  }
}

