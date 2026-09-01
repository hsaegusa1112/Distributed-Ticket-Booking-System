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

## Events interface

### `GET /events`

Returns the events and showings stored in PostgreSQL. `capacity` is the total venue capacity and `bookedAmount` is the number of confirmed tickets. This is an internal endpoint consumed by the API service.

```json
[
	{
		"id": "11111111-1111-1111-1111-111111111111",
		"title": "Afterlight",
		"eventType": "Cinema premiere",
		"imageUrl": "https://images.unsplash.com/...",
		"showings": [
			{
				"id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
				"startsAt": "2026-09-01T11:30:00Z",
				"capacity": 120,
				"bookedAmount": 0
			}
		]
	}
]
```

### `POST /bookings`

Creates a confirmed booking. This internal endpoint locks the selected showing while it checks remaining capacity and inserts the booking, preventing concurrent requests from overselling a showing.

```json
{
	"showingId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
	"customerId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
	"email": "guest@example.com",
	"quantity": 1
}
```

If successful, it returns the booking ID, total capacity, and updated booked amount. A request for more tickets than remain returns `409 Conflict`.

## Docker

From the repository root:

```bash
docker compose --profile booking up -d
```