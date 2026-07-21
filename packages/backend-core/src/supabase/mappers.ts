import type { AuthUser } from "@repo/api-contracts/auth";
import type { Delivery } from "@repo/api-contracts/deliveries";
import type { Order } from "@repo/api-contracts/orders";
import type { Product, Store } from "@repo/api-contracts/products";
import type { AdminUser, Brand } from "@repo/api-contracts/users";
import { normalizeRole } from "../roles.js";
import type { Database } from "../types/database.js";

type Tables = Database["public"]["Tables"];

type UserRow = Tables["users"]["Row"] & {
  roles?: { name?: string | null } | null;
};

export function mapProfile(row: UserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: normalizeRole(row.roles?.name, "tendero"),
    active: row.active,
  };
}

export function mapAdminUser(row: UserRow): AdminUser {
  return {
    ...mapProfile(row),
    createdAt: row.created_at,
  };
}

export function mapBrand(row: Tables["brands"]["Row"]): Brand {
  return {
    id: row.id,
    name: row.name,
    ownerProfileId: row.owner_user_id,
    active: row.active,
    createdAt: row.created_at,
  };
}

export function mapStore(row: Tables["stores"]["Row"]): Store {
  return {
    id: row.id,
    ownerProfileId: row.owner_user_id,
    name: row.name,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    paymentMethod: row.payment_method,
    bankAccountName: row.bank_account_name,
    bankAccountNumber: row.bank_account_number,
    bankAccountType: row.bank_account_type,
    active: row.active,
    createdAt: row.created_at,
  };
}

export function mapProduct(row: Tables["products"]["Row"]): Product {
  return {
    id: row.id,
    storeId: row.store_id,
    brandId: row.brand_id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    stock: row.stock,
    active: row.active,
    createdAt: row.created_at,
  };
}

export function mapOrder(row: Tables["orders"]["Row"]): Order {
  return {
    id: row.id,
    clientProfileId: row.client_user_id,
    storeId: row.store_id,
    status: row.status,
    total: Number(row.total),
    createdAt: row.created_at,
  };
}

export function mapDelivery(row: Tables["deliveries"]["Row"]): Delivery {
  return {
    id: row.id,
    orderId: row.order_id,
    deliveryProfileId: row.delivery_user_id,
    status: row.status,
    createdAt: row.created_at,
  };
}
