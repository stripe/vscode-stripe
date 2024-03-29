// source: listen.proto
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

var common_pb = require('./common_pb.js');
goog.object.extend(proto, common_pb);
goog.exportSymbol('proto.rpc.ListenRequest', null, global);
goog.exportSymbol('proto.rpc.ListenResponse', null, global);
goog.exportSymbol('proto.rpc.ListenResponse.ContentCase', null, global);
goog.exportSymbol('proto.rpc.ListenResponse.EndpointResponse', null, global);
goog.exportSymbol('proto.rpc.ListenResponse.EndpointResponse.ContentCase', null, global);
goog.exportSymbol('proto.rpc.ListenResponse.EndpointResponse.Data', null, global);
goog.exportSymbol('proto.rpc.ListenResponse.EndpointResponse.Data.HttpMethod', null, global);
goog.exportSymbol('proto.rpc.ListenResponse.State', null, global);
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
proto.rpc.ListenRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.rpc.ListenRequest.repeatedFields_, null);
};
goog.inherits(proto.rpc.ListenRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.rpc.ListenRequest.displayName = 'proto.rpc.ListenRequest';
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
proto.rpc.ListenResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.rpc.ListenResponse.oneofGroups_);
};
goog.inherits(proto.rpc.ListenResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.rpc.ListenResponse.displayName = 'proto.rpc.ListenResponse';
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
proto.rpc.ListenResponse.EndpointResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.rpc.ListenResponse.EndpointResponse.oneofGroups_);
};
goog.inherits(proto.rpc.ListenResponse.EndpointResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.rpc.ListenResponse.EndpointResponse.displayName = 'proto.rpc.ListenResponse.EndpointResponse';
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
proto.rpc.ListenResponse.EndpointResponse.Data = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.rpc.ListenResponse.EndpointResponse.Data, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.rpc.ListenResponse.EndpointResponse.Data.displayName = 'proto.rpc.ListenResponse.EndpointResponse.Data';
}

/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.rpc.ListenRequest.repeatedFields_ = [1,2,5];



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
proto.rpc.ListenRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.rpc.ListenRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.rpc.ListenRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rpc.ListenRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    connectHeadersList: (f = jspb.Message.getRepeatedField(msg, 1)) == null ? undefined : f,
    eventsList: (f = jspb.Message.getRepeatedField(msg, 2)) == null ? undefined : f,
    forwardConnectTo: jspb.Message.getFieldWithDefault(msg, 3, ""),
    forwardTo: jspb.Message.getFieldWithDefault(msg, 4, ""),
    headersList: (f = jspb.Message.getRepeatedField(msg, 5)) == null ? undefined : f,
    latest: jspb.Message.getBooleanFieldWithDefault(msg, 6, false),
    live: jspb.Message.getBooleanFieldWithDefault(msg, 7, false),
    skipVerify: jspb.Message.getBooleanFieldWithDefault(msg, 8, false),
    useConfiguredWebhooks: jspb.Message.getBooleanFieldWithDefault(msg, 9, false)
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
 * @return {!proto.rpc.ListenRequest}
 */
proto.rpc.ListenRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.rpc.ListenRequest;
  return proto.rpc.ListenRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.rpc.ListenRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.rpc.ListenRequest}
 */
proto.rpc.ListenRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.addConnectHeaders(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.addEvents(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setForwardConnectTo(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setForwardTo(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.addHeaders(value);
      break;
    case 6:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setLatest(value);
      break;
    case 7:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setLive(value);
      break;
    case 8:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setSkipVerify(value);
      break;
    case 9:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setUseConfiguredWebhooks(value);
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
proto.rpc.ListenRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.rpc.ListenRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.rpc.ListenRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rpc.ListenRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getConnectHeadersList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      1,
      f
    );
  }
  f = message.getEventsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      2,
      f
    );
  }
  f = message.getForwardConnectTo();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getForwardTo();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getHeadersList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      5,
      f
    );
  }
  f = message.getLatest();
  if (f) {
    writer.writeBool(
      6,
      f
    );
  }
  f = message.getLive();
  if (f) {
    writer.writeBool(
      7,
      f
    );
  }
  f = message.getSkipVerify();
  if (f) {
    writer.writeBool(
      8,
      f
    );
  }
  f = message.getUseConfiguredWebhooks();
  if (f) {
    writer.writeBool(
      9,
      f
    );
  }
};


