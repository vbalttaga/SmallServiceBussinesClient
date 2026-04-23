import { useEffect, useMemo, useState } from 'react';
import { Outlet, NavLink, useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, ChevronLeft, ChevronDown, ChevronRight, Database, Settings, FileText, Users, Globe, BarChart3, Navigation, Cog, Shield, Building2, Palette } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';
import type { EntityMetadata } from '../../types/admin';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import './AdminPanel.css';

const groupIcons: Record<string, React.ReactNode> = {
  Documents: <FileText size={14} />,
  Settings: <Settings size={14} />,
  UserManagement: <Users size={14} />,
  Translate: <Globe size={14} />,
  Rapoarte: <BarChart3 size={14} />,
  Navigation: <Navigation size={14} />,
  System: <Cog size={14} />,
  None: <Database size={14} />,
};

export default function AdminLayout() {
  const { t } = useTranslation();
  const [entities, setEntities] = useState<EntityMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { entityName } = useParams<{ entityName?: string }>();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    adminApi.getEntities()
      .then(res => setEntities(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, EntityMetadata[]>();
    entities.forEach(e => {
      const list = map.get(e.group) || [];
      list.push(e);
      map.set(e.group, list);
    });
    return map;
  }, [entities]);

  // Auto-expand the group containing the currently active entity
  useEffect(() => {
    if (!entityName || grouped.size === 0) return;
    for (const [group, items] of grouped.entries()) {
      if (items.some(e => e.typeName === entityName)) {
        setExpandedGroups(prev => {
          if (prev.has(group)) return prev;
          const next = new Set(prev);
          next.add(group);
          return next;
        });
        break;
      }
    }
  }, [entityName, grouped]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const handleLogout = async () => {
    await api.post('/auth/logout').catch(() => {});
    logout();
    navigate('/login');
  };

  const initials = user
    ? `${(user.firstName?.[0] ?? '').toUpperCase()}${(user.lastName?.[0] ?? '').toUpperCase()}`
    : '';

  return (
    <div className="admin-layout">
      {/* Header */}
      <header className="admin-header">
        <Link to="/dashboard" className="admin-header__brand" style={{ textDecoration: 'none', color: '#fff' }}>{t('nav.brand')}</Link>
        <div className="admin-header__right">
          <LanguageSwitcher />
          <div className="admin-header__user">
            <span className="nav-avatar">{initials}</span>
            <span className="nav-username">{user?.firstName} {user?.lastName}</span>
          </div>
          <a href="/profile" className="nav-link-btn">{t('nav.profile')}</a>
          <button className="nav-link-btn" onClick={handleLogout}>{t('nav.signOut')}</button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <LayoutDashboard size={18} />
          <span>{t('admin.title')}</span>
        </div>

        <nav className="admin-sidebar__nav">
          {loading ? (
            <div className="admin-sidebar__loading">{t('common.loading')}</div>
          ) : (
            Array.from(grouped.entries()).map(([group, items]) => {
              const isExpanded = expandedGroups.has(group);
              return (
                <div key={group} className={`sidebar-group ${isExpanded ? 'sidebar-group--expanded' : ''}`}>
                  <button
                    type="button"
                    className="sidebar-group__title"
                    onClick={() => toggleGroup(group)}
                  >
                    {groupIcons[group] || <Database size={14} />}
                    <span>{t(`admin.groups.${group}`, group)}</span>
                    {isExpanded
                      ? <ChevronDown size={14} className="sidebar-group__chevron" />
                      : <ChevronRight size={14} className="sidebar-group__chevron" />
                    }
                  </button>
                  {isExpanded && items.map(entity => (
                    <NavLink
                      key={entity.typeName}
                      to={`/admin/${entity.typeName}`}
                      className={({ isActive }) =>
                        `sidebar-item ${isActive ? 'sidebar-item--active' : ''}`
                      }
                    >
                      {entity.displayName}
                    </NavLink>
                  ))}
                </div>
              );
            })
          )}

          {/* Org Management links */}
          <div className="sidebar-group sidebar-group--expanded" style={{ marginTop: 8 }}>
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'sidebar-item--active' : ''}`
              }
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Users size={14} />
              {t('orgUsers.title')}
            </NavLink>
            <NavLink
              to="/admin/roles"
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'sidebar-item--active' : ''}`
              }
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Shield size={14} />
              {t('rbac.title')}
            </NavLink>
            <NavLink
              to="/admin/settings"
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'sidebar-item--active' : ''}`
              }
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Settings size={14} />
              {t('orgSettings.title')}
            </NavLink>
            <NavLink
              to="/admin/design"
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'sidebar-item--active' : ''}`
              }
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Palette size={14} />
              {t('design.navLabel', 'Design & Branding')}
            </NavLink>
            <NavLink
              to="/admin/structure"
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'sidebar-item--active' : ''}`
              }
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Building2 size={14} />
              {t('orgStructure.title') || 'Structure'}
            </NavLink>
          </div>
        </nav>

        <div className="admin-sidebar__footer">
          <button
            className="admin-sidebar__back-btn"
            onClick={() => navigate('/rpt')}
          >
            <BarChart3 size={16} />
            {t('reports.title')}
          </button>
          <button
            className="admin-sidebar__back-btn"
            onClick={() => navigate('/dashboard')}
          >
            <ChevronLeft size={16} />
            {t('nav.dashboard')}
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
