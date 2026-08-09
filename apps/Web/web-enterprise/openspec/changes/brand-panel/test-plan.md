# Manual Test Plan: Brand Panel

## Prerequisites

Before running any test scenario, ensure:

1. **Supabase project is running** — local or remote instance with the following tables:
   - `brand_auth` (id, savanhi_id, email, brand_name, role, active, created_at)
   - `campaigns` (all columns per domain entity)
   - `coupons` (id, campaign_id, code, redeemed_at, redeemed_by_store_id)
   - `redemptions` (id, coupon_id, store_id, redeemed_at)
   - `campaign_payments` (id, campaign_id, receipt_url, status, confirmed_at)
2. **Storage bucket `payment-receipts`** created in Supabase Storage
3. **Bootstrap admin entry exists** in `brand_auth`:
   - `savanhi_id: "savanhi"`, `email: "admin@savanhi.com"`, `role: "admin"`
   - Supabase Auth user exists for that email with a known password
4. **App running locally**: `pnpm --filter web-enterprise dev`
5. **Browser** at `http://localhost:3000`

---

## 6.3 Authentication Flows

### TC-AUTH-01: Admin login with `savanhi`

| Field | Value |
|-------|-------|
| **Preconditions** | Bootstrap admin entry exists in `brand_auth` with savanhi_id = `savanhi`, mapped email has a Supabase Auth account |
| **Steps** | 1. Navigate to `http://localhost:3000` |
| | 2. Enter `savanhi` as SavanhID |
| | 3. Enter the correct password |
| | 4. Click "Iniciar Sesión" |
| **Expected Result** | Redirected to `/admin/dashboard`. Sidebar shows admin navigation (Marcas, Pagos Pendientes). Dashboard shows stats cards. |
| **How to Verify** | Check URL is `/admin/dashboard`. Verify sidebar contains admin-specific nav items. |

### TC-AUTH-02: Brand login (after registration)

| Field | Value |
|-------|-------|
| **Preconditions** | A brand has been registered via `/admin/brands/new` (see TC-ADMIN-01). Brand's SavanhID and password are known. |
| **Steps** | 1. Navigate to `http://localhost:3000` |
| | 2. Enter the brand's SavanhID |
| | 3. Enter the brand's password |
| | 4. Click "Iniciar Sesión" |
| **Expected Result** | Redirected to `/brand/dashboard`. Sidebar shows brand navigation (Campañas, Dashboard). Dashboard shows campaign list (initially empty). |
| **How to Verify** | Check URL is `/brand/dashboard`. Verify sidebar contains brand-specific nav items. |

### TC-AUTH-03: Invalid credentials

| Field | Value |
|-------|-------|
| **Preconditions** | None |
| **Steps** | 1. Navigate to `http://localhost:3000` |
| | 2. Enter any non-existent SavanhID (e.g., `fakeuser`) |
| | 3. Enter any password |
| | 4. Click "Iniciar Sesión" |
| **Expected Result** | An inline error message "Credenciales inválidas" appears on the form. URL stays on `/`. No redirect occurs. |
| **How to Verify** | See the error message displayed below the form. Confirm the browser address bar still shows `/`. |

### TC-AUTH-04: Unauthenticated access to protected routes

| Field | Value |
|-------|-------|
| **Preconditions** | No user is logged in (fresh browser session) |
| **Steps** | 1. Navigate directly to `http://localhost:3000/brand/dashboard` |
| | 2. Navigate directly to `http://localhost:3000/admin/dashboard` |
| **Expected Result** | Both routes redirect back to `/`. The pages detect `session === null` and call `router.replace("/")`. |
| **How to Verify** | After navigating to each URL, the browser ends up at `/`. |

### TC-AUTH-05: Unauthorized page for unknown role

| Field | Value |
|-------|-------|
| **Preconditions** | A user exists in Supabase Auth with a role that is neither `"admin"` nor `"marca"` (e.g., role `"tendero"`). Note: in normal usage this scenario requires a custom DB entry since the app only creates `admin` and `marca` roles. |
| **Steps** | (Manual DB test) |
| | 1. In Supabase SQL editor, insert a row into `brand_auth` with `role = 'unknown_role'` and create the corresponding Auth user |
| | 2. Login with that user's SavanhID and password |
| **Expected Result** | After login, the app shows the unauthorized page (`/unauthorized`): "Acceso denegado" with role information |
| **How to Verify** | Confirm the `/unauthorized` page renders with 403 header and "No tienes permisos" message. |

---

## 6.4 Campaign Lifecycle

### TC-CAMPAIGN-01: Brand creates a campaign (draft)

