export type CampaignStatus =
  | "draft"
  | "pending_payment"
  | "receipt_uploaded"
  | "active"
  | "finished";

export interface Campaign {
  id: string;
  brandId: string;
  name: string;
  description: string;
  status: CampaignStatus;
  storeTiers: Array<"gold" | "plata" | "bronze">;
  neighborhood: string;
  radiusKm: number;
  minStores: number;
  maxStores: number;
  couponPrefix: string;
  couponCount: number;
  discountValue: number;
  feeFixed: number;
  cpo: number;
  startDate: string;
  endDate: string;
  rejectionReason?: string;
}

export interface Coupon {
  id: string;
  campaignId: string;
  code: string;
  redeemedAt: string | null;
  redeemedByStoreId: string | null;
}

export interface Redemption {
  id: string;
  couponId: string;
  campaignId: string;
  storeId: string;
  redeemedAt: string;
  amountSaved: number;
}
