import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import type { PermissionCode } from '../constants/permissions';

/**
 * Hook for checking user permissions using the string-code RBAC system.
 *
 * Usage:
 *   const { hasPermission, hasAnyPermission, hasRole, isAdmin } = usePermission();
 *   if (hasPermission(P.LEAVE_APPROVE)) { ... }
 */
export function usePermission() {
  const user = useAuthStore((s) => s.user);

  const permissionSet = useMemo(
    () => new Set((user?.permissions ?? []).map((p) => p.toLowerCase())),
    [user?.permissions]
  );

  const roleSet = useMemo(
    () => new Set((user?.roles ?? []).map((r) => r.toLowerCase())),
    [user?.roles]
  );

  /** Check if the user has a specific permission code. */
  const hasPermission = (code: PermissionCode | string): boolean =>
    permissionSet.has(code.toLowerCase());

  /** Check if the user has at least one of the given permission codes. */
  const hasAnyPermission = (...codes: (PermissionCode | string)[]): boolean =>
    codes.some((c) => permissionSet.has(c.toLowerCase()));

  /** Check if the user has all of the given permission codes. */
  const hasAllPermissions = (...codes: (PermissionCode | string)[]): boolean =>
    codes.every((c) => permissionSet.has(c.toLowerCase()));

  /** Check if the user has a specific role code. */
  const hasRole = (code: string): boolean =>
    roleSet.has(code.toLowerCase());

  /** Shorthand: user has admin role. */
  const isAdmin = roleSet.has('admin');

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
    permissions: user?.permissions ?? [],
    roles: user?.roles ?? [],
  };
}
