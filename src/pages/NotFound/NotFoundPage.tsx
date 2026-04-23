import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div
      role="main"
      aria-label={t('common.pageNotFound', 'Page not found')}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '80vh', padding: '2rem', textAlign: 'center'
      }}
    >
      <div style={{ fontSize: 72, fontWeight: 700, color: 'var(--color-text-tertiary)', marginBottom: 8 }}>
        404
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: 'var(--color-text)' }}>
        {t('common.pageNotFound', 'Page not found')}
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 32, maxWidth: 400 }}>
        {t('common.pageNotFoundDesc', 'The page you are looking for does not exist or has been moved.')}
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className="btn btn-primary"
        aria-label={t('common.goToDashboard', 'Go to dashboard')}
      >
        {t('common.goToDashboard', 'Go to Dashboard')}
      </button>
    </div>
  );
}
