#!/bin/bash

# S.I.E. Automated Backup & Maintenance Script
# v3.1.0

echo "--- Starting S.I.E. Maintenance Cycle: $(date) ---"

# 1. Backup Database (JSON & YAML)
echo "[1/4] Generating System Backup..."
node scripts/backup-system.js

# 2. Check for Git Updates
echo "[2/4] Checking for updates..."
git fetch
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse @{u})

if [ $LOCAL != $REMOTE ]; then
    echo "🚀 New version detected. Deploying..."
    ./deploy.sh
else
    echo "✅ System is up to date."
fi

# 3. Health Check & Restart if needed
echo "[3/4] Checking Node.js process health..."
if ! pgrep -f "server.cjs" > /dev/null; then
    echo "⚠️  Backend stopped. Restarting..."
    pm2 restart sie-backend
fi

# 4. Cleanup Logs
echo "[4/4] Cleaning old logs..."
pm2 flush
# Remove backups older than 30 days
find storage/backups -type f -mtime +30 -name "*.json" -delete
find storage/backups -type f -mtime +30 -name "*.yaml" -delete

echo "--- Cycle Complete ---"
