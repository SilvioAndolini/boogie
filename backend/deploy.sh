#!/bin/bash
set -euo pipefail

DEPLOY_DIR="/opt/boogie-backend"
IMAGE_NAME="boogie-backend:latest"
SSH_HOST="${1:?Usage: ./deploy.sh <linode-ip>}"

echo "==> Building Docker image..."
docker build -t "$IMAGE_NAME" ./backend

echo "==> Saving image..."
docker save "$IMAGE_NAME" | ssh root@"$SSH_HOST" "docker load"

echo "==> Deploying on Linode..."
ssh root@"$SSH_HOST" << 'DEPLOY'
set -e
IMAGE="boogie-backend:latest"
CONTAINER="boogie-backend"

if [ "$(docker ps -q -f name=$CONTAINER)" ]; then
    echo "Stopping existing container..."
    docker stop $CONTAINER
    docker rm $CONTAINER
fi

docker run -d \
    --name $CONTAINER \
    --restart unless-stopped \
    --env-file /opt/boogie-backend/.env \
    -p 8080:8080 \
    $IMAGE

sleep 3

if docker ps -q -f name=$CONTAINER; then
    echo "==> Deploy successful!"
else
    echo "==> Check: docker logs $CONTAINER"
fi
DEPLOY

echo "==> Done!"
