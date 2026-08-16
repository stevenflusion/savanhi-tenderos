import type { ProductRequest } from "@repo/api-contracts/products";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { AppError } from "../../errors.js";
import type { DatabaseConnection } from "../connection.js";
import { products } from "../schema.js";
import { mapProduct } from "../mappers.js";
export function createProductsRepository(db: DatabaseConnection) { return {
  async listActive() { return (await db.select().from(products).where(eq(products.active, true)).orderBy(desc(products.createdAt))).map(mapProduct); },
  async findActiveById(id: string) { const [row] = await db.select().from(products).where(and(eq(products.id, id), eq(products.active, true))); if (!row) throw new AppError("Product not found.", 404); return mapProduct(row); },
  async listRowsByIds(ids: string[]) { return db.select().from(products).where(and(inArray(products.id, ids), eq(products.active, true))); },
  async listByStoreIds(ids: string[]) { if (!ids.length) return []; return (await db.select().from(products).where(inArray(products.storeId, ids)).orderBy(desc(products.createdAt))).map(mapProduct); },
  async createForStore(storeId: string, payload: ProductRequest) { const [row] = await db.insert(products).values({ storeId, brandId: payload.brandId ?? null, name: payload.name, description: payload.description ?? null, price: String(payload.price), stock: payload.stock ?? 0, active: payload.active ?? true }).returning(); if (!row) throw new AppError("Unable to create product.", 502); return mapProduct(row); },
  async updateForStores(id: string, storeIds: string[], payload: Partial<ProductRequest>) { const [row] = await db.update(products).set({ storeId: payload.storeId, brandId: payload.brandId, name: payload.name, description: payload.description, price: payload.price === undefined ? undefined : String(payload.price), stock: payload.stock, active: payload.active }).where(and(eq(products.id, id), inArray(products.storeId, storeIds))).returning(); if (!row) throw new AppError("Product not found.", 404); return mapProduct(row); },
  async deactivateForStores(id: string, storeIds: string[]) { const [row] = await db.update(products).set({ active: false }).where(and(eq(products.id, id), inArray(products.storeId, storeIds))).returning(); if (!row) throw new AppError("Product not found.", 404); return mapProduct(row); },
  async count() { const [result] = await db.select({ count: sql<number>`count(*)` }).from(products); return Number(result?.count ?? 0); },
}; }
