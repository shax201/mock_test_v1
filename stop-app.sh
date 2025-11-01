#!/bin/bash

echo "🛑 Stopping IELTS Mock Test Application..."

# Check if user is in docker group
if groups $USER | grep -q '\bdocker\b'; then
    echo "✅ User is in docker group"
    DOCKER_CMD="docker-compose"
else
    echo "⚠️  User is not in docker group, using sudo"
    DOCKER_CMD="sudo docker-compose"
fi

# Stop and remove all services
echo "🛑 Stopping all services..."
$DOCKER_CMD down

echo "🧹 Cleaning up volumes (optional)..."
read -p "Do you want to remove all data volumes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing all volumes..."
    $DOCKER_CMD down -v
    echo "✅ All data volumes removed!"
else
    echo "📦 Data volumes preserved"
fi

echo ""
echo "✅ Application stopped successfully!"
echo "🚀 Run './start-app.sh' to start again"
