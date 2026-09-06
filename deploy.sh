#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting backend deployment..."

# Navigate to the project root directory (where this script is located)
cd "$(dirname "$0")"

echo "📥 Pulling latest code from Git..."
git pull

echo "📦 Installing any new dependencies..."
npm install

echo "⚙️ Building the server..."
npm run build:server

echo "🔄 Restarting the server in PM2..."
pm2 restart monodeal-server

echo "✅ Backend deployment completed successfully!"
