# Auth Service

Go authentication service for the ticket-booking system.

It owns user credentials in PostgreSQL and exposes `POST /register` and `POST /login`. Passwords are bcrypt-hashed and login returns a 24-hour Bearer JWT.

## Run locally

```bash
npm run start
```

Start PostgreSQL and migrations first with `docker compose up -d`, then set `JWT_SECRET` before running locally:

```bash
JWT_SECRET=local-development-jwt-secret npm run start
```

The service listens on port `8081` by default. Set `PORT`, `DATABASE_URL`, `JWT_SECRET`, or `WEB_ORIGIN` to change its configuration.

## Health check

```bash
docker compose exec auth wget -qO- http://localhost:8081/health
```

## Internal endpoints

Registration and login are internal endpoints. Client applications must use the API gateway routes `POST /api/auth/register` and `POST /api/auth/login` on port `8080` instead.

```bash
curl -X POST http://localhost:8081/register \
	-H 'Content-Type: application/json' \
	-d '{"username":"new_user","password":"a-secure-password"}'

curl -X POST http://localhost:8081/login \
	-H 'Content-Type: application/json' \
	-d '{"username":"new_user","password":"a-secure-password"}'
```

## Docker

From the repository root:

```bash
docker compose --profile auth up -d
```