| Field | Value |
|-------|-------|
| **Preconditions** | Brand is authenticated and on `/brand/dashboard` |
| **Steps** | 1. Click "Nueva campaña" button |
| | 2. On Step 1, fill in: Name (e.g., "Promo Verano"), Description, select at least one store tier (Gold/Plata/Bronce), enter neighborhood (e.g., "Palermo"), radius (e.g., 5), min stores (e.g., 5), max stores (e.g., 20) |
| | 3. Click "Siguiente" to go to Step 2 |
| | 4. On Step 2, enter: Code prefix (e.g., "VERANO"), coupon count (e.g., 500), discount value (e.g., 500), fixed fee (e.g., 2000), CPO (e.g., 50) |
| | 5. Click "Crear campaña" |
| **Expected Result** | Campaign is created with status `draft`. Redirected to `/brand/dashboard`. The campaign appears in the campaign list with status "Borrador". |
| **How to Verify** | Check the campaign list on the dashboard shows the new campaign. In Supabase, query `SELECT * FROM campaigns WHERE name = 'Promo Verano'` and confirm `status = 'draft'`. |

### TC-CAMPAIGN-02: Brand submits campaign for payment

| Field | Value |
|-------|-------|
| **Preconditions** | A campaign exists in `draft` status |
| **Steps** | 1. From `/brand/dashboard`, click on the campaign name |
| | 2. Click "Enviar para pago" (or equivalent submit action) |
| **Expected Result** | Campaign status changes to `pending_payment`. The campaign detail page now shows the receipt upload section with the amount to pay (50% of `fee_fixed`). |
| **How to Verify** | In Supabase, confirm `status = 'pending_payment'`. On the page, verify the receipt upload UI is visible showing the upfront amount. |

### TC-CAMPAIGN-03: Brand uploads receipt

| Field | Value |
|-------|-------|
| **Preconditions** | Campaign is in `pending_payment` status. Brand is viewing the campaign detail page. Valid receipt file ready (image: `.jpg`, `.png`, or `.pdf`). |
| **Steps** | 1. On the campaign detail page, click the receipt upload area |
| | 2. Select a valid image/PDF file |
| | 3. Click "Subir comprobante" |
| **Expected Result** | File uploads to `payment-receipts/{campaign_id}/` in Supabase Storage. Campaign status changes to `receipt_uploaded`. A success message appears. |
| **How to Verify** | Check Supabase Storage bucket `payment-receipts` for the file. Confirm `campaigns` table shows `status = 'receipt_uploaded'`. Also check `campaign_payments` table has a row with `receipt_url` and `status = 'pending'`. |

### TC-CAMPAIGN-04: Brand uploads invalid file type

| Field | Value |
|-------|-------|
| **Preconditions** | Campaign is in `pending_payment` status |
| **Steps** | 1. On the campaign detail, click the receipt upload area |
| | 2. Select a `.exe` or `.zip` file |
| | 3. Click "Subir comprobante" |
| **Expected Result** | The system rejects the upload with error "Formato de archivo no válido". Campaign status remains `pending_payment`. |
| **How to Verify** | Confirm the inline error message appears. Verify in Supabase that campaign status did not change. |

### TC-CAMPAIGN-05: Admin confirms payment → campaign becomes active

| Field | Value |
|-------|-------|
| **Preconditions** | A campaign is in `receipt_uploaded` status. Admin is logged in and on `/admin/payments`. |
| **Steps** | 1. On `/admin/payments`, locate the campaign in the list |
| | 2. Click "Ver comprobante" to preview the receipt |
| | 3. Verify the receipt image displays in the modal |
| | 4. Close the modal |
| | 5. Click "Confirmar" |
| **Expected Result** | Campaign status changes to `active`. N coupons are bulk-inserted into the `coupons` table with unique codes (format `PREFIX-XXXXXXXX`). A success feedback message appears. The campaign disappears from the pending payments list. |
| **How to Verify** | Check in Supabase: `SELECT * FROM campaigns WHERE status = 'active'`. Count coupons for the campaign: `SELECT COUNT(*) FROM coupons WHERE campaign_id = '{id}'` should equal the coupon count specified during creation. Verify codes follow the `PREFIX-XXXXXXXX` pattern. |

### TC-CAMPAIGN-06: Admin rejects payment

