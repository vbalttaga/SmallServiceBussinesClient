import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { rbacApi, type RbacRole, type RbacPermission } from '../api/rbacApi';
import { toast } from '../store/toastStore';
import './PermissionMatrix.css';

interface PermissionMatrixProps {
  roles: RbacRole[];
  onSaved?: () => void;
}

export default function PermissionMatrix({ roles, onSaved }: PermissionMatrixProps) {
  const { t } = useTranslation();
  const [allPermissions, setAllPermissions] = useState<RbacPermission[]>([]);
  const [matrix, setMatrix] = useState<Record<number, Set<number>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

  // Group permissions by category
  const grouped = useMemo(() => {
    const map = new Map<string, RbacPermission[]>();
    allPermissions.forEach(p => {
      const cat = p.category || 'other';
      const list = map.get(cat) || [];
      list.push(p);
      map.set(cat, list);
    });
    return map;
  }, [allPermissions]);

  // Load all permissions + each role's assigned permissions
  useEffect(() => {
    (async () => {
      try {
        const [permsRes, ...rolePermsRes] = await Promise.all([
          rbacApi.getAllPermissions(),
          ...roles.map(r => rbacApi.getRolePermissions(r.roleId)),
        ]);

        setAllPermissions(permsRes.data);

        const mat: Record<number, Set<number>> = {};
        roles.forEach((role, idx) => {
          mat[role.roleId] = new Set(rolePermsRes[idx].data.map(p => p.permissionId));
        });
        setMatrix(mat);
      } catch {
        toast.error(t('admin.saveFailed'));
      } finally {
        setLoading(false);
      }
    })();
  }, [roles]);

  const togglePermission = (roleId: number, permissionId: number) => {
    setMatrix(prev => {
      const set = new Set(prev[roleId] || []);
      if (set.has(permissionId)) set.delete(permissionId);
      else set.add(permissionId);
      return { ...prev, [roleId]: set };
    });
  };

  const saveRole = async (roleId: number) => {
    setSaving(roleId);
    try {
      const permissionIds = Array.from(matrix[roleId] || []);
      await rbacApi.updateRolePermissions(roleId, permissionIds);
      toast.success(t('api.UPDATED_OK'));
      onSaved?.();
    } catch {
      toast.error(t('admin.saveFailed'));
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div className="pm-loading">{t('common.loading')}</div>;
  }

  return (
    <div className="permission-matrix">
      <div className="pm-table-wrap">
        <table className="pm-table">
          <thead>
            <tr>
              <th className="pm-th-perm">{t('rbac.permission')}</th>
              {roles.map(role => (
                <th key={role.roleId} className="pm-th-role">
                  <div className="pm-role-header">
                    <span className="pm-role-name">{role.name}</span>
                    <span className="pm-role-code">{role.code}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from(grouped.entries()).map(([category, perms]) => (
              <>
                <tr key={`cat-${category}`} className="pm-category-row">
                  <td colSpan={roles.length + 1} className="pm-category-cell">
                    {t(`rbac.categories.${category}`, category)}
                  </td>
                </tr>
                {perms.map(perm => (
                  <tr key={perm.permissionId}>
                    <td className="pm-perm-cell">
                      <span className="pm-perm-name">{perm.name}</span>
                      <span className="pm-perm-code">{perm.code}</span>
                    </td>
                    {roles.map(role => (
                      <td key={role.roleId} className="pm-check-cell">
                        <input
                          type="checkbox"
                          className="pm-checkbox"
                          checked={matrix[role.roleId]?.has(perm.permissionId) ?? false}
                          onChange={() => togglePermission(role.roleId, perm.permissionId)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td></td>
              {roles.map(role => (
                <td key={role.roleId} className="pm-save-cell">
                  <button
                    className="pm-save-btn"
                    disabled={saving === role.roleId}
                    onClick={() => saveRole(role.roleId)}
                  >
                    {saving === role.roleId ? t('common.saving') : t('common.save')}
                  </button>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
