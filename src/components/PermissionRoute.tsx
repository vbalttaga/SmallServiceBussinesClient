import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePermission } from '../hooks/usePermission';
import type { PermissionCode } from '../constants/permissions';

interface PermissionRouteProps {
  /** Required permission code (single). */
  permission?: PermissionCode | string;
  /** Alternative: require ANY of these permission codes. */
  anyOf?: (PermissionCode | string)[];
  /** Where to redirect when permission is denied (default: /dashboard). */
  redirectTo?: string;
  children: React.ReactNode;
}

/**
 * Route guard that checks:
 *  1. User is authenticated (has a token).
 *  2. User has the required permission code(s).
 *
 * Usage in App.tsx:
 *   <PermissionRoute permission={P.ADMIN_USERS_MANAGE}>
 *     <AdminLayout />
 *   </PermissionRoute>
 */
export default function PermissionRoute({
  permission,
  anyOf,
  redirectTo = '/dashboard',
  children,
}: PermissionRouteProps) {
  const { isAuthenticated } = useAuthStore();
  const { hasPermission, hasAnyPermission } = usePermission();

  // Must be logged in
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Check permissions
  if (permission && !hasPermission(permission)) {
    return <Navigate to={redirectTo} replace />;
  }

  if (anyOf && anyOf.length > 0 && !hasAnyPermission(...anyOf)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
