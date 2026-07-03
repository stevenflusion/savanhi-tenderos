# Mapbox Migration Specification

## Purpose

Define the replacement of `react-native-maps` (Google Maps) + Google Places API with `@rnmapbox/maps` + Mapbox Geocoding v6 across both business-location screens in the Tenderos mobile app. Covers forward geocoding with autocomplete, Mapbox map rendering with draggable pins, GPS location with camera animation, token security from env, and native build setup.

## Requirements

### Capability: mapbox-geocoding

#### Requirement: G1 — Forward Geocode with Autocomplete

The system MUST send `GET https://api.mapbox.com/search/geocode/v6/forward` when the user types ≥3 characters in the address search input, debounced 400ms. The request MUST include `autocomplete=true`, `country=ec`, `language=es`, `limit=5`, and `access_token` from `src/lib/mapbox.ts`. The query MUST be URI-encoded. In-flight requests MUST be cancelled on new debounced input.

##### Scenario: Happy path — suggestions appear

- GIVEN the user typed "Cumbay" in the search input
- WHEN 400ms elapses after the last keystroke
- THEN a GET request is sent to Mapbox Geocoding v6
- AND `features[]` is parsed into suggestions showing `name` and `place_formatted`

##### Scenario: Selecting suggestion animates camera

- GIVEN a suggestion list is visible
- WHEN the user taps a suggestion
- THEN the address text is set to `name` + `place_formatted`
- AND the map camera animates via `flyTo` (500ms ease-out) to the suggestion's `center`

##### Scenario: Empty results — no error

- GIVEN the geocoding response returns empty `features[]`
- THEN no suggestions are shown
- AND no error toast appears

##### Scenario: Network failure — toast, not modal

- GIVEN a geocoding request fails (network error, timeout, 5xx)
- THEN a non-blocking toast notification is shown
- AND the previous address/state is preserved

##### Scenario: Debounce cancels stale requests

- GIVEN a geocoding request is in-flight
- WHEN the user types again within 400ms
- THEN the in-flight request is cancelled
- AND only the latest debounced request completes

### Capability: map-display

#### Requirement: D1 — Mapbox MapView with tiles

The system MUST render a full-width, full-height `<Mapbox.MapView>` centered on Quito, Ecuador. Landmarks and POI labels MUST appear by default.

##### Scenario: Map renders Mapbox tiles

- GIVEN the business-location screen loads
- THEN a Mapbox MapView renders with streets-style tiles centered on Quito

#### Requirement: D2 — Draggable PointAnnotation with camera

The system MUST render the current location as a `<Mapbox.PointAnnotation>` that is draggable. All camera control MUST use `<Mapbox.Camera>` with `flyTo()` driven by coordinate state. The PointAnnotation MUST display the title "Tu negocio" and subtitle with the current address. On `onDragEnd`, the lat/lng state MUST update to the new coordinates.

##### Scenario: Drag updates lat/lng state

- GIVEN the map displays a PointAnnotation pin at the current location
- WHEN the user drags the pin to a new position
- THEN `onDragEnd` fires with the new coordinates
- AND the lat/lng state updates to match

### Capability: gps-location

#### Requirement: L1 — GPS with Mapbox camera adaptation

The system MUST use `expo-location` to request permissions, call `getCurrentPositionAsync` (Balanced), and reverse-geocode. After GPS resolves, the camera MUST animate via `flyTo()` (500ms, ease-out) and the pin MUST move to GPS coordinates. The address text MUST be set from the reverse-geocode result. On permission denial or failure, an error text MUST be shown (not a blocking modal).

##### Scenario: GPS resolves — camera animates

- GIVEN the user triggers GPS location
- WHEN `getCurrentPositionAsync` returns coordinates
- THEN the camera animates to GPS coords via `flyTo` (500ms ease-out)
- AND the pin moves after animation
- AND the address input shows the reverse-geocode result

##### Scenario: Permissions denied — error text

- GIVEN location permission is denied
- WHEN the GPS flow triggers
- THEN an error text is displayed
- AND the map state is unchanged

### Configuration: token-security

#### Requirement: T1 — Token loaded from env

The system MUST load `MAPBOX_ACCESS_TOKEN` from `.env` via a dedicated `src/lib/mapbox.ts` module. The token MUST NOT be hardcoded in any component or screen file. The module MUST export the token string and base URL.

##### Scenario: Token sourced from env

- GIVEN `.env` contains `MAPBOX_ACCESS_TOKEN=pk.xxxx`
- WHEN `src/lib/mapbox.ts` is imported
- THEN the exported token matches the env value

### Build & Native Setup

#### Requirement: B1 — Native module configuration

The system MUST add `@rnmapbox/maps` to `package.json` and register its Expo config plugin in `app.json` with `RNMapboxMapsVersion=11`. `expo-dev-client` MUST be installed. `npx expo prebuild --clean` MUST run after dependency changes.

##### Scenario: Mapbox SDK links natively

- GIVEN `@rnmapbox/maps` and `expo-dev-client` are installed
- WHEN `npx expo prebuild --clean` completes
- THEN the native Mapbox SDK is linked
- AND `npx tsc --noEmit` passes with zero errors
