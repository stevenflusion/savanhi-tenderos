import type { AuthRole } from "@repo/api-contracts/auth";
import type { DeliveryStatus } from "@repo/api-contracts/deliveries";
import type { OrderStatus } from "@repo/api-contracts/orders";
import type { StoreBankAccountType, StorePaymentMethod } from "@repo/api-contracts/products";

export type Database = {
  public: {
    Tables: {
      roles: {
        Row: {
          id: string;
          name: AuthRole;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: AuthRole;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["roles"]["Insert"]>;
      };
      users: {
        Row: {
          id: string;
          role_id: string;
          email: string;
          full_name: string;
          active: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          role_id: string;
          email: string;
          full_name: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      login: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["login"]["Insert"]>;
      };
      register: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["register"]["Insert"]>;
      };
      brands: {
        Row: {
          id: string;
          name: string;
          owner_user_id: string | null;
          active: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          owner_user_id?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["brands"]["Insert"]>;
      };
      stores: {
        Row: {
          id: string;
          owner_user_id: string;
          name: string;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          payment_method: StorePaymentMethod | null;
          bank_account_name: string | null;
          bank_account_number: string | null;
          bank_account_type: StoreBankAccountType | null;
          active: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          name: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          payment_method?: StorePaymentMethod | null;
          bank_account_name?: string | null;
          bank_account_number?: string | null;
          bank_account_type?: StoreBankAccountType | null;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stores"]["Insert"]>;
      };
      products: {
        Row: {
          id: string;
          store_id: string | null;
          brand_id: string | null;
          name: string;
          description: string | null;
          price: number;
          stock: number;
          active: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          store_id?: string | null;
          brand_id?: string | null;
          name: string;
          description?: string | null;
          price: number;
          stock?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          client_user_id: string | null;
          store_id: string | null;
          status: OrderStatus;
          total: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          client_user_id?: string | null;
          store_id?: string | null;
          status?: OrderStatus;
          total?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          quantity: number;
          unit_price: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          quantity: number;
          unit_price: number;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
      };
      deliveries: {
        Row: {
          id: string;
          order_id: string | null;
          delivery_user_id: string | null;
          status: DeliveryStatus;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          delivery_user_id?: string | null;
          status?: DeliveryStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deliveries"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