| Field | Value |
|-------|-------|
| **Preconditions** | A campaign (different from TC-05) is in `receipt_uploaded` status |
| **Steps** | 1. On `/admin/payments`, locate the campaign |
| | 2. Click "Rechazar" |
| | 3. In the modal, enter a reason (e.g., "Comprobante ilegible") |
| | 4. Click "Rechazar pago" |
| **Expected Result** | Campaign status returns to `pending_payment`. The rejection reason is stored. The brand can see the rejection reason when viewing the campaign detail. |
| **How to Verify** | In Supabase: `SELECT status, rejection_reason FROM campaigns WHERE id = '{id}'` — status should be `pending_payment`, rejection_reason should contain the entered text. The campaign reappears in the pending list for a new receipt upload. |

### TC-CAMPAIGN-07: Campaign metrics display (active)

| Field | Value |
|-------|-------|
| **Preconditions** | A campaign is `active` with at least some redemptions (insert test redemptions via SQL if needed) |
| **Steps** | 1. As brand, navigate to the campaign detail page |
| **Expected Result** | Metrics section is visible showing: total redemptions, redemption rate (redemptions / total coupons), budget executed (CPO × redemptions), active stores count. Top 10 stores leaderboard shows stores sorted by redemption count. |
| **How to Verify** | Manually calculate expected values from DB data and compare to displayed values. Test with 0 redemptions: rate should show 0%, budget 0. |

### TC-CAMPAIGN-08: Realtime redemption counter

| Field | Value |
|-------|-------|
| **Preconditions** | Brand is viewing an active campaign detail page. At least one unredeemed coupon exists. |
| **Steps** | 1. Note the current redemption count on the page |
| | 2. In Supabase SQL editor, manually insert a redemption row: `INSERT INTO redemptions (coupon_id, store_id) VALUES ('{unredeemed_coupon_id}', 'test-store-1')` |
| | 3. Also update the coupon: `UPDATE coupons SET redeemed_at = now(), redeemed_by_store_id = 'test-store-1' WHERE id = '{coupon_id}'` |
| **Expected Result** | The redemption counter on the campaign detail page increments without page refresh (within a few seconds). |
| **How to Verify** | Watch the counter update in real-time. The new redemption count should match the expected value. |

### TC-CAMPAIGN-09: Campaign finished state

| Field | Value |
|-------|-------|
| **Preconditions** | An active campaign exists. You can manually set its `end_date` to the past and trigger the expiry check (or manually update `status` in DB for testing). |
| **Steps** | 1. In Supabase, run: `UPDATE campaigns SET status = 'finished' WHERE id = '{id}'` |
| | 2. As brand, refresh the campaign detail page |
| **Expected Result** | Status badge shows "Finalizada". Metrics are still displayed (finished campaigns retain metrics). Settlement section appears with: upfront paid, CPO total, remaining balance, total fee. |
| **How to Verify** | Check metrics section is still present. Verify settlement shows correct calculation: upfront = fee_fixed × 0.5, CPO total = CPO × actual redemptions, balance = fee_fixed × 0.5 + CPO total. |

### TC-CAMPAIGN-10: Draft campaign shows no metrics or upload sections

| Field | Value |
|-------|-------|
| **Preconditions** | A draft campaign exists |
| **Steps** | 1. As brand, navigate to the draft campaign detail page |
| **Expected Result** | No metrics section is rendered. No receipt upload section is rendered. Only campaign info (name, description, targeting details, coupon config) is shown. A submit-for-payment action is available. |
| **How to Verify** | Visually confirm the absence of metrics, leaderboard, and upload sections. |

---

## 6.5 Admin Section

### TC-ADMIN-01: Register a new brand

| Field | Value |
|-------|-------|
| **Preconditions** | Admin is logged in |
| **Steps** | 1. Navigate to `/admin/brands/new` |
| | 2. Enter brand name: "Test Store" |
| | 3. Enter email: "test@tienda.com" |
| | 4. Click "Registrar marca" |
| **Expected Result** | A new brand is created. Credentials (SavanhID and password) are displayed once with copy buttons. The SavanhID is a unique 8-character string. The email is the one entered. |
| **How to Verify** | Check the displayed credentials. Copy the SavanhID and password. Verify in Supabase: `SELECT * FROM brand_auth WHERE email = 'test@tienda.com'` — should have `role = 'marca'` and the correct `savanhi_id`. Verify a Supabase Auth user was created with that email (check `auth.users` table). |

### TC-ADMIN-02: Duplicate email registration

