"use client";

import { RoleGuard } from "./role-guard";
import type { ReactNode } from "react";

type AdminGuardProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * AdminGuard restricts its children to admin users.
 * Wraps RoleGuard with allowedRoles={["admin"]}.
 */
export function AdminGuard({ children, fallback }: AdminGuardProps) {
  return (
    <RoleGuard allowedRoles={["admin"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}
