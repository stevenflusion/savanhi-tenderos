# PLAN FUTURO - Roadmap para Continuación del Proyecto

**Última actualización**: 2026-07-18
**Basado en**: TRACKING.md (proyecto corriendo en local)

---

## 🎯 Objetivo General

Tener el monorepo Savanhi listo para desarrollo colaborativo, testing automatizado y deploy a producción.

---

## 📋 FASE 1: Base de Datos & Auth (Prioridad: ALTA - Bloqueante para features)

### 1.1 Ejecutar Migración Supabase
- [ ] Ir a Supabase Dashboard → SQL Editor
- [ ] Pegar contenido de `supabase/migrations/0001_initial_schema.sql`
- [ ] Ejecutar y verificar tablas creadas en Table Editor
- [ ] Verificar roles insertados: `admin`, `marca`, `client`, `tendero`, `delivery`

### 1.2 Crear Usuario Admin de Desarrollo
```bash
# Opción A: Variables en .env root (recomendado)
DEV_ADMIN_EMAIL=dev.admin@savanhi.local
DEV_ADMIN_PASSWORD=ChangeMe123!
DEV_ADMIN_FULL_NAME=Developer Admin

# Opción B: Sin variables (usa defaults)
pnpm --filter @repo/backend-core bootstrap:dev-admin
```
- [ ] Verificar en Supabase: Authentication > Users + Table Editor > users (rol=admin)

### 1.3 Probar Flujos Auth End-to-End
```bash
# Registro tendero
curl -X POST http://localhost:4300/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test Tendero","email":"tendero@test.com","password":"Password123!","role":"tendero"}'

# Login
curl -X POST http://localhost:4300/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tendero@test.com","password":"Password123!"}'

# Usar token en rutas protegidas
curl -H "Authorization: Bearer <access_token>" http://localhost:4300/api/v1/tenderos/stores/me
```

### 1.4 Seed Data Mínimo para Desarrollo
- [ ] Script para crear: 1 marca, 1 tienda, 3-5 productos, 1-2 órdenes de prueba
- [ ] Verificar relaciones: orders → order_items → products → stores → brands

---

## 📋 FASE 2: Integración Frontend ↔ Backend (Prioridad: ALTA)

### 2.1 Tenderos Web (Next.js - `apps/Tenderos/web`)
- [ ] Verificar `EXPO_PUBLIC_TENDEROS_API_URL` / `NEXT_PUBLIC_API_URL` apunta a `http://localhost:4300`
- [ ] Conectar páginas: login, dashboard, productos, órdenes a APIs reales
- [ ] Manejo de tokens (localStorage/cookies + refresh automático)

### 2.2 Web Enterprise (Next.js - `apps/Web/web-enterprise`)
- [ ] Conectar a Admin-Marcas backend (`http://localhost:4000`)
- [ ] Páginas: login admin, gestión usuarios, marcas, reportes

### 2.3 Tenderos Mobile (Expo - `apps/Tenderos/mobile`)
- [ ] **CRÍTICO**: Reemplazar `MAPBOX_ACCESS_TOKEN=pk.ey_xxxxx` con token real de Mapbox
- [ ] Verificar `EXPO_PUBLIC_TENDEROS_API_URL=http://localhost:4300`
- [ ] Conectar: auth, tiendas, productos, órdenes, mapa de entregas

### 2.4 Clients & Delivery (si aplican)
- [ ] Clients Web → Clients backend (`:4100`)
- [ ] Delivery Mobile/Web → Delivery backend (`:4200`)

---

## 📋 FASE 3: Testing & Calidad (Prioridad: MEDIA)

### 3.1 Unit Tests
- [ ] `packages/backend-core`: repositories, auth service, mappers, env, errors
- [ ] `packages/api-contracts`: zod schemas validation
- [ ] `packages/ui`: componentes React (si hay lógica testable)

**Stack sugerido**: Vitest (ya compatible con ESM/TypeScript)

### 3.2 Integration Tests (API Contracts)
- [ ] Test que backends respetan `@repo/api-contracts` schemas
- [ ] Test request/response validation con zod
- [ ] Test auth middleware (roles, tokens expirados, refresh)

### 3.3 E2E Tests
- [ ] Playwright o Cypress
- [ ] Flujos críticos: register → login → create store → create product → create order → update status

### 3.4 Lint/Typecheck en CI
```bash
# Ya existen en package.json root:
pnpm lint
pnpm check-types
pnpm run build
```

---

## 📋 FASE 4: CI/CD & Deploy (Prioridad: MEDIA-BAJA)

### 4.1 GitHub Actions Pipeline
```yaml
# .github/workflows/ci.yml
- install (pnpm@10, Node 22)
- lint
- check-types
- build (turbo)
- test (unit + integration)
- e2e (opcional, requiere Supabase test)
```

