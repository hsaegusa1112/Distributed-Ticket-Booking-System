# Distributed Ticket Booking System

A microservice-based ticket booking system with a web client and independent API, authentication, and notification services.

## Packages

| Package | Stack | Local URL | Health check |
| --- | --- | --- | --- |
| `packages/web` | TanStack Start, React, Vite | `http://localhost:3000` | N/A |
| `packages/api` | Express | `http://localhost:8080` | `http://localhost:8080/health` |
| `packages/auth` | Go | `http://localhost:8081` | `http://localhost:8081/health` |
| `packages/notification` | FastAPI | `http://localhost:8082` | `http://localhost:8082/health` |
| `packages/booking` | Spring Boot | `http://localhost:8083` | `http://localhost:8083/actuator/health` |

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

### Database migrations

The `migrations` service uses Flyway and is started automatically by `docker compose up`. It waits for PostgreSQL to pass its health check, then applies the versioned SQL files in `migrations/`. Profile-enabled application services wait until this job completes successfully.

Run or re-run migrations without starting an application service:

```bash
docker compose run --rm migrations
```

View the migration job's output or inspect its recorded history:

```bash
docker compose logs migrations
docker compose exec postgres psql -U ticket_booking -d ticket_booking -c 'SELECT * FROM flyway_schema_history ORDER BY installed_rank;'
```

Create every database change as a new, sequentially versioned file. For example:

```text
migrations/V1__create_ticket_booking_schema.sql
migrations/V2__add_booking_reference.sql
```

Never modify a migration that has already been applied. Flyway stores its checksum in `flyway_schema_history` and will reject an altered migration. During local development, `docker compose down -v` removes the PostgreSQL volume, including both the schema and migration history; the next `docker compose up -d` applies all migrations from scratch.

`V2__add_users_and_seed_event_showings.sql` creates the shared `users` table, which stores a username and a password hash only. Password hashing and authentication must occur in the auth service; never send or store plaintext passwords in the database or web client.

The application services are opt-in Compose profiles. Infrastructure is unprofiled, so it starts with every profile selection.

```bash
# Infrastructure plus the Express API
docker compose --profile api up -d

# Infrastructure plus the Go auth service
docker compose --profile auth up -d

# Infrastructure plus the FastAPI notification service
docker compose --profile notification up -d

# Infrastructure plus the Spring Boot booking service
docker compose --profile booking up -d

# Infrastructure plus all containerized services
docker compose --profile api --profile auth --profile notification --profile booking up -d
```

Alternatively, set profiles once for a shell session:

```bash
export COMPOSE_PROFILES=api,auth,notification,booking
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

### Booking

```bash
cd packages/booking
npm run start
```

## Health Checks

Once services are running, verify them with:

```bash
curl http://localhost:8080/health
curl http://localhost:8081/health
curl http://localhost:8082/health
curl http://localhost:8083/actuator/health
```