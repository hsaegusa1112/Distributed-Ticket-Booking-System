# API Service

Express API service for the ticket-booking system.

## Run locally

```bash
yarn install
yarn start
```

The service listens on `http://localhost:8080` by default.

## Health check

```bash
curl http://localhost:8080/health
```

## Docker

From the repository root:

```bash
docker compose --profile api up -d
```