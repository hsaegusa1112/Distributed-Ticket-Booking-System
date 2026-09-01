# API Service

Express API service for the ticket-booking system.

## Run locally

```bash
yarn install
yarn start
```

The service listens on `http://localhost:8080` by default.

Set `JWT_SECRET` to the same value used by the auth service. The API validates its Bearer JWTs locally.

## API endpoints

| Method | Path | Authentication | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | None | Reports API availability. |
| `POST` | `/api/auth/register` | None | Creates a user through the Auth service. |
| `POST` | `/api/auth/login` | None | Returns a Bearer JWT from the Auth service. |
| `GET` | `/api/me` | Bearer JWT | Returns the authenticated user's ID and username. |
| `GET` | `/api/events` | None | Lists events and their showings from the Booking service. |
| `GET` | `/api/stores` | None | Lists ticket stores from PostgreSQL. |
| `POST` | `/api/bookings` | Bearer JWT | Creates a confirmed booking for a showing. |

## Authentication

The API is the public entry point for authentication. It forwards requests to the internal Auth service; clients must not call Auth directly.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Creates a user with a bcrypt-hashed password. |
| `POST` | `/api/auth/login` | Validates credentials and returns a 24-hour Bearer JWT. |

### `POST /api/auth/register`

```bash
curl -i -X POST http://localhost:8080/api/auth/register \
	-H 'Content-Type: application/json' \
	-d '{"username":"new_user","password":"a-secure-password"}'
```

Successful response: `201 Created`.

```json
{ "status": "registered" }
```

Usernames must contain 3-64 characters; passwords must contain at least 8. A duplicate username returns `409 Conflict`.

### `POST /api/auth/login`

```bash
curl -X POST http://localhost:8080/api/auth/login \
	-H 'Content-Type: application/json' \
	-d '{"username":"new_user","password":"a-secure-password"}'
```

Successful response:

```json
{
	"accessToken": "<jwt>",
	"tokenType": "Bearer",
	"expiresIn": 86400
}
```

Invalid credentials return `401 Unauthorized`.

### `GET /api/events`

Returns the event catalogue and its showings. `capacity` is the total venue capacity and `bookedAmount` is the number of confirmed tickets. The API obtains this data from the internal Booking service.

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

### `GET /api/stores`

Returns the seeded ticket-store catalogue. The API caches the PostgreSQL response in Redis for five minutes and falls back to PostgreSQL if Redis is unavailable.

```json
[
	{
		"id": "44444444-4444-4444-4444-444444444441",
		"name": "Midtown Box Office",
		"address": "123 Market Street",
		"city": "San Francisco",
		"phone": "+1-415-555-0141"
	}
]
```

### `POST /api/bookings`

Creates a one-or-more-ticket booking for the authenticated user. The user ID is read from the Bearer JWT; clients cannot choose it. Requests that exceed the remaining capacity return `409 Conflict`.

```bash
curl -X POST http://localhost:8080/api/bookings \
	-H 'Authorization: Bearer <access-token>' \
	-H 'Content-Type: application/json' \
	-d '{"showingId":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","email":"guest@example.com","quantity":1}'
```

Successful response:

```json
{ "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "capacity": 120, "bookedAmount": 1 }
```

### `GET /health`

```bash
curl http://localhost:8080/health
```

Example response:

```json
{
	"status": "ok",
	"timestamp": "2026-09-01T12:00:00.000Z",
	"uptime": 42.5
}
```

### `GET /api/me`

Obtain an access token from `POST /api/auth/login`, then provide it in the `Authorization` header:

```bash
curl http://localhost:8080/api/me \
	-H 'Authorization: Bearer <access-token>'
```

Example response:

```json
{
	"user": {
		"id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
		"username": "demo_admin"
	}
}
```

The token must be a non-expired HS256 JWT signed with the configured `JWT_SECRET` and contain `sub` and `username` claims.

If authentication fails, the endpoint returns `401 Unauthorized` with an `error` field, such as:

```json
{ "error": "missing bearer token" }
```

## Docker

From the repository root:

```bash
docker compose --profile api --profile auth --profile booking up -d
```