# Notification Service

FastAPI notification service for the ticket-booking system.

## Run locally

```bash
uv sync
npm run dev
```

The service listens on `http://localhost:8082`.

## Health check

```bash
curl http://localhost:8082/health
```

## Docker

From the repository root:

```bash
docker compose --profile notification up -d
```