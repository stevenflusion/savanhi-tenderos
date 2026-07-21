# Arquitectura de Backends

El monorepo mantiene cuatro APIs separadas por dominio y un core compartido en TypeScript.

## Paquetes

- `apps/Admin-Marcas/backend`: administracion, marcas, usuarios y reportes.
- `apps/Clients/backend`: clientes, catalogo y compras.
- `apps/Delivery/backend`: repartidores, rutas y entregas.
- `apps/Tenderos/backend`: tiendas, productos, inventario y ordenes.
- `packages/backend-core`: Express, auth, Supabase, roles, errores, CORS, health checks y validacion compartida.
- `packages/api-contracts`: tipos compartidos para web, mobile y backend.

Nota:

- `admin` ya es el rol de acceso completo del backend.
- No existe un rol separado de `developer` en el modelo actual.

## Flujo de datos

Web y mobile no se conectan directo a Supabase. Solo consumen APIs HTTP.

```txt
Web / Mobile
  -> Backend API
    -> Router
      -> Repository
        -> BackendContext.db
          -> Supabase
```

La conexion base vive en `packages/backend-core/src/database/connection.ts` y se expone al servidor mediante `createBackendContext(env)`.

Cada backend crea un solo contexto en su `src/app.ts`:

```ts
const context = createBackendContext(env, { defaultRegistrationRole: "tendero" });
```

Los routers reciben ese contexto:

```ts
createApiRouter({ context, requireRole });
```

Reglas:

- `apps/*/backend` no debe crear clientes Supabase directamente.
- `apps/*/backend` no debe usar `.from(...)` en rutas.
- Web y mobile no deben importar `@repo/backend-core`.
- Web y mobile pueden importar tipos desde `@repo/api-contracts`.
- Toda query a Supabase debe pasar por repositories de `backend-core`.

## Puertos

- Admin-Marcas: `http://localhost:4000`
- Clients: `http://localhost:4100`
- Delivery: `http://localhost:4200`
- Tenderos: `http://localhost:4300`

