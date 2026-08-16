# Backend tracking

## Current blockers

- PostgreSQL must be running before any backend can access persistence.
- Auth OTP remains intentionally unavailable until an email delivery provider is selected; password login/register and JWT sessions are implemented.

## Verification

```bash
docker compose up -d postgres
pnpm --filter @repo/backend-core db:migrate
pnpm --filter @repo/backend-core db:seed
pnpm --filter @repo/backend-core check-types
pnpm --filter tenderos-backend check-types
```
