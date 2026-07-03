# Proposal: Mapbox Migration

## Intent

Replace `react-native-maps` (Google Maps) + Google Places API (2-call autocomplete → details) with `@rnmapbox/maps` + Mapbox Geocoding v6 (single-call forward geocode) across both business-location screens. Removes hardcoded `GOOGLE_API_KEY`, reduces API call count, and enables free-tier map tiles.

## Scope

### In Scope
- Migrate `BusinessLocationForm.tsx` and `business-location.tsx` to Mapbox
- Add `@rnmapbox/maps` + `expo-dev-client` packages; register config plugin in `app.json`
- Create `src/lib/mapbox.ts` config module + `.env` for `MAPBOX_ACCESS_TOKEN`
- Google Places (2 calls) → single Mapbox Geocoding v6 forward call (`autocomplete=true`, `country=ec`)
- `MapMarker` → `PointAnnotation` (draggable); `animateToRegion` → `Camera.flyTo()` (ease-out, 500–800ms)
- Toast notification on geocoding errors (non-blocking)
- `expo-location` GPS flow preserved as-is

### Out of Scope
- Reusable `<LocationPicker>` wrapper component (deferred)
- Other screens, dark mode, offline maps, custom style layers
- Google Maps removal from other potential consumers (none exist)

## Capabilities

### New Capabilities
- `mapbox-geocoding`: Forward geocoding with autocomplete restricted to Ecuador (`country=ec`). Debounced 400ms, minimum 3 chars. Single call returns coordinates + formatted address. Token loaded from `src/lib/mapbox.ts` (via `.env`).

### Modified Capabilities
None

## Approach

1. **Dependencies**: Add `@rnmapbox/maps` + `expo-dev-client`; remove `react-native-maps`. Register plugin in `app.json` with `RNMapboxMapsVersion=11`.
2. **Config**: `src/lib/mapbox.ts` exports `MAPBOX_ACCESS_TOKEN` from env. `.env` file stores the token.
3. **Migration**: Both screens — replace `MapView`/`MapMarker` → `Mapbox.MapView` + `PointAnnotation`; replace `region`/`animateToRegion` → `<Camera>` + `flyTo()`; replace Google Places REST → Mapbox `/search/geocode/v6/forward?autocomplete=true&country=ec`; replace `onMarkerDragEnd` → `PointAnnotation.onDragEnd`.
4. **Error handling**: Wrap geocoding fetch in try/catch; show toast (not modal) on failure.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | Modified | Remove `react-native-maps`, add `@rnmapbox/maps`, `expo-dev-client` |
| `app.json` | Modified | Add `@rnmapbox/maps` plugin with version pin |
| `.env` | New | `MAPBOX_ACCESS_TOKEN` |
| `src/lib/mapbox.ts` | New | Mapbox config module (token, base URL) |
| `src/components/auth/forms/BusinessLocationForm.tsx` | Modified | Full Mapbox migration |
| `app/auth/business-location.tsx` | Modified | Full Mapbox migration |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Native build failure (Mapbox SDK compat) | Med | Pin `RNMapboxMapsVersion=11`; verify with `expo-dev-client` |
| Token exposure in JS bundle | Low | Public token, env-loaded, URL-restricted |
| Geocoding returns no results | Low | Min 3 chars + debounce; empty suggestion state |

## Rollback Plan

Revert `package.json` + `app.json` → restore `react-native-maps` → reinstall → revert both screen files. Old Google Places code preserved in git history.

## Dependencies

- `@rnmapbox/maps` (v11 compatible)
- `expo-dev-client` (native module build)
- Mapbox free-tier account (public token already created)

## Success Criteria

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] Map renders Mapbox tiles in both screens
- [ ] Autocomplete returns Ecuador addresses via single Mapbox Geocoding v6 call
- [ ] Selecting a suggestion triggers `flyTo` camera animation and updates pin position
- [ ] Dragging pin updates lat/lng state correctly
- [ ] GPS flow (expo-location) completes and reverse-geocodes without regression
- [ ] Geocoding failures show a toast notification (not a blocking modal)
- [ ] `MAPBOX_ACCESS_TOKEN` loads from `.env` via `src/lib/mapbox.ts` — no hardcoded token
