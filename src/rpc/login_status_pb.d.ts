// package: rpc
// file: login_status.proto

import * as jspb from "google-protobuf";

export class LoginStatusRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LoginStatusRequest.AsObject;
  static toObject(includeInstance: boolean, msg: LoginStatusRequest): LoginStatusRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: LoginStatusRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LoginStatusRequest;
  static deserializeBinaryFromReader(message: LoginStatusRequest, reader: jspb.BinaryReader): LoginStatusRequest;
}

export namespace LoginStatusRequest {
  export type AsObject = {
  }
}

export class LoginStatusResponse extends jspb.Message {
  getAccountId(): string;
  setAccountId(value: string): void;

  getDisplayName(): string;
  setDisplayName(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LoginStatusResponse.AsObject;
  static toObject(includeInstance: boolean, msg: LoginStatusResponse): LoginStatusResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: LoginStatusResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LoginStatusResponse;
  static deserializeBinaryFromReader(message: LoginStatusResponse, reader: jspb.BinaryReader): LoginStatusResponse;
}

export namespace LoginStatusResponse {
  export type AsObject = {
    accountId: string,
    displayName: string,
  }
}

