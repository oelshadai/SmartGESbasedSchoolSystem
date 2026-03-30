#!/bin/bash

# Debug build script for Render deployment
echo "=== Build Debug Information ==="
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

echo ""
echo "=== Looking for package.json ==="
find . -name "package.json" -type f

echo ""
echo "=== Node and npm versions ==="
node --version
npm --version

echo ""
echo "=== Attempting to install dependencies ==="
if [ -f "package.json" ]; then
    echo "Found package.json in current directory"
    npm install
    echo "=== Running build ==="
    npm run build
else
    echo "ERROR: package.json not found in current directory"
    echo "Available files:"
    ls -la
fi