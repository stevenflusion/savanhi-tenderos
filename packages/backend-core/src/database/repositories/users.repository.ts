import type { AuthUser } from "@repo/api-contracts/auth";
import type { UserStatusRequest } from "@repo/api-contracts/users";
import { AppError } from "../../errors.js";
import { mapAdminUser, mapProfile } from "../../supabase/mappers.js";
import type { AppSupabaseClient } from "../../supabase/clients.js";

const userSelect = "*, roles(name)";

export function createUsersRepository(db: AppSupabaseClient) {
  async function findRoleId(role: AuthUser["role"]): Promise<string> {
    const { data, error } = await db.from("roles").select("id").eq("name", role).single();
    if (error) throw new AppError(`Role ${role} is not configured.`, 500, error);
    return data.id;
  }

  return {
    async ensure(user: AuthUser): Promise<AuthUser> {
      const roleId = await findRoleId(user.role);
      const { data, error } = await db
        .from("users")
        .upsert(
          {
            id: user.id,
            role_id: roleId,
            email: user.email,
            full_name: user.fullName,
            active: user.active,
          },
          { onConflict: "id" }
        )
        .select(userSelect)
        .single();

      if (error) throw new AppError(error.message, 502, error);
      return mapProfile(data);
    },

    async findById(id: string): Promise<AuthUser | null> {
      const { data, error } = await db.from("users").select(userSelect).eq("id", id).single();
      if (error) return null;
      return mapProfile(data);
    },

    async listAdminUsers() {
      const { data, error } = await db.from("users").select(userSelect).order("created_at", { ascending: false });
      if (error) throw new AppError(error.message, 502, error);
      return data.map(mapAdminUser);
    },

    async updateProfile(id: string, payload: { fullName: string }): Promise<AuthUser> {
      const { data, error } = await db
        .from("users")
        .update({ full_name: payload.fullName })
        .eq("id", id)
        .select(userSelect)
        .single();

      if (error) throw new AppError(error.message, 404, error);
      return mapProfile(data);
    },

    async updateStatus(id: string, payload: UserStatusRequest) {
      const { data, error } = await db
        .from("users")
        .update({ active: payload.active })
        .eq("id", id)
        .select(userSelect)
        .single();

      if (error) throw new AppError(error.message, 404, error);
      return mapAdminUser(data);
    },

    async count(): Promise<number> {
      const { count, error } = await db.from("users").select("id", { count: "exact", head: true });
      if (error) throw new AppError(error.message, 502, error);
      return count ?? 0;
    },
  };
}
