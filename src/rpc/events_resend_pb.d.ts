// package: rpc
// file: events_resend.proto

import * as jspb from "google-protobuf";
import * as common_pb from "./common_pb";

export class EventsResendRequest extends jspb.Message {
  getEventId(): string;
  setEventId(value: string): void;

  getAccount(): string;
  setAccount(value: string): void;

  clearDataList(): void;
  getDataList(): Array<string>;
  setDataList(value: Array<string>): void;
  addData(value: string, index?: number): string;

  clearExpandList(): void;
  getExpandList(): Array<string>;
  setExpandList(value: Array<string>): void;
  addExpand(value: string, index?: number): string;

  getIdempotency(): string;
  setIdempotency(value: string): void;

  getLive(): boolean;
  setLive(value: boolean): void;

  getStripeAccount(): string;
  setStripeAccount(value: string): void;

  getVersion(): string;
  setVersion(value: string): void;

  getWebhookEndpoint(): string;
  setWebhookEndpoint(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EventsResendRequest.AsObject;
  static toObject(includeInstance: boolean, msg: EventsResendRequest): EventsResendRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: EventsResendRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EventsResendRequest;
  static deserializeBinaryFromReader(message: EventsResendRequest, reader: jspb.BinaryReader): EventsResendRequest;
}

export namespace EventsResendRequest {
  export type AsObject = {
    eventId: string,
    account: string,
    dataList: Array<string>,
    expandList: Array<string>,
    idempotency: string,
    live: boolean,
    stripeAccount: string,
    version: string,
    webhookEndpoint: string,
  }
}

export class EventsResendResponse extends jspb.Message {
  hasStripeEvent(): boolean;
  clearStripeEvent(): void;
  getStripeEvent(): common_pb.StripeEvent | undefined;
  setStripeEvent(value?: common_pb.StripeEvent): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EventsResendResponse.AsObject;
  static toObject(includeInstance: boolean, msg: EventsResendResponse): EventsResendResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: EventsResendResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EventsResendResponse;
  static deserializeBinaryFromReader(message: EventsResendResponse, reader: jspb.BinaryReader): EventsResendResponse;
}

export namespace EventsResendResponse {
  export type AsObject = {
    stripeEvent?: common_pb.StripeEvent.AsObject,
  }
}

