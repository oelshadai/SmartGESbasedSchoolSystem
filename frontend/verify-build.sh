#!/bin/bash

# Build verification script for frontend deployment
echo "🔍 Frontend Build Verification"
echo "=============================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json not found in current directory"
    echo "Current directory: $(pwd)"
    echo "Contents:"
    ls -la
    exit 1
fi

echo "✅ Found package.json"

# Check Node and npm versions
echo ""
echo "📋 Environment Info:"
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm ci

if [ $? -ne 0 ]; then
    echo "❌ npm ci failed"
    exit 1
fi

echo "✅ Dependencies installed"

# Build the project
echo ""
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed"

# Verify build output
echo ""
echo "📁 Build output verification:"
if [ -d "dist" ]; then
    echo "✅ dist directory exists"
    if [ -f "dist/index.html" ]; then
        echo "✅ index.html exists in dist"
        echo "📊 Build output size:"
        du -sh dist/
        echo "📄 Files in dist:"
        ls -la dist/
    else
        echo "❌ index.html not found in dist"
        exit 1
    fi
else
    echo "❌ dist directory not found"
    exit 1
fi

echo ""
echo "🎉 Build verification completed successfully!"
echo "Ready for deployment to Render."