| Field | Value |
|-------|-------|
| **Preconditions** | A brand with email "test@tienda.com" already exists (from TC-ADMIN-01) |
| **Steps** | 1. Navigate to `/admin/brands/new` |
| | 2. Enter brand name: "Another Store" |
| | 3. Enter email: "test@tienda.com" (same as before) |
| | 4. Click "Registrar marca" |
| **Expected Result** | Error message "El email ya está registrado" is shown. No new row is created in `brand_auth`. |
| **How to Verify** | Confirm the error text on screen. Query `SELECT COUNT(*) FROM brand_auth WHERE email = 'test@tienda.com'` — should still be 1. |

### TC-ADMIN-03: View pending payments list

| Field | Value |
|-------|-------|
| **Preconditions** | At least one campaign is in `receipt_uploaded` status |
| **Steps** | 1. As admin, navigate to `/admin/payments` |
| **Expected Result** | All campaigns with `receipt_uploaded` status are listed. Each entry shows: campaign name, brand name, receipt upload date. Receipt preview is available via "Ver comprobante" button. Confirmar and Rechazar buttons are present. |
| **How to Verify** | Cross-reference with Supabase: `SELECT c.name, b.brand_name, cp.created_at FROM campaigns c JOIN brand_auth b ON c.brand_id = b.id JOIN campaign_payments cp ON cp.campaign_id = c.id WHERE c.status = 'receipt_uploaded'` — verify every row appears in the list. |

### TC-ADMIN-04: No pending payments message

| Field | Value |
|-------|-------|
| **Preconditions** | No campaigns are in `receipt_uploaded` status |
| **Steps** | 1. As admin, navigate to `/admin/payments` |
| **Expected Result** | The page shows "No hay pagos pendientes" |
| **How to Verify** | Confirm the empty state message is displayed. Verify no campaign cards are rendered. |

### TC-ADMIN-05: Sidebar badge updates with pending count

| Field | Value |
|-------|-------|
| **Preconditions** | Admin is logged in and viewing any admin page with the sidebar. Currently no pending payments. |
| **Steps** | 1. Check the sidebar "Pagos Pendientes" item — there should be no badge (or a zero badge) |
| | 2. In Supabase, update a campaign to `receipt_uploaded`: `UPDATE campaigns SET status = 'receipt_uploaded' WHERE id = '{some_id}'` |
| | 3. Wait for Realtime subscription to trigger (a few seconds) |
| **Expected Result** | The sidebar "Pagos Pendientes" item shows a badge counter reflecting the new pending payment count. |
| **How to Verify** | Visually confirm the badge number matches the count from `SELECT COUNT(*) FROM campaigns WHERE status = 'receipt_uploaded'`. |

### TC-ADMIN-06: Brand blocked from admin routes

| Field | Value |
|-------|-------|
| **Preconditions** | A brand user is logged in |
| **Steps** | 1. As brand, navigate directly to `http://localhost:3000/admin/dashboard` |
| | 2. Navigate to `http://localhost:3000/admin/brands/new` |
| | 3. Navigate to `http://localhost:3000/admin/payments` |
| **Expected Result** | Each `/admin/*` route either redirects away or shows the unauthorized page (handled by `AdminGuard` / `RoleGuard` which renders nothing for non-admin roles unless a fallback is provided). |
| **How to Verify** | Brand user should not see admin content on any of these routes. |

---

## Edge Cases

### TC-EDGE-01: Campaign creation with invalid targeting

| Field | Value |
|-------|-------|
| **Preconditions** | Brand is authenticated on `/brand/campaigns/new` |
| **Steps** | 1. Fill Step 1 with min stores > max stores (e.g., min=20, max=5) |
| **Expected Result** | An inline validation error is shown. The campaign is NOT created. |
| **How to Verify** | Check no new row appears in `campaigns` table. Confirm error message on screen. |

### TC-EDGE-02: Settlement calculation for finished campaign

| Field | Value |
|-------|-------|
| **Preconditions** | A finished campaign exists with known redemptions |
| **Steps** | 1. As brand, navigate to the finished campaign detail |
| **Expected Result** | Settlement section shows: Upfront paid = fee_fixed × 50%, Actual redemptions count, CPO total = CPO × redemptions, Remaining balance = (fee_fixed × 50%) + CPO total, Total fee = fee_fixed + CPO total |
| **How to Verify** | Manually calculate using DB values and compare to displayed figures. |

### TC-EDGE-03: Logout clears session

| Field | Value |
|-------|-------|
| **Preconditions** | Any user is logged in |
| **Steps** | 1. Click the logout button/option in the sidebar or user menu |
| **Expected Result** | Session is cleared. User is redirected to `/`. Login form is displayed. |
| **How to Verify** | Check that direct navigation to `/brand/dashboard` redirects back to `/`. Verify `localStorage` does not contain session tokens (or they've been cleared by Supabase signOut). |
