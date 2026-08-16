# Database migrations

From the repository root:

```bash
docker compose up -d postgres
pnpm --filter @repo/backend-core db:migrate
pnpm --filter @repo/backend-core db:seed
pnpm --filter @repo/backend-core bootstrap:dev-admin
```

Set `DATABASE_URL` and `AUTH_JWT_SECRET` in the root `.env` before running the commands. Generate a new migration after schema changes with `pnpm --filter @repo/backend-core db:generate`.

Authentication tests use the same local PostgreSQL database and are run with `pnpm --filter @repo/backend-core test`. They create uniquely named fixtures and remove them afterward.
