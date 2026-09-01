# Notification Service

FastAPI notification service for the ticket-booking system.

The service consumes durable `booking.confirmed` messages from RabbitMQ and sends each booking confirmation through SMTP. Failed SMTP deliveries are returned to the queue for retry.

## Configuration

| Variable | Default |
| --- | --- |
| `RABBITMQ_HOST` | `localhost` |
| `RABBITMQ_USERNAME` | `ticket_booking` |
| `RABBITMQ_PASSWORD` | `ticket_booking` |
| `SMTP_HOST` | `localhost` |
| `SMTP_PORT` | `1025` |
| `SMTP_FROM` | `tickets@example.com` |

In Docker Compose, the service uses the bundled Mailpit SMTP server at `mailpit:1025`. View captured confirmation emails at `http://localhost:8025`.

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