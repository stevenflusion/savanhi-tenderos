# TRACKING - Seguimiento de Reparación del Proyecto

**Fecha**: 2026-07-18
**Estado**: ✅ Proyecto corriendo en local

---

## Estado Inicial (Lo que NO funcionaba)

1. **Node.js / pnpm incompatibles**
   - `package.json` exige `pnpm@11.7.0` + Node `>=18`
   - Node 24.18.0 tiene bug en pnpm@11 (SyntaxError: Private field '#e')
   - Node 20.20.2: pnpm@11 requiere Node 22.13+

2. **Variables de entorno faltantes**
   - Root `.env` vacío (solo comentario)
   - 4 backends sin `.env` (solo `.env.example`)
   - Mobile app sin `.env`

3. **Bug crítico en carga de .env** (`packages/backend-core/src/env.ts`)
   - `loadEnvFiles()` caminaba de cwd → root
   - Cargaba `.env` de root AL FINAL con `override: true`
   - El `PORT=3000` del root ganaba sobre `PORT=4300` del backend
   - Línea 24: `Object.assign(process.env, currentEnv)` restauraba env original DESPUÉS de cargar .env

---

## Problemas Identificados

| # | Problema | Archivo | Severidad |
|---|----------|---------|-----------|
| 1 | pnpm@11.7.0 incompatible con Node disponible | `package.json:17` | 🔴 Bloqueante |
| 2 | Root `.env` sin credenciales Supabase | `/.env` | 🔴 Bloqueante |
| 3 | Backends sin `.env` propios | `apps/*/backend/.env` | 🔴 Bloqueante |
| 4 | Mobile sin `.env` | `apps/Tenderos/mobile/.env` | 🟡 Requerido para mapas |
| 5 | Bug carga .env: root sobrescribe app | `packages/backend-core/src/env.ts:24` | 🔴 Bloqueante |

---

## Soluciones Aplicadas

### 1. Fix Node/pnpm
```bash
# Instalar Node 22 vía fnm
fnm install 22 && fnm use 22

# Downgrade pnpm a v10 (compatible con Node 22)
npm install -g pnpm@10
```
**Resultado**: `pnpm install` y `pnpm run build` funcionan.

### 2. Root `.env` con credenciales reales
**Archivo**: `/.env`
```env
SUPABASE_URL=https://XXXXXXXX.supabase.co
SUPABASE_ANON_KEY=sb_publishable_F_-XXXXXXXX
SUPABASE_SERVICE_ROLE_KEY=XXXXXX...
AUTH_JWT_SECRET=XXXX
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:8082
```
> **Nota**: Sacado `PORT` del root para que no pise a backends.

### 3. `.env` por backend (con puertos correctos)
| Backend | Archivo | Puerto |
|---------|---------|--------|
| Tenderos | `apps/Tenderos/backend/.env` | 4300 |
| Clients | `apps/Clients/backend/.env` | 4100 |
| Delivery | `apps/Delivery/backend/.env` | 4200 |
| Web (Admin-Marcas) | `apps/Web/backend/.env` | 4000 |

Cada uno con: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_JWT_SECRET`, `PORT`, `CORS_ORIGINS`

### 4. `.env` Mobile
**Archivo**: `apps/Tenderos/mobile/.env`
```env
MAPBOX_ACCESS_TOKEN=pk.ey_xxxxx  # ⚠️ REEMPLAZAR con token real
EXPO_PUBLIC_TENDEROS_API_URL=http://localhost:4300
```

### 5. **Fix crítico: Orden de carga .env** 
**Archivo**: `packages/backend-core/src/env.ts`

**Antes (bug)**:
```typescript
// Cargaba root → app, root ganaba por override: true
for (const envFile of envFiles) {
  dotenv.config({ path: envFile, override: true });
}
Object.assign(process.env, currentEnv); // ¡RESTAURABA env original!
```

**Después (fix)**:
```typescript
// Carga root → app, pero app carga ÚLTIMO y gana
for (const envFile of envFiles.reverse()) {
  dotenv.config({ path: envFile, override: true });
}
// Eliminado Object.assign que restauraba env original
```

**Rebuild requerido**:
```bash
pnpm --filter @repo/backend-core build
```

---

## Verificación - Servicios Corriendo

| Servicio | Comando | Puerto | Health Check |
|----------|---------|--------|--------------|
| Tenderos Backend | `pnpm --filter tenderos-backend dev` | 4300 | `GET /api/v1/tenderos/status` ✅ |
| Clients Backend | `pnpm --filter clients-backend dev` | 4100 | `GET /api/v1/clients/status` (404 = vivo) ✅ |
| Delivery Backend | `pnpm --filter delivery-backend dev` | 4200 | `GET /health` ✅ |
| Web Backend | `pnpm --filter admin-marcas-backend dev` | 4000 | `GET /health` ✅ |
| Tenderos Web | `pnpm --filter tenderos-web dev` | 3001 | `GET /` ✅ |
| Web Enterprise | `pnpm --filter web-enterprise dev` | 3001 | `GET /` ✅ |
| Tenderos Mobile | `pnpm --filter tenderos-mobile dev` | 8082 | Metro bundler ✅ |

---

## Comandos de Desarrollo (Quick Reference)

```bash
# 1. Usar Node 22 (si no está activo)
fnm use 22

# 2. Instalar deps (solo primera vez)
pnpm install

# 3. Build packages compartidos
pnpm --filter @repo/api-contracts build
pnpm --filter @repo/backend-core build

# 4. Levantar backends (terminales separadas)
pnpm --filter tenderos-backend dev      # :4300
pnpm --filter clients-backend dev       # :4100
pnpm --filter delivery-backend dev      # :4200
pnpm --filter admin-marcas-backend dev  # :4000

# 5. Levantar frontends (terminales separadas)
pnpm --filter tenderos-web dev          # :3001
pnpm --filter web-enterprise dev        # :3001 (auto-switch)
pnpm --filter tenderos-mobile dev       # :8082 (Expo)

# 6. Health checks rápidos
curl http://localhost:4300/api/v1/tenderos/status
curl http://localhost:4200/health
curl http://localhost:4000/health
```

---

## Pendientes Conocidos (Deuda Técnica)

| Item | Descripción | Prioridad |
|------|-------------|-----------|
| Migración Supabase | Ejecutar `supabase/migrations/0001_initial_schema.sql` en SQL Editor | 🔴 Alta |
| Admin Dev | `pnpm --filter @repo/backend-core bootstrap:dev-admin` | 🔴 Alta |
| MAPBOX_TOKEN | Reemplazar placeholder en `apps/Tenderos/mobile/.env` | 🟡 Media |
| TypeScript versions | Root: 5.9.2 vs Packages: ^6.0.3 | 🟢 Baja |
| pnpm version lock | package.json dice 11.7.0 pero usa 10.x | 🟢 Baja |
| Tests | No hay tests unitarios/integration/e2e configurados | 🟡 Media |

---

## Próximos Pasos Inmediatos (para seguir desarrollando)

1. **Ejecutar migración BD**: Ir a Supabase Dashboard → SQL Editor → pegar `supabase/migrations/0001_initial_schema.sql` → Run
2. **Crear admin dev**: `pnpm --filter @repo/backend-core bootstrap:dev-admin` (configurar `DEV_ADMIN_EMAIL/PASSWORD` en `.env` si se desea)
3. **Probar auth**: `curl -X POST http://localhost:4300/auth/register ...`
4. **Conectar frontends**: Verificar que web/mobile consumen APIs reales (no mocks)

---

*Generado automáticamente tras reparación del proyecto - 2026-07-18*