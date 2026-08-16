export type AuthLocationSearchState = {
  lat: number | null;
  lng: number | null;
  address: string;
};

export const authLocationSearchState: AuthLocationSearchState = {
  lat: null,
  lng: null,
  address: "",
};

export function clearAuthLocationSearchState() {
  authLocationSearchState.lat = null;
  authLocationSearchState.lng = null;
  authLocationSearchState.address = "";
}
