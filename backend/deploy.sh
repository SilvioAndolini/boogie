#!/bin/bash
set -euo pipefail

SSH_HOST="${1:?Usage: ./deploy.sh <linode-ip>}"
REPO_DIR="/opt/boogie-repo"

echo "==> Pulling latest code on Linode..."
ssh root@"$SSH_HOST" "cd $REPO_DIR && git pull origin master"

echo "==> Building and deploying with Docker Compose..."
ssh root@"$SSH_HOST" << DEPLOY
set -e
cd $REPO_DIR

docker compose build api
docker compose up -d

echo "==> Waiting for health check..."
sleep 5

if docker compose ps api | grep -q "healthy"; then
    echo "==> Deploy successful!"
else
    echo "==> Warning: health check not passed yet. Check: docker compose logs api"
fi
DEPLOY

echo "==> Done!"
