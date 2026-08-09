"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../components/auth/auth-provider";
import type { Campaign } from "../../domain/campaign";
import {
  getBrandIdByEmail,
  listCampaigns,
  createCampaign,
  getCampaignById,
  getCampaignMetrics,
} from "../../application/campaign/campaign-service";

type UseBrandCampaignsReturn = {
  campaigns: Campaign[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
};

/**
 * Hook to fetch and manage campaigns for the authenticated brand.
 */
export function useBrandCampaigns(): UseBrandCampaignsReturn {
  const { user, isReady } = useAuth();
  const [brandId, setBrandId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Resolve brand_id from user
  useEffect(() => {
    if (!isReady || !user) return;

    if (user.role === "marca" && user.email) {
      getBrandIdByEmail(user.email).then((id) => {
        setBrandId(id);
      });
    }
  }, [isReady, user]);

  // Fetch campaigns when brandId is resolved
  useEffect(() => {
    if (!brandId) {
      if (isReady && user) {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    listCampaigns(brandId)
      .then((data) => {
        setCampaigns(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [brandId, refreshKey, isReady, user]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return { campaigns, isLoading, error, refresh };
}

type UseSingleCampaignReturn = {
  campaign: Campaign | null;
  metrics: {
    totalRedemptions: number;
    distinctStores: number;
    totalAmountSaved: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
};

/**
 * Hook to fetch a single campaign with metrics.
 */
export function useSingleCampaign(
  campaignId: string | undefined,
): UseSingleCampaignReturn {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [metrics, setMetrics] = useState<{
    totalRedemptions: number;
    distinctStores: number;
    totalAmountSaved: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { isReady } = useAuth();

  useEffect(() => {
    if (!campaignId || !isReady) return;

    setIsLoading(true);
    setError(null);

    Promise.all([
      getCampaignById(campaignId),
      getCampaignMetrics(campaignId),
    ])
      .then(([campaignData, metricsData]) => {
        setCampaign(campaignData);
        setMetrics(metricsData);
        setIsLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [campaignId, refreshKey, isReady]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return { campaign, metrics, isLoading, error, refresh };
}

type UseCreateCampaignReturn = {
  create: (data: {
    brandId: string;
    name: string;
    description: string;
    storeTiers: string[];
    neighborhood: string;
    radiusKm: number;
    minStores: number;
    maxStores: number;
    couponPrefix: string;
    couponCount: number;
    discountValue: number;
    feeFixed: number;
    cpo: number;
    endDate: string;
  }) => Promise<Campaign>;
  isSubmitting: boolean;
  error: string | null;
};

/**
 * Hook to create a new campaign.
 */
export function useCreateCampaign(): UseCreateCampaignReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(data: {
    brandId: string;
    name: string;
    description: string;
    storeTiers: string[];
    neighborhood: string;
    radiusKm: number;
    minStores: number;
    maxStores: number;
    couponPrefix: string;
    couponCount: number;
    discountValue: number;
    feeFixed: number;
    cpo: number;
    endDate: string;
  }): Promise<Campaign> {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createCampaign(data.brandId, data);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear la campaña";
      setError(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }

  return { create, isSubmitting, error };
}
