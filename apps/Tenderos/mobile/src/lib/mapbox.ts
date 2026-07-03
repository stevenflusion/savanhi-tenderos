import Constants from "expo-constants";

/**
 * Mapbox access token loaded from app.json extra via expo-constants.
 * NEVER hardcode this token in component files.
 */
export const MAPBOX_ACCESS_TOKEN: string =
  Constants.expoConfig?.extra?.MAPBOX_ACCESS_TOKEN ?? "";

/** Base URL for Mapbox API (no trailing slash). */
export const MAPBOX_GEOCODING_BASE_URL = "https://api.mapbox.com";

/**
 * Build a Mapbox Geocoding v6 forward geocode URL.
 *
 * @param query – the user's search text (will be URI-encoded by URL class)
 * @returns full URL string with all required search params
 */
export function buildGeocodeUrl(query: string): string {
  const url = new URL(
    `${MAPBOX_GEOCODING_BASE_URL}/search/geocode/v6/forward`,
  );
  url.searchParams.set("q", query);
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("country", "ec");
  url.searchParams.set("language", "es");
  url.searchParams.set("limit", "5");
  url.searchParams.set("access_token", MAPBOX_ACCESS_TOKEN);
  return url.toString();
}
