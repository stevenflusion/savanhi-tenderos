import type { StoreRequest } from "@repo/api-contracts/products";
import { desc, eq, sql } from "drizzle-orm";
import { AppError } from "../../errors.js";
import type { DatabaseConnection } from "../connection.js";
import { stores } from "../schema.js";
import { mapStore } from "../mappers.js";
export function createStoresRepository(db: DatabaseConnection) { return {
  async listByOwner(ownerProfileId: string) { return (await db.select().from(stores).where(eq(stores.ownerUserId, ownerProfileId)).orderBy(desc(stores.createdAt))).map(mapStore); },
  async listIdsByOwner(ownerProfileId: string) { return (await db.select({ id: stores.id }).from(stores).where(eq(stores.ownerUserId, ownerProfileId))).map((row) => row.id); },
  async createForOwner(ownerProfileId: string, payload: StoreRequest) { const [row] = await db.insert(stores).values({ ownerUserId: ownerProfileId, name: payload.name, address: payload.address ?? null, latitude: payload.latitude ?? null, longitude: payload.longitude ?? null, paymentMethod: payload.paymentMethod ?? null, bankAccountName: payload.bankAccountName ?? null, bankAccountNumber: payload.bankAccountNumber ?? null, bankAccountType: payload.bankAccountType ?? null }).returning(); if (!row) throw new AppError("Unable to create store.", 502); return mapStore(row); },
  async count() { const [result] = await db.select({ count: sql<number>`count(*)` }).from(stores); return Number(result?.count ?? 0); },
}; }
