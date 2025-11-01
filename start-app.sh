#!/bin/bash

echo "🚀 Starting IELTS Mock Test Application (Full Stack)..."

# Check if user is in docker group
if groups $USER | grep -q '\bdocker\b'; then
    echo "✅ User is in docker group"
    DOCKER_CMD="docker-compose"
else
    echo "⚠️  User is not in docker group, using sudo"
    echo "   To fix this permanently, run: sudo usermod -aG docker $USER"
    echo "   Then log out and log back in, or run: newgrp docker"
    echo ""
    DOCKER_CMD="sudo docker-compose"
fi

echo "🐳 Starting full stack with docker-compose..."
echo "🌐 Application will be available at: http://localhost:3000"
echo "🗄️  Database available at: localhost:5432"
echo "📊 Redis available at: localhost:6379"
echo ""

# Start the full stack
$DOCKER_CMD up