### 4.2 Docker Compose para Desarrollo Local
- [ ] `docker-compose.yml` con: postgres (opcional, si no usan Supabase local), redis, backends, frontends
- [ ] `.env.docker` para variables de contenedor

### 4.3 Deploy a Producción
- [ ] **Vercel** para Next.js apps (web-enterprise, tenderos-web)
- [ ] **Railway/Render/Fly.io** para backends Node.js
- [ ] **Expo Application Services (EAS)** para mobile builds
- [ ] Variables de entorno por ambiente (staging, production)

### 4.4 Environment Management
| Ambiente | Supabase Project | Backend URLs | Frontend URLs |
|----------|-----------------|--------------|---------------|
| Local | Dev project | localhost:4000-4300 | localhost:3000,8082 |
| Staging | Staging project | staging-api.savanhi.com | staging.savanhi.com |
| Production | Prod project | api.savanhi.com | savanhi.com |

---

## 📋 FASE 5: Features de Negocio (Prioridad: Según Roadmap Producto)

### 5.1 Tenderos (Prioridad según PO)
- [ ] Dashboard con métricas (ventas, órdenes, stock bajo)
- [ ] Gestión de inventario (alertas stock, reorden)
- [ ] Reportes de ventas por período/producto
- [ ] Múltiples tiendas por tendero

### 5.2 Clients
- [ ] Catálogo público con filtros (marca, categoría, precio)
- [ ] Carrito + checkout flow
- [ ] Seguimiento de órdenes (tracking)
- [ ] Historial de compras + reordenar

### 5.3 Delivery
- [ ] App móvil para repartidores (asignación, navegación, prueba de entrega)
- [ ] Optimización de rutas
- [ ] Estados en tiempo real (WebSocket/SSE)

### 5.4 Admin-Marcas
- [ ] Gestión de marcas (CRUD, activar/desactivar)
- [ ] Gestión de usuarios (roles, activar/desactivar)
- [ ] Reportes globales (ventas, usuarios, entregas)
- [ ] Configuración de comisiones/fee por marca

---

## 🔧 Deuda Técnica Conocida (Para abordar en sprint futuro)

| Archivo/Issue | Descripción | Esfuerzo | Riesgo |
|---------------|-------------|----------|--------|
| `package.json:17` | `packageManager: pnpm@11.7.0` pero usa pnpm@10 | 🟢 1h | Bajo |
| `packages/*/package.json` | TypeScript `^6.0.3` vs root `5.9.2` | 🟢 2h | Medio |
| `apps/Tenderos/mobile/.env` | `MAPBOX_ACCESS_TOKEN` placeholder | 🟡 30min | Alto (mapas no cargan) |
| `BACKENDS.md:126` | Comando test DB usa `db.service.from` (deprecated?) | 🟡 1h | Medio |
| Tests | Cobertura 0% | 🔴 1-2 sprints | Alto |

---

## 📦 Comandos Útiles para Futuras Sesiones

```bash
# Setup rápido (nueva máquina / CI)
fnm use 22
npm install -g pnpm@10
pnpm install
pnpm --filter @repo/api-contracts build
pnpm --filter @repo/backend-core build

# Verificar todo compila
pnpm run build
pnpm run check-types
pnpm run lint

# Reset BD local (si usan Supabase local via Docker)
# supabase db reset

# Logs unificados (si usan Docker)
# docker-compose logs -f
```

---

## 📌 Notas para el Próximo Desarrollador / IA

1. **SIEMPRE usar Node 22 + pnpm@10** (ver `fnm list` / `pnpm --version`)
2. **Los .env son sagrados**: root para shared, apps/*/backend/.env para puertos
3. **Orden de carga .env**: `packages/backend-core/src.env.ts` carga root → app (app gana)
4. **Supabase es source of truth**: no crear tablas manualmente, usar migraciones
5. **Backend-core es shared**: NO tocar `apps/*/backend/src` para lógica de BD, usar repositories
6. **Api-contracts = contrato**: cambiar types ahí → rebuild → propagación automática

---

## 🎯 Definition of Done para "Proyecto Listo para Equipo"

- [ ] Migración BD ejecutada en Supabase (dev + staging)
- [ ] Admin dev creado y documentado credenciales
- [ ] 3 frontends consumiendo APIs reales (sin mocks)
- [ ] CI pasando en GitHub Actions (lint + typecheck + build + unit tests)
- [ ] Deploy staging funcionando (Vercel + Railway/Render)
- [ ] README actualizado con setup de 5 min para nuevo dev
- [ ] MAPBOX_TOKEN real en mobile
- [ ] Al menos 1 E2E test pasando en CI

---

*Este plan es vivo - actualizar conforme se complete cada fase*
*Generado: 2026-07-18 | Basado en TRACKING.md*