#!/bin/bash

OUT_DIR=./src/rpc
PROTO_DIR="$(go env GOPATH)/src/github.com/stripe/stripe-cli/rpc"
PROTOC="$(npm bin)/grpc_tools_node_protoc"
PROTOC_GEN_TS="$(npm bin)/protoc-gen-ts"

echo "Compiling proto files in ${PROTO_DIR} to ${OUT_DIR} ..."

$PROTOC \
  --proto_path=${PROTO_DIR} \
  --plugin=protoc-gen-ts=${PROTOC_GEN_TS} \
  --js_out=import_style=commonjs,binary:${OUT_DIR} \
  --grpc_out=grpc_js:${OUT_DIR} \
  --ts_out=service=grpc-node,mode=grpc-js:${OUT_DIR} \
  ${PROTO_DIR}/*.proto

if [ $? -eq 0 ]; then
  echo "Done!"
else
  echo "PROTOC FAILED"
fi
