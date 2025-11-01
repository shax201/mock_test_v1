#!/bin/bash

# Docker Build Script for IELTS Mock Test

set -e

echo "🔨 Building IELTS Mock Test Docker Image..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Use the main Dockerfile for production builds
echo "📦 Using production Dockerfile..."
DOCKERFILE="Dockerfile"
TAG="ielts-mock-test:latest"

# Load environment variables from docker.env if it exists
BUILD_ARGS=""
if [ -f "docker.env" ]; then
    echo "📄 Loading environment variables from docker.env..."
    # Read docker.env and convert to build args, handling quoted and unquoted values
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip empty lines and comments
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        
        # Remove leading/trailing whitespace
        line=$(echo "$line" | xargs)
        [[ -z "$line" ]] && continue
        
        # Split on first = only
        key="${line%%=*}"
        value="${line#*=}"
        
        # Remove leading/trailing whitespace from key and value
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs)
        
        # Remove quotes from value if present
        value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        
        # Skip if key or value is empty
        [[ -z "$key" || -z "$value" ]] && continue
        
        # Escape special characters in value for build arg
        BUILD_ARGS="$BUILD_ARGS --build-arg ${key}=${value}"
    done < docker.env
    echo "✅ Loaded environment variables"
else
    echo "⚠️  docker.env not found. Using defaults or build will fail if required args are missing."
fi

echo "🔍 Building with $DOCKERFILE..."

# Build the Docker image with build arguments
if docker build -f $DOCKERFILE -t $TAG $BUILD_ARGS .; then
    echo "✅ Docker image built successfully!"
    echo "🏷️  Image tagged as: $TAG"
    echo ""
    echo "🚀 To run the container:"
    echo "   docker run -p 3000:3000 --env-file docker.env $TAG"
    echo ""
    echo "🔍 To check the image:"
    echo "   docker images | grep ielts-mock-test"
else
    echo "❌ Docker build failed!"
    echo "🔍 Check the error messages above for details."
    exit 1
fi
