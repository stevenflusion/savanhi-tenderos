export type BrandAuth = {
  id: string;
  savanhiId: string;
  email: string;
  brandName: string;
  role: "marca";
  active: boolean;
};

export type BrandProfile = {
  id: string;
  savanhiId: string;
  email: string;
  brandName: string;
  displayName: string;
  role: "marca";
};
