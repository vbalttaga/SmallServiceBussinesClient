import api from './client';

// ─── Types ───────────────────────────────────────────────────

export interface RbacRole {
  roleId: number;
  name: string;
  code: string;
  description: string;
  isSystemRole: boolean;
  userCount: number;
}

export interface RbacPermission {
  permissionId: number;
  name: string;
  code: string;
  description: string;
  category: string;
  value: number;
}

// ─── API calls ───────────────────────────────────────────────

export const rbacApi = {
  // Roles
  getRoles: () =>
    api.get<RbacRole[]>('/roles'),

  getRolePermissions: (roleId: number) =>
    api.get<RbacPermission[]>(`/roles/${roleId}/permissions`),

  updateRolePermissions: (roleId: number, permissionIds: number[]) =>
    api.put(`/roles/${roleId}/permissions`, { permissionIds }),

  // Permissions
  getAllPermissions: () =>
    api.get<RbacPermission[]>('/permissions'),

  // User roles
  getUserRoles: (userId: number) =>
    api.get<RbacRole[]>(`/users/${userId}/roles`),

  updateUserRoles: (userId: number, roleIds: number[]) =>
    api.put(`/users/${userId}/roles`, { roleIds }),
};
