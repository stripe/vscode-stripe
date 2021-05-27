// package: rpc
// file: common.proto

import * as jspb from "google-protobuf";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

export class StripeEvent extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getApiVersion(): string;
  setApiVersion(value: string): void;

  hasData(): boolean;
  clearData(): void;
  getData(): google_protobuf_struct_pb.Struct | undefined;
  setData(value?: google_protobuf_struct_pb.Struct): void;

  hasRequest(): boolean;
  clearRequest(): void;
  getRequest(): StripeEvent.Request | undefined;
  setRequest(value?: StripeEvent.Request): void;

  getType(): string;
  setType(value: string): void;

  getAccount(): string;
  setAccount(value: string): void;

  getCreated(): number;
  setCreated(value: number): void;

  getLivemode(): boolean;
  setLivemode(value: boolean): void;

  getPendingWebhooks(): number;
  setPendingWebhooks(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StripeEvent.AsObject;
  static toObject(includeInstance: boolean, msg: StripeEvent): StripeEvent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: StripeEvent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StripeEvent;
  static deserializeBinaryFromReader(message: StripeEvent, reader: jspb.BinaryReader): StripeEvent;
}

export namespace StripeEvent {
  export type AsObject = {
    id: string,
    apiVersion: string,
    data?: google_protobuf_struct_pb.Struct.AsObject,
    request?: StripeEvent.Request.AsObject,
    type: string,
    account: string,
    created: number,
    livemode: boolean,
    pendingWebhooks: number,
  }

  export class Request extends jspb.Message {
    getId(): string;
    setId(value: string): void;

    getIdempotencyKey(): string;
    setIdempotencyKey(value: string): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Request.AsObject;
    static toObject(includeInstance: boolean, msg: Request): Request.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Request, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Request;
    static deserializeBinaryFromReader(message: Request, reader: jspb.BinaryReader): Request;
  }

  export namespace Request {
    export type AsObject = {
      id: string,
      idempotencyKey: string,
    }
  }
}

