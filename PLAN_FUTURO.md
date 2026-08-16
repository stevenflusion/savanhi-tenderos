# Backend delivery plan

- Run PostgreSQL with `docker compose up -d postgres`.
- Apply migrations with `pnpm --filter @repo/backend-core db:migrate`.
- Seed roles with `pnpm --filter @repo/backend-core db:seed`.
- Start Tenderos with `pnpm --filter tenderos-backend dev`.
- Run focused validation with `pnpm --filter @repo/backend-core check-types` and the backend package checks.

Database changes belong in Drizzle schema and generated migrations. Secrets belong in local environment files and must not be committed.