/**
 * repeated string connect_headers = 1;
 * @return {!Array<string>}
 */
proto.rpc.ListenRequest.prototype.getConnectHeadersList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 1));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.rpc.ListenRequest} returns this
 */
proto.rpc.ListenRequest.prototype.setConnectHeadersList = function(value) {
  return jspb.Message.setField(this, 1, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.rpc.ListenRequest} returns this
 */
proto.rpc.ListenRequest.prototype.addConnectHeaders = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 1, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.rpc.ListenRequest} returns this
 */
proto.rpc.ListenRequest.prototype.clearConnectHeadersList = function() {
  return this.setConnectHeadersList([]);
};


/**
 * repeated string events = 2;
 * @return {!Array<string>}
 */
proto.rpc.ListenRequest.prototype.getEventsList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 2));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.rpc.ListenRequest} returns this
 */
proto.rpc.ListenRequest.prototype.setEventsList = function(value) {
  return jspb.Message.setField(this, 2, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.rpc.ListenRequest} returns this
 */
proto.rpc.ListenRequest.prototype.addEvents = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 2, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.rpc.ListenRequest} returns this
 */
proto.rpc.ListenRequest.prototype.clearEventsList = function() {
  return this.setEventsList([]);
};


/**
 * optional string forward_connect_to = 3;
 * @return {string}
 */
proto.rpc.ListenRequest.prototype.getForwardConnectTo = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.rpc.ListenRequest} returns this
 */
proto.rpc.ListenRequest.prototype.setForwardConnectTo = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string forward_to = 4;
 * @return {string}
 */
proto.rpc.ListenRequest.prototype.getForwardTo = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.rpc.ListenRequest} returns this
 */
proto.rpc.ListenRequest.prototype.setForwardTo = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * repeated string headers = 5;
 * @return {!Array<string>}
 */
proto.rpc.ListenRequest.prototype.getHeadersList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 5));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.rpc.ListenRequest} returns this
 */
proto.rpc.ListenRequest.prototype.setHeadersList = function(value) {
  return jspb.Message.setField(this, 5, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.rpc.ListenRequest} returns this
 */
proto.rpc.ListenRequest.prototype.addHeaders = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 5, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.rpc.ListenRequest} returns this
 */
proto.rpc.ListenRequest.prototype.clearHeadersList = function() {
  return this.setHeadersList([]);
};


/**
 * optional bool latest = 6;
 * @return {boolean}
 */
proto.rpc.ListenRequest.prototype.getLatest = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 6, false));
};


/**
 * @param {boolean} value
 * @return {!proto.rpc.ListenRequest} returns this
 */
proto.rpc.ListenRequest.prototype.setLatest = function(value) {
  return jspb.Message.setProto3BooleanField(this, 6, value);
};


/**
 * optional bool live = 7;
 * @return {boolean}
 */
proto.rpc.ListenRequest.prototype.getLive = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 7, false));
};


/**
 * @param {boolean} value
 * @return {!proto.rpc.ListenRequest} returns this
 */
proto.rpc.ListenRequest.prototype.setLive = function(value) {
  return jspb.Message.setProto3BooleanField(this, 7, value);
};


/**
 * optional bool skip_verify = 8;
 * @return {boolean}
 */
proto.rpc.ListenRequest.prototype.getSkipVerify = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 8, false));
};


/**
 * @param {boolean} value
 * @return {!proto.rpc.ListenRequest} returns this
 */
proto.rpc.ListenRequest.prototype.setSkipVerify = function(value) {
  return jspb.Message.setProto3BooleanField(this, 8, value);
};


/**
 * optional bool use_configured_webhooks = 9;
 * @return {boolean}
 */
proto.rpc.ListenRequest.prototype.getUseConfiguredWebhooks = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 9, false));
};


/**
 * @param {boolean} value
 * @return {!proto.rpc.ListenRequest} returns this
 */
