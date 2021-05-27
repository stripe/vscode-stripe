// package: rpc
// file: trigger.proto

import * as jspb from "google-protobuf";

export class TriggerRequest extends jspb.Message {
  getEvent(): string;
  setEvent(value: string): void;

  getStripeAccount(): string;
  setStripeAccount(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TriggerRequest.AsObject;
  static toObject(includeInstance: boolean, msg: TriggerRequest): TriggerRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TriggerRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TriggerRequest;
  static deserializeBinaryFromReader(message: TriggerRequest, reader: jspb.BinaryReader): TriggerRequest;
}

export namespace TriggerRequest {
  export type AsObject = {
    event: string,
    stripeAccount: string,
  }
}

export class TriggerResponse extends jspb.Message {
  clearRequestsList(): void;
  getRequestsList(): Array<string>;
  setRequestsList(value: Array<string>): void;
  addRequests(value: string, index?: number): string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TriggerResponse.AsObject;
  static toObject(includeInstance: boolean, msg: TriggerResponse): TriggerResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TriggerResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TriggerResponse;
  static deserializeBinaryFromReader(message: TriggerResponse, reader: jspb.BinaryReader): TriggerResponse;
}

export namespace TriggerResponse {
  export type AsObject = {
    requestsList: Array<string>,
  }
}

