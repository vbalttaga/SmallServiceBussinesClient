import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react';
import { rbacApi, type RbacRole } from '../../api/rbacApi';
import PermissionMatrix from '../../components/PermissionMatrix';
import './AdminPanel.css';

export default function RolesPage() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<RbacRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoles = () => {
    rbacApi.getRoles()
      .then(res => setRoles(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(loadRoles, []);

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={20} />
          <h1 className="admin-page__title">{t('rbac.title')}</h1>
        </div>
        <p className="admin-page__subtitle">{t('rbac.subtitle')}</p>
      </div>

      {/* Role summary cards */}
      {!loading && roles.length > 0 && (
        <div className="rbac-role-cards">
          {roles.map(role => (
            <div key={role.roleId} className="rbac-role-card">
              <div className="rbac-role-card__name">{role.name}</div>
              <div className="rbac-role-card__code">{role.code}</div>
              <div className="rbac-role-card__meta">
                {role.userCount} {t('rbac.users')}
                {role.isSystemRole && (
                  <span className="rbac-role-card__badge">{t('rbac.system')}</span>
                )}
              </div>
              {role.description && (
                <div className="rbac-role-card__desc">{role.description}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Permission matrix */}
      <div style={{ marginTop: 24 }}>
        <h2 className="admin-page__section-title">{t('rbac.matrix')}</h2>
        <PermissionMatrix roles={roles} onSaved={loadRoles} />
      </div>
    </div>
  );
}