proto.rpc.ListenRequest.prototype.setUseConfiguredWebhooks = function(value) {
  return jspb.Message.setProto3BooleanField(this, 9, value);
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.rpc.ListenResponse.oneofGroups_ = [[1,2,3]];

/**
 * @enum {number}
 */
proto.rpc.ListenResponse.ContentCase = {
  CONTENT_NOT_SET: 0,
  STATE: 1,
  STRIPE_EVENT: 2,
  ENDPOINT_RESPONSE: 3
};

/**
 * @return {proto.rpc.ListenResponse.ContentCase}
 */
proto.rpc.ListenResponse.prototype.getContentCase = function() {
  return /** @type {proto.rpc.ListenResponse.ContentCase} */(jspb.Message.computeOneofCase(this, proto.rpc.ListenResponse.oneofGroups_[0]));
};



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
proto.rpc.ListenResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.rpc.ListenResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.rpc.ListenResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rpc.ListenResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    state: jspb.Message.getFieldWithDefault(msg, 1, 0),
    stripeEvent: (f = msg.getStripeEvent()) && common_pb.StripeEvent.toObject(includeInstance, f),
    endpointResponse: (f = msg.getEndpointResponse()) && proto.rpc.ListenResponse.EndpointResponse.toObject(includeInstance, f)
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
 * @return {!proto.rpc.ListenResponse}
 */
proto.rpc.ListenResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.rpc.ListenResponse;
  return proto.rpc.ListenResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.rpc.ListenResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.rpc.ListenResponse}
 */
proto.rpc.ListenResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.rpc.ListenResponse.State} */ (reader.readEnum());
      msg.setState(value);
      break;
    case 2:
      var value = new common_pb.StripeEvent;
      reader.readMessage(value,common_pb.StripeEvent.deserializeBinaryFromReader);
      msg.setStripeEvent(value);
      break;
    case 3:
      var value = new proto.rpc.ListenResponse.EndpointResponse;
      reader.readMessage(value,proto.rpc.ListenResponse.EndpointResponse.deserializeBinaryFromReader);
      msg.setEndpointResponse(value);
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
proto.rpc.ListenResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.rpc.ListenResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.rpc.ListenResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rpc.ListenResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = /** @type {!proto.rpc.ListenResponse.State} */ (jspb.Message.getField(message, 1));
  if (f != null) {
    writer.writeEnum(
      1,
      f
    );
  }
  f = message.getStripeEvent();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      common_pb.StripeEvent.serializeBinaryToWriter
    );
  }
  f = message.getEndpointResponse();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.rpc.ListenResponse.EndpointResponse.serializeBinaryToWriter
    );
  }
};


/**
 * @enum {number}
 */
proto.rpc.ListenResponse.State = {
  STATE_UNSPECIFIED: 0,
  STATE_LOADING: 1,
  STATE_RECONNECTING: 2,
  STATE_READY: 3,
  STATE_DONE: 4
};


/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.rpc.ListenResponse.EndpointResponse.oneofGroups_ = [[1,2]];

/**
 * @enum {number}
 */
proto.rpc.ListenResponse.EndpointResponse.ContentCase = {
  CONTENT_NOT_SET: 0,
  DATA: 1,
  ERROR: 2
};

/**
 * @return {proto.rpc.ListenResponse.EndpointResponse.ContentCase}
 */
proto.rpc.ListenResponse.EndpointResponse.prototype.getContentCase = function() {
  return /** @type {proto.rpc.ListenResponse.EndpointResponse.ContentCase} */(jspb.Message.computeOneofCase(this, proto.rpc.ListenResponse.EndpointResponse.oneofGroups_[0]));
};



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
proto.rpc.ListenResponse.EndpointResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.rpc.ListenResponse.EndpointResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.rpc.ListenResponse.EndpointResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rpc.ListenResponse.EndpointResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    data: (f = msg.getData()) && proto.rpc.ListenResponse.EndpointResponse.Data.toObject(includeInstance, f),
    error: jspb.Message.getFieldWithDefault(msg, 2, "")
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
 * @return {!proto.rpc.ListenResponse.EndpointResponse}
 */
proto.rpc.ListenResponse.EndpointResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.rpc.ListenResponse.EndpointResponse;
  return proto.rpc.ListenResponse.EndpointResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.rpc.ListenResponse.EndpointResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.rpc.ListenResponse.EndpointResponse}
 */
