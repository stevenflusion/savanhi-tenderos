# Design: Mapbox Migration

## Technical Approach

Replace `react-native-maps` (Google Maps) + Google Places API (2 calls) with `@rnmapbox/maps` + Mapbox Geocoding v6 (single call) across both business-location screens. Inline migration — no reusable wrapper yet. `expo-location` GPS flow preserved. Mapbox token loaded from `.env` → `src/lib/mapbox.ts` → `Constants.expoConfig.extra`.

Key shifts: `MapView`/`MapMarker` → `Mapbox.MapView`/`PointAnnotation`, `animateToRegion` → `Camera.flyTo([lng, lat])`, Google Places double-fetch → single Geocoding v6 `forward` with `autocomplete=true`. Error handling upgraded from silent fail to inline state-based toast.

---

## Architecture Decisions

| ID | Option | Alternative | Rationale |
|----|--------|-------------|-----------|
| D1 | `Camera.flyTo()` imperative ref | `centerCoordinate` prop | Matches existing `mapRef.current?.animateToRegion` pattern; no unnecessary re-renders |
| D2 | `PointAnnotation draggable` | `MarkerView` + PanResponder | Built-in drag with `onDragEnd(GeoJSON)` — matches `MapMarker` pattern, zero extra code |
| D3 | `expo-constants` `extra` field | `react-native-dotenv` babel plugin | Zero new deps (`expo-constants` already installed), Expo-idiomatic, token never in source |
| D4 | Inline state-based toast | `react-native-toast-message` | Zero new deps, ~20 lines JSX, matches existing `gpsError` inline error pattern per spec |
| D5 | `useRef` + `setTimeout` + `AbortController` | `lodash.debounce` | Already in codebase (lines 61, 88–90); AbortController adds in-flight cancellation per spec G1 |

---

## Component Hierarchy

**Before:**
```
BusinessLocationForm                     business-location.tsx
├── ScreenTitle                           └── MapView (react-native-maps)
├── TextInput + FlatList (Google sugg.)        └── MapMarker (draggable)
├── Pressable (GPS)                       └── UI overlay (back, GPS, Modal)
└── MapView + MapMarker                   └── Loading overlay
```

**After:**
```
BusinessLocationForm                     business-location.tsx
├── ScreenTitle                           └── Mapbox.MapView
├── TextInput + FlatList (Mapbox sugg.)        ├── Camera (via ref)
├── Pressable (GPS)                            └── PointAnnotation (draggable)
├── Mapbox.MapView                       └── UI overlay (back, GPS, Modal)
│   ├── Camera (via ref)                 └── Loading overlay
│   └── PointAnnotation (draggable)      └── Toast (inline)
├── Toast (inline)
└── FormButton
```

---

## Data Flow

```
Autocomplete:
  input ≥3 chars → debounce 400ms → AbortController.cancel() → GET /geocoding/v6/forward
    ├─ 200 + features[] → setSuggestions → tap → flyTo([lng,lat],500) + setState
    ├─ empty features[] → setSuggestions([]) — no toast
    └─ error → setGeocodingError → Toast (3s auto-dismiss)

GPS:
  button → requestPermissionsAsync → getCurrentPositionAsync → reverseGeocodeAsync
    ├─ denied → setGpsError → render error text
    ├─ error → setGpsError → render error text
    └─ success → setState + cameraRef.flyTo([lng,lat],500)

Drag:
  onDragEnd(feature) → [lng,lat] = feature.geometry.coordinates → setLatitude/Longitude
```

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `.env` | Create | `MAPBOX_ACCESS_TOKEN=pk.xxxx` |
| `src/lib/mapbox.ts` | Create | Config module: token via `Constants.expoConfig.extra`, URL builder |
| `package.json` | Modify | Remove `react-native-maps`, add `@rnmapbox/maps`, `expo-dev-client` |
| `app.json` | Modify | Add `@rnmapbox/maps` plugin (`RNMapboxMapsVersion=11`), `extra.MAPBOX_ACCESS_TOKEN` |
| `src/components/auth/forms/BusinessLocationForm.tsx` | Modify | Imports → `@rnmapbox/maps`, replace MapView/Camera/PointAnnotation, single geocoding call |
| `app/auth/business-location.tsx` | Modify | Same pattern: Mapbox imports, camera ref, PointAnnotation, toast |

