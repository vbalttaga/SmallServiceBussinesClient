import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { translateApiMessage } from '../../utils/apiMessage';
import type { TokenResponse } from '../../types';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { getSubdomainSlug } from '../../utils/tenant';

interface LoginForm {
  login: string;
  password: string;
}

export default function LoginPage() {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  // Subdomain takes priority, query param as fallback
  const orgSlug = getSubdomainSlug() || searchParams.get('org') || undefined;
  const [orgName, setOrgName] = useState('');

  useEffect(() => {
    if (orgSlug) {
      api.get(`/auth/org/${orgSlug}`).then(res => {
        setOrgName(res.data.name);
      }).catch(() => {
        setError(t('api.ORG_NOT_FOUND'));
      });
    }
  }, [orgSlug, t]);

  const onSubmit = async (data: LoginForm) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post<TokenResponse>('/auth/login', {
        ...data,
        orgSlug,
      });
      login(res.data.accessToken, res.data.refreshToken, res.data.user);
      navigate('/dashboard');
    } catch (e: any) {
      const code = e.response?.data?.message;
      setError(code ? translateApiMessage(code, t) : t('api.INVALID_CREDENTIALS'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
    }}>
      <div style={{ width: 340, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <LanguageSwitcher />
        </div>
        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: '-0.04em',
          color: 'var(--color-text)',
          margin: '0 0 6px',
        }}>
          {t('login.title')}
        </h1>
        {orgName && (
          <p style={{
            fontSize: 15,
            color: 'var(--color-primary, #007aff)',
            margin: '0 0 8px',
            fontWeight: 500,
          }}>
            {orgName}
          </p>
        )}
        <p style={{
          fontSize: 17,
          color: 'var(--color-text-secondary)',
          margin: '0 0 36px',
          fontWeight: 400,
        }}>
          {t('login.subtitle')}
        </p>

        {error && (
          <p style={{
            color: '#ff3b30',
            fontSize: 14,
            margin: '0 0 20px',
          }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 400,
              color: 'var(--color-text-secondary)',
              marginBottom: 6,
            }}>
              {t('login.login')}
            </label>
            <input
              type="text"
              className={`form-control ${errors.login ? 'is-invalid' : ''}`}
              style={{ padding: '12px 16px', fontSize: 16 }}
              {...register('login', { required: t('login.loginRequired') })}
            />
            {errors.login && <div className="invalid-feedback">{errors.login.message}</div>}
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 400,
              color: 'var(--color-text-secondary)',
              marginBottom: 6,
            }}>
              {t('login.password')}
            </label>
            <input
              type="password"
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              style={{ padding: '12px 16px', fontSize: 16 }}
              {...register('password', { required: t('login.passwordRequired') })}
            />
            {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 0',
              background: 'var(--color-text)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontFamily: 'inherit',
              fontWeight: 400,
              fontSize: 16,
              letterSpacing: '-0.01em',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? t('login.signingIn') : t('login.signIn')}
          </button>
        </form>
      </div>
    </div>
  );
}
