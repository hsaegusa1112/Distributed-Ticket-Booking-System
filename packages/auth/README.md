# Auth Service

Go authentication service for the ticket-booking system.

## Run locally

```bash
npm run start
```

The service listens on `http://localhost:8081` by default. Set `PORT` to change it.

## Health check

```bash
curl http://localhost:8081/health
```

## Docker

From the repository root:

```bash
docker compose --profile auth up -d
```