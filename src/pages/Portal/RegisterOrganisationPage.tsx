import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { businessTypesApi } from '../../api/appointmentsApi';
import { useAuthStore } from '../../store/authStore';
import { translateApiMessage } from '../../utils/apiMessage';
import type { BusinessTypeDto, TokenResponse } from '../../types';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import TemplatePicker from '../../components/TemplatePicker';
import { Building2, ExternalLink, ArrowRight, Palette } from 'lucide-react';

interface RegisterForm {
  organisationName: string;
  businessTypeCode: string;
  designTemplateCode: string;
  firstName: string;
  lastName: string;
  email: string;
  login: string;
  password: string;
  phone: string;
  timezone: string;
  currency: string;
}

export default function RegisterOrganisationPage() {
  const { t } = useTranslation();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterForm>({
    defaultValues: {
      businessTypeCode: 'barbershop',
      designTemplateCode: 'fresh-clean',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      currency: 'EUR',
    },
  });
  const navigate = useNavigate();
  const { login: authLogin } = useAuthStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [subdomainUrl, setSubdomainUrl] = useState('');
  const [businessTypes, setBusinessTypes] = useState<BusinessTypeDto[]>([]);
  const selectedTypeCode = watch('businessTypeCode');
  const selectedTemplate = watch('designTemplateCode');

  useEffect(() => {
    businessTypesApi.list()
      .then((list) => {
        setBusinessTypes(list);
        if (list.length && !selectedTypeCode) setValue('businessTypeCode', list[0].code);
      })
      .catch(() => setBusinessTypes([]));

  }, []);

  const onSubmit = async (data: RegisterForm) => {
    setError(''); setLoading(true);
    try {
      const res = await api.post<TokenResponse>('/auth/register', data);
      authLogin(res.data.accessToken, res.data.refreshToken, res.data.user);
      if (res.data.subdomainUrl) setSubdomainUrl(res.data.subdomainUrl);
      else navigate('/dashboard');
    } catch (e: unknown) {
      const code = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(code ? translateApiMessage(code, t) : t('api.REGISTRATION_FAILED'));
    } finally { setLoading(false); }
  };

  const labelStyle = { display: 'block', fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 };
  const inputStyle = { padding: '10px 14px', fontSize: 15 };

  if (subdomainUrl) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <div style={{ width: 420, textAlign: 'center' }}>
          <div style={{ marginBottom: 16 }}><Building2 size={40} /></div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 8px' }}>{t('register.successTitle', 'Your business is live!')}</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>
            {t('register.successSubtitle', 'Share this public booking link with your clients:')}
          </p>
          <a href={subdomainUrl} target="_blank" rel="noopener noreferrer"
             style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px',
                      background: 'var(--bs-tertiary-bg, #f5f5f7)', borderRadius: 10, fontSize: 16,
                      fontWeight: 600, color: 'var(--color-primary, #007aff)', textDecoration: 'none',
                      marginBottom: 24, wordBreak: 'break-all' }}>
            <ExternalLink size={16} /> {subdomainUrl.replace('https://', '')}
          </a>
          <div>
            <button onClick={() => navigate('/dashboard')}
              style={{ padding: '12px 24px', background: 'var(--color-text)', color: '#fff',
                       border: 'none', borderRadius: 12, fontSize: 16, cursor: 'pointer',
                       display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {t('register.goToDashboard', 'Go to my dashboard')} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: 16 }}>
      <div style={{ width: 760, maxWidth: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <LanguageSwitcher />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Building2 size={32} />
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '8px 0 4px' }}>
            {t('register.title', 'Register your business')}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            {t('register.subtitle', 'Get a mobile-friendly booking page in minutes.')}
          </p>
        </div>

        {error && <div className="alert alert-danger" style={{ fontSize: 14 }}>{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{t('register.businessType', 'Type of business')} *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
              {businessTypes.map((bt) => {
                const active = selectedTypeCode === bt.code;
                return (
                  <label key={bt.id} style={{
                    cursor: 'pointer', padding: 10, border: '1px solid var(--color-border, #e5e7eb)',
                    borderRadius: 10, textAlign: 'center',
                    background: active ? 'var(--color-primary, #2563eb)' : 'transparent',
                    color: active ? '#fff' : 'inherit', fontSize: 13, fontWeight: 500,
                  }}>
                    <input type="radio" value={bt.code} {...register('businessTypeCode', { required: true })} style={{ display: 'none' }} />
                    {bt.name}
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{t('register.organisationName', 'Business name')} *</label>
            <input className={`form-control ${errors.organisationName ? 'is-invalid' : ''}`} style={inputStyle}
                   {...register('organisationName', { required: true })} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Palette size={14} /> {t('register.designTemplate', 'Choose a design for your booking site')} *
            </label>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 10px' }}>
              {t('register.designTemplateHint', 'Instantly applied to your public booking page. You can change it any time.')}
            </p>
            <input type="hidden" {...register('designTemplateCode', { required: true })} />
            <TemplatePicker
              value={selectedTemplate}
              onChange={(code) => setValue('designTemplateCode', code, { shouldValidate: true })}
              compact
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('register.firstName')} *</label>
              <input className={`form-control ${errors.firstName ? 'is-invalid' : ''}`} style={inputStyle}
                     {...register('firstName', { required: true })} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('register.lastName')} *</label>
              <input className={`form-control ${errors.lastName ? 'is-invalid' : ''}`} style={inputStyle}
                     {...register('lastName', { required: true })} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('register.email')}</label>
              <input type="email" className="form-control" style={inputStyle} {...register('email')} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('register.phone', 'Phone')}</label>
              <input type="tel" className="form-control" style={inputStyle} {...register('phone')} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('register.login')} *</label>
              <input className={`form-control ${errors.login ? 'is-invalid' : ''}`} style={inputStyle}
                     {...register('login', { required: true })} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('register.password')} *</label>
              <input type="password" className={`form-control ${errors.password ? 'is-invalid' : ''}`} style={inputStyle}
                     {...register('password', { required: true, minLength: 6 })} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>{t('register.timezone', 'Timezone')}</label>
              <input className="form-control" style={inputStyle} {...register('timezone')} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('register.currency', 'Currency')}</label>
              <input className="form-control" style={inputStyle} {...register('currency')} />
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px 0', background: 'var(--color-text)', color: '#fff',
                     border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 500,
                     cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
            {loading ? t('register.submitting', 'Creating…') : t('register.submit', 'Create business')}
          </button>
        </form>

        <p style={{ marginTop: 24, fontSize: 14, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
          {t('register.haveAccount')}{' '}
          <Link to="/login">{t('register.signIn')}</Link>
        </p>
      </div>
    </div>
  );
}
