export type CampaignPaymentStatus = "pending" | "reviewing" | "paid";

export interface CampaignPayment {
  id: string;
  campaignId: string;
  type: "upfront" | "settlement";
  amount: number;
  status: CampaignPaymentStatus;
  receiptUrl: string;
  confirmedAt: string | null;
}

export interface SettlementSummary {
  totalRedemptions: number;
  redemptionRate: number;
  cpoReal: number;
  feePaid: number;
  feeRemaining: number;
  totalCpo: number;
  totalDue: number;
}
