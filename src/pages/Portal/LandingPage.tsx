import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Rocket, Scissors, Sparkles, Stethoscope, Store, LogIn, Building2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

/**
 * Marketing landing page shown on the base domain (no tenant subdomain).
 * Tenant public booking pages live on subdomains (e.g. acme.smallservicebusiness.com).
 */
export default function LandingPage() {
  const { t } = useTranslation();
  const loggedIn = useAuthStore((s) => s.isAuthenticated());

  return (
    <>
      <section className="portal-hero">
        <div className="portal-hero__icon">
          <CalendarDays size={36} />
        </div>
        <h1 className="portal-hero__title">{t('landing.title', 'Run your service business online')}</h1>
        <p className="portal-hero__subtitle">
          {t('landing.subtitle', 'Appointment booking, staff scheduling, and client management for barbershops, salons, clinics, and more.')}
        </p>
        <div className="portal-hero__actions">
          {!loggedIn && (
            <Link to="/register" className="portal-hero__btn portal-hero__btn--primary">
              <Rocket size={18} /> {t('landing.startTrial', 'Start free')}
            </Link>
          )}
          <Link to="/login" className="portal-hero__btn portal-hero__btn--secondary">
            <LogIn size={18} /> {t('portal.signIn')}
          </Link>
        </div>
      </section>

      <div className="portal-features">
        <div className="portal-feature-card">
          <div className="portal-feature-card__icon"><CalendarDays size={20} /></div>
          <h3 className="portal-feature-card__title">{t('landing.f1Title', 'Online booking 24/7')}</h3>
          <p className="portal-feature-card__desc">{t('landing.f1Desc', 'Give every client a mobile-friendly booking page. No app, no friction.')}</p>
        </div>
        <div className="portal-feature-card">
          <div className="portal-feature-card__icon"><Sparkles size={20} /></div>
          <h3 className="portal-feature-card__title">{t('landing.f2Title', 'Smart scheduling')}</h3>
          <p className="portal-feature-card__desc">{t('landing.f2Desc', 'Staff hours, time-off and buffers are respected automatically.')}</p>
        </div>
        <div className="portal-feature-card">
          <div className="portal-feature-card__icon"><Store size={20} /></div>
          <h3 className="portal-feature-card__title">{t('landing.f3Title', 'Multi-location ready')}</h3>
          <p className="portal-feature-card__desc">{t('landing.f3Desc', 'Branches, services, staff — scale from one chair to a franchise.')}</p>
        </div>
      </div>

      <section className="portal-verticals">
        <h2>{t('landing.industriesTitle', 'Built for any appointment business')}</h2>
        <div className="portal-verticals__grid">
          <div className="portal-vertical"><Scissors size={18}/> {t('bt.barbershop', 'Barbershops')}</div>
          <div className="portal-vertical"><Sparkles size={18}/> {t('bt.salon', 'Beauty Salons')}</div>
          <div className="portal-vertical"><Stethoscope size={18}/> {t('bt.medical', 'Clinics')}</div>
          <div className="portal-vertical"><Building2 size={18}/> {t('bt.other', 'Any service-based business')}</div>
        </div>
      </section>
    </>
  );
}
