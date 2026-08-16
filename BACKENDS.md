# Backend architecture

The Clients, Delivery, Tenderos, and Web backends share `@repo/backend-core`. HTTP routers depend on application-facing repository methods; database rows and driver errors never cross the HTTP boundary.

## Local PostgreSQL

```bash
cp .env.example .env
docker compose up -d postgres
pnpm --filter @repo/backend-core db:migrate
pnpm --filter @repo/backend-core db:seed
pnpm --filter tenderos-backend dev
```

The database is PostgreSQL 16 with a persistent Compose volume and a healthcheck. `DATABASE_URL` points to it, while `AUTH_JWT_SECRET` signs access tokens. Use `pnpm --filter @repo/backend-core bootstrap:dev-admin` to create a local administrator.

## OTP email provider

Development uses `OTP_PROVIDER=development` and never logs the generated OTP. `OTP_DEV_CODE` may be set only outside production for deterministic local testing. Production must use `OTP_PROVIDER=external`; startup validation then requires:

- `OTP_EXTERNAL_URL`: provider HTTP endpoint accepting `POST` JSON `{ "to": "email", "code": "123456", "from": "sender" }`.
- `OTP_EXTERNAL_API_KEY`: bearer credential sent in the `Authorization` header.
- `OTP_EXTERNAL_FROM`: verified sender value forwarded as `from`.
- `OTP_EXTERNAL_TIMEOUT_MS`: positive timeout in milliseconds; defaults to `5000`.

The adapter uses native `fetch`, aborts timed-out requests, and maps timeout, network, upstream, and configuration failures to typed `OtpProviderError` values. No provider is bundled or assumed; configure a provider matching this contract before enabling `external`.

## Rate limiting

`RateLimiter` is the application boundary used by the HTTP middleware. The default implementation is process-local in-memory state and is intentionally suitable only for local development or a single backend instance. It is not shared across replicas and resets on restart. A Redis adapter can implement the same `check` contract later without changing routes or use cases; Redis is not mandatory for local development and is not added here.

## Shared flow

Each backend creates a context, which wires Drizzle PostgreSQL repositories and the JWT auth service. Controllers/routes validate input with Zod, call repository/use-case boundaries, and return the existing `{ data }`, `{ user }`, and `{ session }` response shapes.

## Production

The Tenderos backend has a non-root multi-stage Dockerfile at `apps/Tenderos/backend/Dockerfile`. Build it from the repository root with `docker build -f apps/Tenderos/backend/Dockerfile -t tenderos-backend .`.
