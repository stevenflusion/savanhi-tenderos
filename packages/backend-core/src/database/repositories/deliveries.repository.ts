import type { DeliveryStatus } from "@repo/api-contracts/deliveries";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { AppError } from "../../errors.js";
import type { DatabaseConnection } from "../connection.js";
import { deliveries } from "../schema.js";
import { mapDelivery } from "../mappers.js";
export function createDeliveriesRepository(db: DatabaseConnection) { return {
  async listAssigned(id: string) { return (await db.select().from(deliveries).where(eq(deliveries.deliveryUserId, id)).orderBy(desc(deliveries.createdAt))).map(mapDelivery); },
  async updateStatusByOrder(orderId: string, deliveryProfileId: string, status: DeliveryStatus) { const [row] = await db.update(deliveries).set({ status }).where(and(eq(deliveries.orderId, orderId), eq(deliveries.deliveryUserId, deliveryProfileId))).returning(); if (!row) throw new AppError("Delivery not found.", 404); return mapDelivery(row); },
  async listToday(id: string) { const start = new Date(); start.setUTCHours(0, 0, 0, 0); const end = new Date(start); end.setUTCDate(end.getUTCDate() + 1); return (await db.select().from(deliveries).where(and(eq(deliveries.deliveryUserId, id), gte(deliveries.createdAt, start), lte(deliveries.createdAt, end))).orderBy(asc(deliveries.createdAt))).map(mapDelivery); },
  async count() { const [result] = await db.select({ count: sql<number>`count(*)` }).from(deliveries); return Number(result?.count ?? 0); },
}; }
