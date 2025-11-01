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

echo "🔍 Building with $DOCKERFILE..."

# Build the Docker image
if sudo docker build -f $DOCKERFILE -t $TAG .; then
    echo "✅ Docker image built successfully!"
    echo "🏷️  Image tagged as: $TAG"
    echo ""
    echo "🚀 To run the container:"
    echo "   sudo docker run -p 3000:3000 $TAG"
    echo ""
    echo "🔍 To check the image:"
    echo "   sudo docker images | grep ielts-mock-test"
else
    echo "❌ Docker build failed!"
    echo "🔍 Check the error messages above for details."
    exit 1
fi
