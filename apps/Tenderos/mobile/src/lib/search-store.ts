/**
 * Module-level store to pass search results between search-location and business-location.
 * Avoids creating duplicate navigation stack entries.
 */
export const searchStore: {
  lat: number | null;
  lng: number | null;
  address: string;
} = { lat: null, lng: null, address: "" };

export function clearSearchStore() {
  searchStore.lat = null;
  searchStore.lng = null;
  searchStore.address = "";
}