## Variables requeridas

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AUTH_JWT_SECRET=
CORS_ORIGINS=
NODE_ENV=development
PORT=
```

Tambien se aceptan los nombres nuevos de Supabase:

```env
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` solo debe existir en backend. Web y mobile consumen las APIs propias.

## Configuracion local Supabase

Crear un `.env` en la raiz del monorepo:

```txt
savanhi_app/.env
```

Ejemplo:

```env
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:8082
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
AUTH_JWT_SECRET=replace-with-a-strong-local-secret
```

Si Supabase entrega llaves con los nombres nuevos, usar:

```env
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SECRET_KEY=your-supabase-secret-key
```

Reglas:

- El `.env` real no se commitea.
- `SUPABASE_SERVICE_ROLE_KEY` o `SUPABASE_SECRET_KEY` solo se usa en backend.
- `PORT` puede omitirse en el `.env` raiz porque cada backend define su puerto por defecto.
- Si un backend necesita variables propias, puede tener su propio `.env` dentro de `apps/*/backend`.

## Guia paso a paso

1. Crear el proyecto en Supabase.
2. Copiar `SUPABASE_URL` desde Project Settings.
3. Copiar la llave publica (`anon` o `publishable`) al `.env`.
4. Copiar la llave privada (`service_role` o `secret`) al `.env`.
5. Agregar `AUTH_JWT_SECRET` con una cadena fuerte local.
6. Ejecutar `supabase/migrations/0001_initial_schema.sql` en el SQL Editor de Supabase.
7. Compilar contratos y core:

```bash
pnpm --filter @repo/api-contracts build
pnpm --filter @repo/backend-core build
```

8. Probar conexion a base de datos:

```bash
pnpm --filter tenderos-backend exec node -e "(async () => { const { createEnv, createDatabaseConnection } = await import('@repo/backend-core'); const env = createEnv({ serviceName: 'supabase-test', defaultPort: 4300 }); const db = createDatabaseConnection(env); const { count, error } = await db.service.from('users').select('id', { count: 'exact', head: true }); console.log(JSON.stringify(error ? { ok: false, message: error.message, code: error.code } : { ok: true, count }, null, 2)); })().catch(error => { console.error(error.message); process.exit(1); });"
```

Resultado esperado:

```json
{
  "ok": true,
  "count": 0
}
```

`count` puede variar segun los registros existentes.

9. Levantar un backend:

```bash
pnpm --filter tenderos-backend dev
```

10. Probar health:

```bash
curl http://localhost:4300/health
```

11. Probar login o registro:

```bash
curl -X POST http://localhost:4300/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"fullName\":\"Usuario Demo\",\"email\":\"usuario@savanhi.com\",\"password\":\"Password123!\",\"role\":\"tendero\"}"
```

12. Crear un admin de desarrollo con acceso completo:

```bash
pnpm --filter @repo/backend-core bootstrap:dev-admin
```

Variables opcionales:

```env
DEV_ADMIN_EMAIL=dev.admin@savanhi.local
DEV_ADMIN_PASSWORD=ChangeMe123!
DEV_ADMIN_FULL_NAME=Developer Admin
```

Ese bootstrap:

- crea el usuario en Supabase Auth si no existe
- asegura el perfil en `public.users`
- le asigna el rol `admin`

## Resultado de prueba local

La conexion a Supabase se valido desde consola con el `.env` raiz cargado y una consulta `head` sobre `public.users`.

```json
{
  "ok": true,
  "count": null
}
```

Esto confirma que el backend pudo crear el cliente Supabase y consultar la base de datos. Si falta `AUTH_JWT_SECRET`, el backend falla antes de conectarse con el mensaje `Missing required environment variable: AUTH_JWT_SECRET`.

## Auth y tablas visibles en Supabase

Supabase ya crea y administra la tabla interna `auth.users`. No se debe crear una tabla publica llamada `users` para reemplazarla, porque las sesiones, contrasenas, refresh tokens y confirmaciones viven en Supabase Auth.

Para la aplicacion se usan estas tablas visibles en `public`:

- `public.roles`: catalogo de roles permitidos.
- `public.users`: usuario visible de la aplicacion, enlazado con `auth.users(id)` y `roles(id)`.
- `public.register`: historial simple de registros.
- `public.login`: historial simple de inicios de sesion.

Flujo:

```txt
POST /auth/register
  -> Supabase Auth crea auth.users
  -> backend-core crea/actualiza public.users
  -> backend-core registra public.register

POST /auth/login
  -> Supabase Auth valida credenciales
  -> backend-core lee/asegura public.users
  -> backend-core registra public.login
```

Para ver esto en Supabase:

1. Ir a `Authentication > Users` para ver los usuarios reales de Supabase Auth.
2. Ir a `Table Editor > roles` para ver los roles.
3. Ir a `Table Editor > users` para ver usuarios, rol y estado.
4. Ir a `Table Editor > register` para ver registros.
5. Ir a `Table Editor > login` para ver inicios de sesion.

## Endpoints comunes

Cada backend expone:

- `GET /health`
- `GET /api/v1/ping`
- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`
- `POST /auth/logout`
- `POST /auth/refresh`

Payloads auth:

```json
{
  "email": "usuario@savanhi.com",
  "password": "Password123!"
}
```

```json
{
  "fullName": "Usuario Demo",
  "email": "usuario@savanhi.com",
  "password": "Password123!",
  "role": "tendero"
}
```

Para rutas protegidas:

```txt
Authorization: Bearer <accessToken>
```

## Endpoints por dominio

Admin-Marcas:

- `GET /api/v1/admin/status`
- `GET /api/v1/admin/users`
- `PATCH /api/v1/admin/users/:id/status`
- `GET /api/v1/admin/brands`
- `POST /api/v1/admin/brands`
- `PATCH /api/v1/admin/brands/:id`
- `GET /api/v1/admin/reports/overview`

Clients:

- `GET /api/v1/clients/status`
- `GET /api/v1/clients/catalog/products`
- `GET /api/v1/clients/catalog/products/:id`
- `POST /api/v1/clients/orders`
- `GET /api/v1/clients/orders`
- `GET /api/v1/clients/orders/:id`
- `PATCH /api/v1/clients/orders/:id/cancel`

Tenderos:

- `GET /api/v1/tenderos/status`
- `GET /api/v1/tenderos/stores/me`
- `POST /api/v1/tenderos/stores`
- `GET /api/v1/tenderos/products`
- `POST /api/v1/tenderos/products`
- `PATCH /api/v1/tenderos/products/:id`
- `DELETE /api/v1/tenderos/products/:id`
- `GET /api/v1/tenderos/orders`
- `PATCH /api/v1/tenderos/orders/:id/status`

Delivery:

- `GET /api/v1/delivery/status`
- `GET /api/v1/delivery/orders/assigned`
- `PATCH /api/v1/delivery/orders/:id/status`
- `GET /api/v1/delivery/routes/today`
- `PATCH /api/v1/delivery/location`

## Modelo minimo Supabase

La version ejecutable esta en `supabase/migrations/0001_initial_schema.sql`.

```sql
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null check (name in ('admin', 'marca', 'client', 'tendero', 'delivery')),
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id),
  email text unique not null,
  full_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.register (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.login (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid references public.users(id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id),
  name text not null,
  address text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id),
  brand_id uuid references public.brands(id),
  name text not null,
  description text,
  price numeric(12,2) not null,
  stock integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  client_user_id uuid references public.users(id),
  store_id uuid references public.stores(id),
  status text not null check (status in ('pending','accepted','preparing','ready','assigned','delivered','cancelled')),
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  quantity integer not null,
  unit_price numeric(12,2) not null
);

create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id),
  delivery_user_id uuid references public.users(id),
  status text not null check (status in ('assigned','picked_up','on_route','delivered','failed')),
  created_at timestamptz not null default now()
);
```

## Comandos

```bash
pnpm --filter @repo/api-contracts build
pnpm --filter @repo/backend-core build
pnpm --filter clients-backend dev
pnpm --filter tenderos-backend dev
pnpm --filter admin-marcas-backend dev
pnpm --filter delivery-backend dev
```
