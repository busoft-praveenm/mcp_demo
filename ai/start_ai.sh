#!/bin/bash
# Start the local AI server using llama.cpp

cd "$(dirname "$0")"

if [ ! -f "./llama.cpp/build/bin/llama-server" ]; then
    echo "Error: llama-server not found. Waiting for build to complete..."
    exit 1
fi

if [ ! -f "./model.gguf" ]; then
    echo "Error: model.gguf not found. Waiting for download to complete..."
    exit 1
fi

echo "Starting local AI server on http://127.0.0.1:8080..."
./llama.cpp/build/bin/llama-server -m ./model.gguf --port 8080 --host 127.0.0.1 -c 2048 -cb
