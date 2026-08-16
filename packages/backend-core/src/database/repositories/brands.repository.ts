import type { BrandRequest } from "@repo/api-contracts/users";
import { desc, eq, sql } from "drizzle-orm";
import { AppError } from "../../errors.js";
import type { DatabaseConnection } from "../connection.js";
import { brands } from "../schema.js";
import { mapBrand } from "../mappers.js";
export function createBrandsRepository(db: DatabaseConnection) { return {
  async list() { return (await db.select().from(brands).orderBy(desc(brands.createdAt))).map(mapBrand); },
  async create(payload: BrandRequest) { const [row] = await db.insert(brands).values({ name: payload.name, ownerUserId: payload.ownerProfileId ?? null, active: payload.active ?? true }).returning(); if (!row) throw new AppError("Unable to create brand.", 502); return mapBrand(row); },
  async update(id: string, payload: Partial<BrandRequest>) { const [row] = await db.update(brands).set({ name: payload.name, ownerUserId: payload.ownerProfileId, active: payload.active }).where(eq(brands.id, id)).returning(); if (!row) throw new AppError("Brand not found.", 404); return mapBrand(row); },
  async count() { const [result] = await db.select({ count: sql<number>`count(*)` }).from(brands); return Number(result?.count ?? 0); },
}; }