---

## Interfaces

### `src/lib/mapbox.ts`

```ts
import Constants from "expo-constants";
export const MAPBOX_ACCESS_TOKEN: string =
  Constants.expoConfig?.extra?.MAPBOX_ACCESS_TOKEN ?? "";
export const MAPBOX_GEOCODING_BASE_URL = "https://api.mapbox.com";

export function buildGeocodeUrl(query: string): string {
  const url = new URL(`${MAPBOX_GEOCODING_BASE_URL}/search/geocode/v6/forward`);
  url.searchParams.set("q", query);
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("country", "ec");
  url.searchParams.set("language", "es");
  url.searchParams.set("limit", "5");
  url.searchParams.set("access_token", MAPBOX_ACCESS_TOKEN);
  return url.toString();
}
```

### Key type (inline)

```ts
interface MapboxFeature {
  geometry: { coordinates: [number, number] }; // [lng, lat]
  properties: { name: string; place_formatted: string; full_address: string };
}
```

---

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| TypeScript | All files compile | `npx tsc --noEmit` zero errors |
| Build | Native linking | `npx expo prebuild --clean` completes |
| Render | Map tiles load | Manual: streets tiles centered on Quito |
| Autocomplete | Geocoding single call | Manual: "Cumbay" → suggestions appear (1 call, not 2) |
| Camera | flyTo() | Manual: select suggestion → camera animates to coords |
| Drag | Pin updates state | Manual: drag → lat/lng updates |
| GPS | Location + rev geocode | Manual: GPS button → camera animates, address fills |
| Error | Toast appears | Manual: disable network → toast (non-blocking) |

---

## Migration / Rollout

1. `npx expo install @rnmapbox/maps expo-dev-client` + `npm uninstall react-native-maps`
2. Add `@rnmapbox/maps` plugin to `app.json` + `extra.MAPBOX_ACCESS_TOKEN`
3. Create `.env` with `MAPBOX_ACCESS_TOKEN=pk.xxxx`
4. `npx expo prebuild --clean`
5. Test with `npx expo run:android` (dev client required for native modules)

No data migration required. Token is public URL-restricted — no rotation needed.

---

## Edge Cases

| Component | Loading | Empty | Error | Network | Permissions |
|-----------|---------|-------|-------|---------|-------------|
| Search | N/A (one-shot) | No suggestions, no toast | Toast 3s | Toast 3s | N/A |
| GPS | Spinner + text | N/A | Error text | Error text | Denied → error text |
| Map tiles | Default skeleton | Default gray/water | Graceful offline | Same | N/A |
| Confirm | disabled | disabled when `!hasLocation` | N/A | N/A | N/A |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `@rnmapbox/maps` incompatibility w/ Expo SDK 54 | Med | High | Pin `RNMapboxMapsVersion=11`; verify compatibility matrix |
| `[lng,lat]` vs `[lat,lng]` confusion | Med | Med | Inline comment on every coordinate array; review both files |
| dev-client build complexity | Med | Low | Document `npx expo run:android`; `expo start` still works for JS |
| No test infra catches runtime errors | High | Med | Rely on `tsc --noEmit` + manual checklist in PR review |

---

## Rollback Plan

1. `git checkout HEAD~1 -- package.json app.json src/components/auth/forms/BusinessLocationForm.tsx app/auth/business-location.tsx`
2. `git rm src/lib/mapbox.ts .env`
3. `npm uninstall @rnmapbox/maps expo-dev-client && npm install react-native-maps@^1.20.1`
4. `rm -rf android/ ios/ && npx expo prebuild --clean`
5. Verify `npx tsc --noEmit` passes + screens render Google Maps

---

## Open Questions

- [ ] Confirm `@rnmapbox/maps` compatibility with Expo SDK 54 + `newArchEnabled: true`
- [ ] Need actual Mapbox token value (URL-restricted) from Mapbox account before `.env` creation
