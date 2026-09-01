# Database Migrations

Flyway runs every sequentially versioned SQL file in this directory when you execute:

```bash
docker compose run --rm migrations
```

Create new migrations using the format `V<version>__<description>.sql`. Never edit a migration after it has been applied; create the next version instead.

## Development users

`V3__seed_development_users.sql` creates these local-only accounts:

| Username | Password |
| --- | --- |
| `demo_admin` | `password` |
| `demo_guest` | `password` |

The database stores bcrypt hashes, not plaintext passwords. Remove these seeded accounts from any production database through a new migration.