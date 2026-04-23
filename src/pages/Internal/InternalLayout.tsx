import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, CalendarDays, Users, Scissors, Building2, Settings, LogOut, Shield, BarChart3 } from 'lucide-react';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { usePermission } from '../../hooks/usePermission';
import { P } from '../../constants/permissions';
import ThemeToggle from '../../components/ThemeToggle';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import './Internal.css';

export default function InternalLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { hasAny } = usePermission();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [navigate]);

  const signOut = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    logout();
    navigate('/login');
  };

  const nav = [
    { to: '/internal',          icon: <LayoutDashboard size={18} />, label: t('internal.dashboard', 'Dashboard') },
    { to: '/internal/schedule', icon: <CalendarDays size={18} />,    label: t('internal.schedule',  'Schedule')  },
    { to: '/internal/clients',  icon: <Users size={18} />,           label: t('internal.clients',   'Clients')   },
  ];

  const adminLinks = [
    hasAny([P.CATALOG_SERVICES_MANAGE, P.CATALOG_STAFF_MANAGE, P.CATALOG_BRANCHES_MANAGE, P.ORG_USERS_MANAGE])
      && { to: '/admin', icon: <Shield size={18} />, label: t('nav.admin', 'Admin') },
    hasAny([P.REPORTS_VIEW]) && { to: '/rpt', icon: <BarChart3 size={18} />, label: t('nav.reports', 'Reports') },
    { to: '/admin/settings', icon: <Settings size={18} />, label: t('internal.settings', 'Settings') },
  ].filter(Boolean) as { to: string; icon: React.ReactNode; label: string }[];

  return (
    <div className="int-layout">
      <aside className={'int-sidebar ' + (open ? 'open' : '')}>
        <div className="int-brand">{user?.orgName ?? t('nav.brand')}</div>

        <nav className="int-nav">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/internal'} className={({ isActive }) => 'int-link' + (isActive ? ' active' : '')}>
              {n.icon} <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        {adminLinks.length > 0 && (
          <>
            <div className="int-sep">{t('internal.manage', 'Manage')}</div>
            <nav className="int-nav">
              {adminLinks.map((n) => (
                <NavLink key={n.to} to={n.to} className={({ isActive }) => 'int-link' + (isActive ? ' active' : '')}>
                  {n.icon} <span>{n.label}</span>
                </NavLink>
              ))}
            </nav>
          </>
        )}

        <div className="int-bottom">
          <div className="int-tools">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <button onClick={signOut} className="int-signout"><LogOut size={16} /> {t('nav.signOut', 'Sign out')}</button>
        </div>
      </aside>

      <button className="int-burger" onClick={() => setOpen((o) => !o)} aria-label="toggle menu">
        <Scissors size={18} />
      </button>

      <main className="int-main">
        <Outlet />
      </main>
    </div>
  );
}