proto.rpc.ListenResponse.EndpointResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.rpc.ListenResponse.EndpointResponse.Data;
      reader.readMessage(value,proto.rpc.ListenResponse.EndpointResponse.Data.deserializeBinaryFromReader);
      msg.setData(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setError(value);
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
proto.rpc.ListenResponse.EndpointResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.rpc.ListenResponse.EndpointResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.rpc.ListenResponse.EndpointResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rpc.ListenResponse.EndpointResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getData();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.rpc.ListenResponse.EndpointResponse.Data.serializeBinaryToWriter
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 2));
  if (f != null) {
    writer.writeString(
      2,
      f
    );
  }
};





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
proto.rpc.ListenResponse.EndpointResponse.Data.prototype.toObject = function(opt_includeInstance) {
  return proto.rpc.ListenResponse.EndpointResponse.Data.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.rpc.ListenResponse.EndpointResponse.Data} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rpc.ListenResponse.EndpointResponse.Data.toObject = function(includeInstance, msg) {
  var f, obj = {
    status: jspb.Message.getFieldWithDefault(msg, 1, 0),
    httpMethod: jspb.Message.getFieldWithDefault(msg, 2, 0),
    url: jspb.Message.getFieldWithDefault(msg, 3, ""),
    eventId: jspb.Message.getFieldWithDefault(msg, 4, "")
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
 * @return {!proto.rpc.ListenResponse.EndpointResponse.Data}
 */
proto.rpc.ListenResponse.EndpointResponse.Data.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.rpc.ListenResponse.EndpointResponse.Data;
  return proto.rpc.ListenResponse.EndpointResponse.Data.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.rpc.ListenResponse.EndpointResponse.Data} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.rpc.ListenResponse.EndpointResponse.Data}
 */
proto.rpc.ListenResponse.EndpointResponse.Data.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setStatus(value);
      break;
    case 2:
      var value = /** @type {!proto.rpc.ListenResponse.EndpointResponse.Data.HttpMethod} */ (reader.readEnum());
      msg.setHttpMethod(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setUrl(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setEventId(value);
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
proto.rpc.ListenResponse.EndpointResponse.Data.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.rpc.ListenResponse.EndpointResponse.Data.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.rpc.ListenResponse.EndpointResponse.Data} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rpc.ListenResponse.EndpointResponse.Data.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStatus();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getHttpMethod();
  if (f !== 0.0) {
    writer.writeEnum(
      2,
      f
    );
  }
  f = message.getUrl();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getEventId();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
};


/**
 * @enum {number}
 */
proto.rpc.ListenResponse.EndpointResponse.Data.HttpMethod = {
  HTTP_METHOD_UNSPECIFIED: 0,
  HTTP_METHOD_GET: 1,
  HTTP_METHOD_POST: 2,
  HTTP_METHOD_DELETE: 3
};

/**
 * optional int64 status = 1;
 * @return {number}
 */
proto.rpc.ListenResponse.EndpointResponse.Data.prototype.getStatus = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.rpc.ListenResponse.EndpointResponse.Data} returns this
 */
proto.rpc.ListenResponse.EndpointResponse.Data.prototype.setStatus = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional HttpMethod http_method = 2;
 * @return {!proto.rpc.ListenResponse.EndpointResponse.Data.HttpMethod}
 */
proto.rpc.ListenResponse.EndpointResponse.Data.prototype.getHttpMethod = function() {
  return /** @type {!proto.rpc.ListenResponse.EndpointResponse.Data.HttpMethod} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {!proto.rpc.ListenResponse.EndpointResponse.Data.HttpMethod} value
 * @return {!proto.rpc.ListenResponse.EndpointResponse.Data} returns this
 */
proto.rpc.ListenResponse.EndpointResponse.Data.prototype.setHttpMethod = function(value) {
  return jspb.Message.setProto3EnumField(this, 2, value);
};


/**
 * optional string url = 3;
 * @return {string}
 */
proto.rpc.ListenResponse.EndpointResponse.Data.prototype.getUrl = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.rpc.ListenResponse.EndpointResponse.Data} returns this
 */
proto.rpc.ListenResponse.EndpointResponse.Data.prototype.setUrl = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string event_id = 4;
 * @return {string}
 */
proto.rpc.ListenResponse.EndpointResponse.Data.prototype.getEventId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.rpc.ListenResponse.EndpointResponse.Data} returns this
 */
proto.rpc.ListenResponse.EndpointResponse.Data.prototype.setEventId = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional Data data = 1;
 * @return {?proto.rpc.ListenResponse.EndpointResponse.Data}
 */
