// source: webhook_endpoints_list.proto
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

goog.exportSymbol('proto.rpc.WebhookEndpointsListRequest', null, global);
goog.exportSymbol('proto.rpc.WebhookEndpointsListResponse', null, global);
goog.exportSymbol('proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData', null, global);
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
proto.rpc.WebhookEndpointsListRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.rpc.WebhookEndpointsListRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.rpc.WebhookEndpointsListRequest.displayName = 'proto.rpc.WebhookEndpointsListRequest';
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
proto.rpc.WebhookEndpointsListResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.rpc.WebhookEndpointsListResponse.repeatedFields_, null);
};
goog.inherits(proto.rpc.WebhookEndpointsListResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.rpc.WebhookEndpointsListResponse.displayName = 'proto.rpc.WebhookEndpointsListResponse';
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
proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.repeatedFields_, null);
};
goog.inherits(proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.displayName = 'proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData';
}



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
proto.rpc.WebhookEndpointsListRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.rpc.WebhookEndpointsListRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.rpc.WebhookEndpointsListRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rpc.WebhookEndpointsListRequest.toObject = function(includeInstance, msg) {
  var f, obj = {

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
 * @return {!proto.rpc.WebhookEndpointsListRequest}
 */
proto.rpc.WebhookEndpointsListRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.rpc.WebhookEndpointsListRequest;
  return proto.rpc.WebhookEndpointsListRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.rpc.WebhookEndpointsListRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.rpc.WebhookEndpointsListRequest}
 */
proto.rpc.WebhookEndpointsListRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
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
proto.rpc.WebhookEndpointsListRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.rpc.WebhookEndpointsListRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.rpc.WebhookEndpointsListRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rpc.WebhookEndpointsListRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.rpc.WebhookEndpointsListResponse.repeatedFields_ = [1];



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
proto.rpc.WebhookEndpointsListResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.rpc.WebhookEndpointsListResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.rpc.WebhookEndpointsListResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rpc.WebhookEndpointsListResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    endpointsList: jspb.Message.toObjectList(msg.getEndpointsList(),
    proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.toObject, includeInstance)
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
 * @return {!proto.rpc.WebhookEndpointsListResponse}
 */
proto.rpc.WebhookEndpointsListResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.rpc.WebhookEndpointsListResponse;
  return proto.rpc.WebhookEndpointsListResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.rpc.WebhookEndpointsListResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.rpc.WebhookEndpointsListResponse}
 */
proto.rpc.WebhookEndpointsListResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData;
      reader.readMessage(value,proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.deserializeBinaryFromReader);
      msg.addEndpoints(value);
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
proto.rpc.WebhookEndpointsListResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.rpc.WebhookEndpointsListResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.rpc.WebhookEndpointsListResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rpc.WebhookEndpointsListResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getEndpointsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.serializeBinaryToWriter
    );
  }
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.repeatedFields_ = [2];



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
proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.prototype.toObject = function(opt_includeInstance) {
  return proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.toObject = function(includeInstance, msg) {
  var f, obj = {
    application: jspb.Message.getFieldWithDefault(msg, 1, ""),
    enabledeventsList: (f = jspb.Message.getRepeatedField(msg, 2)) == null ? undefined : f,
    url: jspb.Message.getFieldWithDefault(msg, 3, ""),
    status: jspb.Message.getFieldWithDefault(msg, 4, "")
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
 * @return {!proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData}
 */
proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData;
  return proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData}
 */
proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setApplication(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.addEnabledevents(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setUrl(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setStatus(value);
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
proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getApplication();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getEnabledeventsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
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
  f = message.getStatus();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
};


/**
 * optional string application = 1;
 * @return {string}
 */
proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.prototype.getApplication = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData} returns this
 */
proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.prototype.setApplication = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * repeated string enabledEvents = 2;
 * @return {!Array<string>}
 */
proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.prototype.getEnabledeventsList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 2));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData} returns this
 */
proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.prototype.setEnabledeventsList = function(value) {
  return jspb.Message.setField(this, 2, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData} returns this
 */
proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.prototype.addEnabledevents = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 2, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData} returns this
 */
proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.prototype.clearEnabledeventsList = function() {
  return this.setEnabledeventsList([]);
};


/**
 * optional string url = 3;
 * @return {string}
 */
proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.prototype.getUrl = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData} returns this
 */
proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.prototype.setUrl = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string status = 4;
 * @return {string}
 */
proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.prototype.getStatus = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData} returns this
 */
proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData.prototype.setStatus = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * repeated WebhookEndpointData endpoints = 1;
 * @return {!Array<!proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData>}
 */
proto.rpc.WebhookEndpointsListResponse.prototype.getEndpointsList = function() {
  return /** @type{!Array<!proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData, 1));
};


/**
 * @param {!Array<!proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData>} value
 * @return {!proto.rpc.WebhookEndpointsListResponse} returns this
*/
proto.rpc.WebhookEndpointsListResponse.prototype.setEndpointsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData=} opt_value
 * @param {number=} opt_index
 * @return {!proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData}
 */
proto.rpc.WebhookEndpointsListResponse.prototype.addEndpoints = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.rpc.WebhookEndpointsListResponse.WebhookEndpointData, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.rpc.WebhookEndpointsListResponse} returns this
 */
proto.rpc.WebhookEndpointsListResponse.prototype.clearEndpointsList = function() {
  return this.setEndpointsList([]);
};


goog.object.extend(exports, proto.rpc);