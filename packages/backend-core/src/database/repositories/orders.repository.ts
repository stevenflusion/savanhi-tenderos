import type { CreateOrderRequest, OrderStatus } from "@repo/api-contracts/orders";
import { ORDER_STATUSES } from "@repo/api-contracts/orders";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { AppError } from "../../errors.js";
import type { DatabaseConnection } from "../connection.js";
import { mapOrder } from "../mappers.js";
import { orderItems, orders, products } from "../schema.js";
export function createOrdersRepository(db: DatabaseConnection) { return {
  async createForClient(clientProfileId: string, payload: CreateOrderRequest) { return db.transaction(async (tx) => { const rows = await tx.select().from(products).where(and(inArray(products.id, payload.items.map((item) => item.productId)), eq(products.active, true))); if (rows.length !== payload.items.length) throw new AppError("One or more products are unavailable.", 409); const total = payload.items.reduce((sum, item) => sum + Number(rows.find((product) => product.id === item.productId)?.price ?? 0) * item.quantity, 0); const [order] = await tx.insert(orders).values({ clientUserId: clientProfileId, storeId: payload.storeId, total: String(total) }).returning(); if (!order) throw new AppError("Unable to create order.", 502); await tx.insert(orderItems).values(payload.items.map((item) => ({ orderId: order.id, productId: item.productId, quantity: item.quantity, unitPrice: String(rows.find((product) => product.id === item.productId)?.price ?? 0) }))); return mapOrder(order); }); },
  async listByClient(id: string) { return (await db.select().from(orders).where(eq(orders.clientUserId, id)).orderBy(desc(orders.createdAt))).map(mapOrder); },
  async findByClient(id: string, clientProfileId: string) { const [row] = await db.select().from(orders).where(and(eq(orders.id, id), eq(orders.clientUserId, clientProfileId))); if (!row) throw new AppError("Order not found.", 404); return mapOrder(row); },
  async cancelByClient(id: string, clientProfileId: string) { const [row] = await db.update(orders).set({ status: "cancelled" }).where(and(eq(orders.id, id), eq(orders.clientUserId, clientProfileId), inArray(orders.status, ORDER_STATUSES.filter((status) => status !== "delivered" && status !== "cancelled")))).returning(); if (!row) throw new AppError("Order cannot be cancelled.", 409); return mapOrder(row); },
  async listByStoreIds(ids: string[]) { if (!ids.length) return []; return (await db.select().from(orders).where(inArray(orders.storeId, ids)).orderBy(desc(orders.createdAt))).map(mapOrder); },
  async updateStatusForStores(id: string, ids: string[], status: OrderStatus) { const [row] = await db.update(orders).set({ status }).where(and(eq(orders.id, id), inArray(orders.storeId, ids))).returning(); if (!row) throw new AppError("Order not found.", 404); return mapOrder(row); },
  async count() { const [result] = await db.select({ count: sql<number>`count(*)` }).from(orders); return Number(result?.count ?? 0); },
}; }
