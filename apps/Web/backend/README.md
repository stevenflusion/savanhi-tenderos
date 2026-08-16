# Admin-Marcas Backend (Node.js + Express)

Backend dedicado para la seccion Admin-Marcas. Usa `@repo/backend-core` para compartir auth JWT, PostgreSQL, health checks y manejo de errores con los otros backends.

## Preparacion

1. Copia variables de entorno:

```bash
cp .env.example .env
```

En PowerShell:

```powershell
Copy-Item .env.example .env
```

2. Instala dependencias desde la raiz del monorepo:

```bash
pnpm install
```

## Ejecucion

Desarrollo (hot reload con `nodemon`):

```bash
pnpm --filter admin-marcas-backend dev
```

Produccion local:

```bash
pnpm --filter admin-marcas-backend start
```

## Endpoints base

- `GET /health`
- `GET /api/v1/ping`
- `GET /api/v1/admin/status`
- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`
- `POST /auth/logout`

## Estructura

- `src/config`: configuracion y entorno.
- `src/routes`: rutas propias de Admin-Marcas.
- `@repo/backend-core`: auth JWT, PostgreSQL/Drizzle, middlewares base y health checks.

## Variables requeridas

Además de `NODE_ENV` y `PORT`, el backend necesita:

- `DATABASE_URL`
- `AUTH_JWT_SECRET`
- `CORS_ORIGINS`

## Base de datos

Desde la raiz, inicia PostgreSQL y aplica el esquema compartido:

```bash
docker compose up -d postgres
pnpm --filter @repo/backend-core db:migrate
pnpm --filter @repo/backend-core db:seed
```