proto.rpc.ListenResponse.EndpointResponse.prototype.getData = function() {
  return /** @type{?proto.rpc.ListenResponse.EndpointResponse.Data} */ (
    jspb.Message.getWrapperField(this, proto.rpc.ListenResponse.EndpointResponse.Data, 1));
};


/**
 * @param {?proto.rpc.ListenResponse.EndpointResponse.Data|undefined} value
 * @return {!proto.rpc.ListenResponse.EndpointResponse} returns this
*/
proto.rpc.ListenResponse.EndpointResponse.prototype.setData = function(value) {
  return jspb.Message.setOneofWrapperField(this, 1, proto.rpc.ListenResponse.EndpointResponse.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.rpc.ListenResponse.EndpointResponse} returns this
 */
proto.rpc.ListenResponse.EndpointResponse.prototype.clearData = function() {
  return this.setData(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.rpc.ListenResponse.EndpointResponse.prototype.hasData = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional string error = 2;
 * @return {string}
 */
proto.rpc.ListenResponse.EndpointResponse.prototype.getError = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.rpc.ListenResponse.EndpointResponse} returns this
 */
proto.rpc.ListenResponse.EndpointResponse.prototype.setError = function(value) {
  return jspb.Message.setOneofField(this, 2, proto.rpc.ListenResponse.EndpointResponse.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.rpc.ListenResponse.EndpointResponse} returns this
 */
proto.rpc.ListenResponse.EndpointResponse.prototype.clearError = function() {
  return jspb.Message.setOneofField(this, 2, proto.rpc.ListenResponse.EndpointResponse.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.rpc.ListenResponse.EndpointResponse.prototype.hasError = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional State state = 1;
 * @return {!proto.rpc.ListenResponse.State}
 */
proto.rpc.ListenResponse.prototype.getState = function() {
  return /** @type {!proto.rpc.ListenResponse.State} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.rpc.ListenResponse.State} value
 * @return {!proto.rpc.ListenResponse} returns this
 */
proto.rpc.ListenResponse.prototype.setState = function(value) {
  return jspb.Message.setOneofField(this, 1, proto.rpc.ListenResponse.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.rpc.ListenResponse} returns this
 */
proto.rpc.ListenResponse.prototype.clearState = function() {
  return jspb.Message.setOneofField(this, 1, proto.rpc.ListenResponse.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.rpc.ListenResponse.prototype.hasState = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional StripeEvent stripe_event = 2;
 * @return {?proto.rpc.StripeEvent}
 */
proto.rpc.ListenResponse.prototype.getStripeEvent = function() {
  return /** @type{?proto.rpc.StripeEvent} */ (
    jspb.Message.getWrapperField(this, common_pb.StripeEvent, 2));
};


/**
 * @param {?proto.rpc.StripeEvent|undefined} value
 * @return {!proto.rpc.ListenResponse} returns this
*/
proto.rpc.ListenResponse.prototype.setStripeEvent = function(value) {
  return jspb.Message.setOneofWrapperField(this, 2, proto.rpc.ListenResponse.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.rpc.ListenResponse} returns this
 */
proto.rpc.ListenResponse.prototype.clearStripeEvent = function() {
  return this.setStripeEvent(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.rpc.ListenResponse.prototype.hasStripeEvent = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional EndpointResponse endpoint_response = 3;
 * @return {?proto.rpc.ListenResponse.EndpointResponse}
 */
proto.rpc.ListenResponse.prototype.getEndpointResponse = function() {
  return /** @type{?proto.rpc.ListenResponse.EndpointResponse} */ (
    jspb.Message.getWrapperField(this, proto.rpc.ListenResponse.EndpointResponse, 3));
};


/**
 * @param {?proto.rpc.ListenResponse.EndpointResponse|undefined} value
 * @return {!proto.rpc.ListenResponse} returns this
*/
proto.rpc.ListenResponse.prototype.setEndpointResponse = function(value) {
  return jspb.Message.setOneofWrapperField(this, 3, proto.rpc.ListenResponse.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.rpc.ListenResponse} returns this
 */
proto.rpc.ListenResponse.prototype.clearEndpointResponse = function() {
  return this.setEndpointResponse(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.rpc.ListenResponse.prototype.hasEndpointResponse = function() {
  return jspb.Message.getField(this, 3) != null;
};


goog.object.extend(exports, proto.rpc);
