import type { StoreRequest } from "@repo/api-contracts/products";
import { AppError } from "../../errors.js";
import type { AppSupabaseClient } from "../../supabase/clients.js";
import { mapStore } from "../../supabase/mappers.js";

export function createStoresRepository(db: AppSupabaseClient) {
  return {
    async listByOwner(ownerProfileId: string) {
      const { data, error } = await db
        .from("stores")
        .select("*")
        .eq("owner_user_id", ownerProfileId)
        .order("created_at", { ascending: false });

      if (error) throw new AppError(error.message, 502, error);
      return data.map(mapStore);
    },

    async listIdsByOwner(ownerProfileId: string): Promise<string[]> {
      const { data, error } = await db.from("stores").select("id").eq("owner_user_id", ownerProfileId);
      if (error) throw new AppError(error.message, 502, error);
      return data.map((store) => store.id);
    },

    async createForOwner(ownerProfileId: string, payload: StoreRequest) {
      const { data, error } = await db
        .from("stores")
        .insert({
          owner_user_id: ownerProfileId,
          name: payload.name,
          address: payload.address ?? null,
          latitude: payload.latitude ?? null,
          longitude: payload.longitude ?? null,
          payment_method: payload.paymentMethod ?? null,
          bank_account_name: payload.bankAccountName ?? null,
          bank_account_number: payload.bankAccountNumber ?? null,
          bank_account_type: payload.bankAccountType ?? null,
        })
        .select()
        .single();

      if (error) throw new AppError(error.message, 502, error);
      return mapStore(data);
    },

    async count(): Promise<number> {
      const { count, error } = await db.from("stores").select("id", { count: "exact", head: true });
      if (error) throw new AppError(error.message, 502, error);
      return count ?? 0;
    },
  };
}
