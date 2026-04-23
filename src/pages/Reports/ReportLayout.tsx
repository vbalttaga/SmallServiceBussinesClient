import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart3, ChevronLeft, ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { reportApi } from '../../api/reportApi';
import { useAuthStore } from '../../store/authStore';
import { usePermission } from '../../hooks/usePermission';
import { P } from '../../constants/permissions';
import api from '../../api/client';
import type { ReportGroupDto } from '../../types/report';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import './Reports.css';

export default function ReportLayout() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<ReportGroupDto[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { code } = useParams<{ code?: string }>();
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const { hasPermission, isAdmin } = usePermission();

  const showAdminPanel = hasPermission(P.ADMIN_USERS_MANAGE);

  useEffect(() => {
    reportApi.getGroups()
      .then(res => setGroups(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Auto-expand the group containing the active report
  useEffect(() => {
    if (!code || groups.length === 0) return;
    for (const g of groups) {
      if (g.reports.some(r => r.code === code)) {
        setExpandedGroups(prev => {
          if (prev.has(g.id)) return prev;
          const next = new Set(prev);
          next.add(g.id);
          return next;
        });
        break;
      }
    }
  }, [code, groups]);

  const toggleGroup = (id: number) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
    <div className="report-layout">
      {/* Header */}
      <header className="report-header">
        <span className="report-header__brand">{t('nav.brand')}</span>
        <div className="report-header__right">
          <LanguageSwitcher />
          <div className="report-header__user">
            <span className="nav-avatar">{initials}</span>
            <span className="nav-username">{user?.firstName} {user?.lastName}</span>
          </div>
          {showAdminPanel && (
            <a href="/admin" className="nav-link-btn">{t('nav.controlPanel')}</a>
          )}
          <a href="/profile" className="nav-link-btn">{t('nav.profile')}</a>
          <button className="nav-link-btn" onClick={handleLogout}>{t('nav.signOut')}</button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="report-sidebar">
        <div className="report-sidebar__brand">
          <BarChart3 size={18} />
          <span>{t('reports.title')}</span>
        </div>

        <nav className="report-sidebar__nav">
          {loading ? (
            <div className="report-sidebar__loading">{t('common.loading')}</div>
          ) : groups.length === 0 ? (
            <div className="report-sidebar__loading">{t('reports.noGroups')}</div>
          ) : (
            groups.map(group => {
              const isExpanded = expandedGroups.has(group.id);
              return (
                <div key={group.id} className="rpt-sidebar-group">
                  <button
                    type="button"
                    className="rpt-sidebar-group__title"
                    onClick={() => toggleGroup(group.id)}
                  >
                    <BarChart3 size={14} />
                    <span>{group.name}</span>
                    {isExpanded
                      ? <ChevronDown size={14} className="rpt-sidebar-group__chevron" />
                      : <ChevronRight size={14} className="rpt-sidebar-group__chevron" />
                    }
                  </button>
                  {isExpanded && group.reports.map(report => (
                    <NavLink
                      key={report.code}
                      to={`/rpt/${report.code}`}
                      className={({ isActive }) =>
                        `rpt-sidebar-item ${isActive ? 'rpt-sidebar-item--active' : ''}`
                      }
                    >
                      {report.name}
                    </NavLink>
                  ))}
                </div>
              );
            })
          )}
        </nav>

        <div className="report-sidebar__footer">
          <button
            className="report-sidebar__back-btn"
            onClick={() => navigate('/dashboard')}
          >
            <ChevronLeft size={16} />
            {t('nav.dashboard')}
          </button>
          {isAdmin && (
            <button
              className="report-sidebar__back-btn"
              onClick={() => navigate('/admin')}
            >
              <Settings size={16} />
              {t('nav.controlPanel')}
            </button>
          )}
        </div>
      </aside>

      {/* Content */}
      <main className="report-content">
        <Outlet />
      </main>
    </div>
  );
}
