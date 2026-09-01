# Booking Service

Spring Boot service for booking ticket showings.

## Run locally

Start the shared database first from the repository root:

```bash
docker compose up -d postgres
docker compose run --rm migrations
```

Then start the service from this directory:

```bash
npm run start
```

The service listens on `http://localhost:8083` and connects to PostgreSQL at `localhost:5432` by default.

## Configuration

| Variable | Default |
| --- | --- |
| `SERVER_PORT` | `8083` |
| `DB_URL` | `jdbc:postgresql://localhost:5432/ticket_booking` |
| `DB_USERNAME` | `ticket_booking` |
| `DB_PASSWORD` | `ticket_booking` |

## Health check

```bash
curl http://localhost:8083/actuator/health
```

The health response includes the PostgreSQL datasource status.

## Docker

From the repository root:

```bash
docker compose --profile booking up -d
```