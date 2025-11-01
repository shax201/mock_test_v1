#!/bin/bash

# IELTS Mock Test Docker Startup Script

set -e

echo "🚀 Starting IELTS Mock Test with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p uploads test-results

# Set proper permissions
echo "🔐 Setting permissions..."
chmod 755 uploads test-results

# Check if .env.local exists, if not copy from docker.env
if [ ! -f .env.local ]; then
    echo "📋 Creating .env.local from docker.env template..."
    cp docker.env .env.local
    echo "⚠️  Please edit .env.local with your actual configuration values before continuing."
    echo "   Press Enter when you're ready to continue..."
    read
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Check application health
echo "🏥 Checking application health..."
sleep 5

if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Application is healthy and running!"
    echo ""
    echo "🌐 Access your application at: http://localhost:3000"
    echo "🗄️  Database is available at: localhost:5432"
    echo "📊 Redis is available at: localhost:6379"
    echo ""
    echo "📝 Useful commands:"
    echo "   View logs: docker-compose logs -f"
    echo "   Stop services: docker-compose down"
    echo "   Restart: docker-compose restart"
    echo "   Database shell: docker-compose exec postgres psql -U ielts_user -d ielts_mock_test"
else
    echo "❌ Application health check failed. Check logs with: docker-compose logs app"
    exit 1
fi
