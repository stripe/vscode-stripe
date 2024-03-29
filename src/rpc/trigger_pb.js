// source: trigger.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {missingRequire} reports error on implicit type usages.
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck

var jspb = require('google-protobuf');
var goog = jspb;
var global = Function('return this')();

goog.exportSymbol('proto.rpc.TriggerRequest', null, global);
goog.exportSymbol('proto.rpc.TriggerResponse', null, global);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.rpc.TriggerRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.rpc.TriggerRequest.repeatedFields_, null);
};
goog.inherits(proto.rpc.TriggerRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.rpc.TriggerRequest.displayName = 'proto.rpc.TriggerRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.rpc.TriggerResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.rpc.TriggerResponse.repeatedFields_, null);
};
goog.inherits(proto.rpc.TriggerResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.rpc.TriggerResponse.displayName = 'proto.rpc.TriggerResponse';
}

/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.rpc.TriggerRequest.repeatedFields_ = [3,4,5,6];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.rpc.TriggerRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.rpc.TriggerRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.rpc.TriggerRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rpc.TriggerRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    event: jspb.Message.getFieldWithDefault(msg, 1, ""),
    stripeAccount: jspb.Message.getFieldWithDefault(msg, 2, ""),
    skipList: (f = jspb.Message.getRepeatedField(msg, 3)) == null ? undefined : f,
    overrideList: (f = jspb.Message.getRepeatedField(msg, 4)) == null ? undefined : f,
    addList: (f = jspb.Message.getRepeatedField(msg, 5)) == null ? undefined : f,
    removeList: (f = jspb.Message.getRepeatedField(msg, 6)) == null ? undefined : f,
    raw: jspb.Message.getFieldWithDefault(msg, 7, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.rpc.TriggerRequest}
 */
proto.rpc.TriggerRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.rpc.TriggerRequest;
  return proto.rpc.TriggerRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.rpc.TriggerRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.rpc.TriggerRequest}
 */
proto.rpc.TriggerRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setEvent(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setStripeAccount(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.addSkip(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.addOverride(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.addAdd(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.addRemove(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readString());
      msg.setRaw(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.rpc.TriggerRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.rpc.TriggerRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.rpc.TriggerRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rpc.TriggerRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getEvent();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getStripeAccount();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getSkipList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      3,
      f
    );
  }
  f = message.getOverrideList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      4,
      f
    );
  }
  f = message.getAddList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      5,
      f
    );
  }
  f = message.getRemoveList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      6,
      f
    );
  }
  f = message.getRaw();
  if (f.length > 0) {
    writer.writeString(
      7,
      f
    );
  }
};


/**
 * optional string event = 1;
 * @return {string}
 */
proto.rpc.TriggerRequest.prototype.getEvent = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.rpc.TriggerRequest} returns this
 */
proto.rpc.TriggerRequest.prototype.setEvent = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string stripe_account = 2;
 * @return {string}
 */
proto.rpc.TriggerRequest.prototype.getStripeAccount = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.rpc.TriggerRequest} returns this
 */
proto.rpc.TriggerRequest.prototype.setStripeAccount = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * repeated string skip = 3;
 * @return {!Array<string>}
 */
proto.rpc.TriggerRequest.prototype.getSkipList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 3));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.rpc.TriggerRequest} returns this
 */
proto.rpc.TriggerRequest.prototype.setSkipList = function(value) {
  return jspb.Message.setField(this, 3, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.rpc.TriggerRequest} returns this
 */
proto.rpc.TriggerRequest.prototype.addSkip = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 3, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.rpc.TriggerRequest} returns this
 */
proto.rpc.TriggerRequest.prototype.clearSkipList = function() {
  return this.setSkipList([]);
};


/**
 * repeated string override = 4;
 * @return {!Array<string>}
 */
proto.rpc.TriggerRequest.prototype.getOverrideList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 4));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.rpc.TriggerRequest} returns this
 */
proto.rpc.TriggerRequest.prototype.setOverrideList = function(value) {
  return jspb.Message.setField(this, 4, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.rpc.TriggerRequest} returns this
 */
proto.rpc.TriggerRequest.prototype.addOverride = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 4, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.rpc.TriggerRequest} returns this
 */
proto.rpc.TriggerRequest.prototype.clearOverrideList = function() {
  return this.setOverrideList([]);
};


/**
 * repeated string add = 5;
 * @return {!Array<string>}
 */
proto.rpc.TriggerRequest.prototype.getAddList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 5));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.rpc.TriggerRequest} returns this
 */
proto.rpc.TriggerRequest.prototype.setAddList = function(value) {
  return jspb.Message.setField(this, 5, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.rpc.TriggerRequest} returns this
 */
proto.rpc.TriggerRequest.prototype.addAdd = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 5, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.rpc.TriggerRequest} returns this
 */
proto.rpc.TriggerRequest.prototype.clearAddList = function() {
  return this.setAddList([]);
};


/**
 * repeated string remove = 6;
 * @return {!Array<string>}
 */
proto.rpc.TriggerRequest.prototype.getRemoveList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 6));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.rpc.TriggerRequest} returns this
 */
proto.rpc.TriggerRequest.prototype.setRemoveList = function(value) {
  return jspb.Message.setField(this, 6, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.rpc.TriggerRequest} returns this
 */
proto.rpc.TriggerRequest.prototype.addRemove = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 6, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.rpc.TriggerRequest} returns this
 */
proto.rpc.TriggerRequest.prototype.clearRemoveList = function() {
  return this.setRemoveList([]);
};


/**
 * optional string raw = 7;
 * @return {string}
 */
proto.rpc.TriggerRequest.prototype.getRaw = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * @param {string} value
 * @return {!proto.rpc.TriggerRequest} returns this
 */
proto.rpc.TriggerRequest.prototype.setRaw = function(value) {
  return jspb.Message.setProto3StringField(this, 7, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.rpc.TriggerResponse.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.rpc.TriggerResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.rpc.TriggerResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.rpc.TriggerResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rpc.TriggerResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    requestsList: (f = jspb.Message.getRepeatedField(msg, 1)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.rpc.TriggerResponse}
 */
proto.rpc.TriggerResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.rpc.TriggerResponse;
  return proto.rpc.TriggerResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.rpc.TriggerResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.rpc.TriggerResponse}
 */
proto.rpc.TriggerResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.addRequests(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.rpc.TriggerResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.rpc.TriggerResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.rpc.TriggerResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rpc.TriggerResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRequestsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      1,
      f
    );
  }
};


/**
 * repeated string requests = 1;
 * @return {!Array<string>}
 */
proto.rpc.TriggerResponse.prototype.getRequestsList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 1));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.rpc.TriggerResponse} returns this
 */
proto.rpc.TriggerResponse.prototype.setRequestsList = function(value) {
  return jspb.Message.setField(this, 1, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.rpc.TriggerResponse} returns this
 */
proto.rpc.TriggerResponse.prototype.addRequests = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 1, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.rpc.TriggerResponse} returns this
 */
proto.rpc.TriggerResponse.prototype.clearRequestsList = function() {
  return this.setRequestsList([]);
};


goog.object.extend(exports, proto.rpc);
