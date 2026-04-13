APP_NAME    := boogie-backend
IMAGE       := $(APP_NAME):latest
PORT        := 8080

.PHONY: build run test lint docker-build docker-run sqlc clean

build:
	go build -ldflags="-s -w" -o bin/server ./cmd/server

run:
	go run ./cmd/server

test:
	go test -v -race -coverprofile=coverage.out ./...

lint:
	golangci-lint run ./...

docker-build:
	docker build -t $(IMAGE) .

docker-run:
	docker run --rm -p $(PORT):$(PORT) --env-file .env $(IMAGE)

sqlc:
	sqlc generate

clean:
	rm -rf bin/ coverage.out

dev:
	air -c .air.toml
