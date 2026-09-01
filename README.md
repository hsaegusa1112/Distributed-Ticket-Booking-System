# Distributed Ticket Booking System

A microservice-based ticket booking system with a web client and independent API, authentication, and notification services.

## Packages

| Package | Stack | Local URL | Health check |
| --- | --- | --- | --- |
| `packages/web` | TanStack Start, React, Vite | `http://localhost:3000` | N/A |
| `packages/api` | Express | `http://localhost:8080` | `http://localhost:8080/health` |
| `packages/auth` | Go | `http://localhost:8081` | `http://localhost:8081/health` |
| `packages/notification` | FastAPI | `http://localhost:8082` | `http://localhost:8082/health` |

## Prerequisites

- Docker Desktop and Docker Compose for the infrastructure and containerized services
- Node.js for the web and API packages
- Go 1.27 for the auth package
- Python 3.11+ and [uv](https://docs.astral.sh/uv/) for the notification package

## Docker Compose

Docker Compose provisions the shared infrastructure by default:

| Service | Address | Local credentials |
| --- | --- | --- |
| PostgreSQL | `localhost:5432` | database/user/password: `ticket_booking` |
| Redis | `localhost:6379` | N/A |
| RabbitMQ AMQP | `localhost:5672` | user/password: `ticket_booking` |
| RabbitMQ management UI | `http://localhost:15672` | user/password: `ticket_booking` |

Start infrastructure only:

```bash
docker compose up -d
```

Flyway applies SQL migrations from `migrations/` before profile-enabled application services start. Run migrations on demand with:

```bash
docker compose run --rm migrations
```

Add each database change as a new versioned file, for example `migrations/V2__add_booking_reference.sql`. Do not modify an already-applied migration.

The application services are opt-in Compose profiles. Infrastructure is unprofiled, so it starts with every profile selection.

```bash
# Infrastructure plus the Express API
docker compose --profile api up -d

# Infrastructure plus the Go auth service
docker compose --profile auth up -d

# Infrastructure plus the FastAPI notification service
docker compose --profile notification up -d

# Infrastructure plus all containerized services
docker compose --profile api --profile auth --profile notification up -d
```

Alternatively, set profiles once for a shell session:

```bash
export COMPOSE_PROFILES=api,auth,notification
docker compose up -d
```

Useful Compose commands:

```bash
docker compose ps
docker compose logs -f
docker compose down
docker compose down -v # Removes local PostgreSQL, Redis, and RabbitMQ data
```

## Run Packages Locally

Run these commands from the specified package directory.

### Web

```bash
cd packages/web
npm install
npm run dev
```

### API

```bash
cd packages/api
yarn install
yarn start
```

### Auth

```bash
cd packages/auth
make run
```

### Notification

```bash
cd packages/notification
uv sync
npm run dev
```

## Health Checks

Once services are running, verify them with:

```bash
curl http://localhost:8080/health
curl http://localhost:8081/health
curl http://localhost:8082/health
```