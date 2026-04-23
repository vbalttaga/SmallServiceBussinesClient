import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogIn, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import './Portal.css';

export default function PortalLayout() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const loggedIn = isAuthenticated();

  return (
    <div className="portal-layout">
      {/* Header */}
      <header className="portal-header">
        <Link to="/" className="portal-header__brand">
          {t('nav.brand')}
        </Link>
        <div className="portal-header__right">
          <LanguageSwitcher />
          {loggedIn ? (
            <Link to="/dashboard" className="portal-header__link portal-header__link--filled">
              <LayoutDashboard size={16} />
              {t('nav.dashboard')}
            </Link>
          ) : (
            <Link to="/login" className="portal-header__link portal-header__link--filled">
              <LogIn size={16} />
              {t('portal.signIn')}
            </Link>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="portal-content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="portal-footer">
        &copy; {new Date().getFullYear()} Small Service Business
      </footer>
    </div>
  );
}
