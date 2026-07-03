# Tasks: Mapbox Migration

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 130–170 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Foundation (Config + Dependencies)

- [x] 1.1 `package.json` — Remove `react-native-maps`, add `@rnmapbox/maps` + `expo-dev-client`; run `npx expo install`
- [x] 1.2 `app.json` — Add `@rnmapbox/maps` plugin with `RNMapboxMapsVersion=11`, add `expo.extra.MAPBOX_ACCESS_TOKEN`
- [x] 1.3 `.env` — Create file with `MAPBOX_ACCESS_TOKEN=${MAPBOX_ACCESS_TOKEN}`
- [x] 1.4 `src/lib/mapbox.ts` — Create config module: export `MAPBOX_ACCESS_TOKEN` via `Constants.expoConfig.extra`, `MAPBOX_GEOCODING_BASE_URL`, `buildGeocodeUrl(query)` with `country=ec`, `autocomplete=true`, `language=es`, `limit=5`
- [x] 1.5 Run `npx expo prebuild --clean` to link native Mapbox SDK

## Phase 2: BusinessLocationForm.tsx Migration

- [x] 2.1 Replace imports: `MapView, { MapMarker }` from `react-native-maps` → `Mapbox` from `@rnmapbox/maps`; add `Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN)`; replace `mapRef` type to `Mapbox.Camera`
- [x] 2.2 Replace MapView block: `<Mapbox.MapView>` containing `<Mapbox.Camera ref={cameraRef} centerCoordinate={[lng,lat]} zoomLevel={15} animationMode="flyTo" animationDuration={500} />` + `<Mapbox.PointAnnotation id="business-pin" coordinate={[lng,lat]} draggable onDragEnd={...} title="Tu negocio" />`
- [x] 2.3 Replace `fetchSuggestions()` + `selectSuggestion()` Google Places double-fetch with single `buildGeocodeUrl(query)` call; parse `data.features[0].geometry.coordinates` → [lng,lat]; use `AbortController` for in-flight cancellation
- [x] 2.4 Add inline toast: `geocodingError` state → conditional `<Text>` with 3s auto-dismiss via `setTimeout`; show on geocoding network failure (non-blocking)
- [x] 2.5 Wire GPS `handleUseGPS`: replace `mapRef.current?.animateToRegion()` calls with `cameraRef.current?.flyTo([longitude, latitude], 500)`
- [x] 2.6 Remove old code: `GOOGLE_API_KEY` constant, `googleapis.com` URLs, `Suggestion` type with `place_id`/`structured_formatting`; remove `region` prop from MapView

## Phase 3: business-location.tsx Migration

- [x] 3.1 Replace imports: `MapView, { MapMarker }` → `Mapbox`; add `Mapbox.setAccessToken()`; replace `mapRef` type to `Mapbox.Camera`
- [x] 3.2 Replace MapView block: `<Mapbox.MapView>` with `<Mapbox.Camera ref={cameraRef}>` + `<Mapbox.PointAnnotation draggable>`; use [lng, lat] coordinate order everywhere
- [x] 3.3 Wire GPS + confirm flows: replace `mapRef.current?.animateToRegion()` with `cameraRef.current?.flyTo([lng, lat], 500)` in both `handleUseGPS` and `handleConfirm`
- [x] 3.4 Remove old code: `react-native-maps` import, `DEFAULT_REGION` `latitudeDelta/longitudeDelta`, hardcoded `GOOGLE_API_KEY` (if any)

## Phase 4: Verification

- [x] 4.1 Run `npx tsc --noEmit` — fix all type errors (coordinate order, Camera ref types, PointAnnotation drag event typing)
- [x] 4.2 Manual checklist provided in apply-progress output
