import type { AuthRole } from "@repo/api-contracts";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  displayName: string;
  savanhiId: string;
  role: AuthRole;
  active: boolean;
}
