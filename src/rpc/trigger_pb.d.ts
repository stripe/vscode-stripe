// package: rpc
// file: trigger.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class TriggerRequest extends jspb.Message { 
    getEvent(): string;
    setEvent(value: string): TriggerRequest;
    getStripeAccount(): string;
    setStripeAccount(value: string): TriggerRequest;
    clearSkipList(): void;
    getSkipList(): Array<string>;
    setSkipList(value: Array<string>): TriggerRequest;
    addSkip(value: string, index?: number): string;
    clearOverrideList(): void;
    getOverrideList(): Array<string>;
    setOverrideList(value: Array<string>): TriggerRequest;
    addOverride(value: string, index?: number): string;
    clearAddList(): void;
    getAddList(): Array<string>;
    setAddList(value: Array<string>): TriggerRequest;
    addAdd(value: string, index?: number): string;
    clearRemoveList(): void;
    getRemoveList(): Array<string>;
    setRemoveList(value: Array<string>): TriggerRequest;
    addRemove(value: string, index?: number): string;

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
        skipList: Array<string>,
        overrideList: Array<string>,
        addList: Array<string>,
        removeList: Array<string>,
    }
}

export class TriggerResponse extends jspb.Message { 
    clearRequestsList(): void;
    getRequestsList(): Array<string>;
    setRequestsList(value: Array<string>): TriggerResponse;
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
