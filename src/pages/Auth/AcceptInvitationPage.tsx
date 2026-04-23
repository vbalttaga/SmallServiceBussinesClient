import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';

interface InvitationInfo {
  email: string;
  organisationName: string;
  organisationSlug: string;
  roleCode: string;
}

export default function AcceptInvitationPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);

  const token = searchParams.get('token') ?? '';

  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'invalid' | 'accepted'>('loading');
  const [error, setError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }

    api.get(`/auth/invitation/${token}`)
      .then(res => {
        setInfo(res.data);
        setStatus('ready');
      })
      .catch(err => {
        const msg = err.response?.data?.message ?? '';
        if (msg === 'INVITATION_ALREADY_ACCEPTED') setStatus('accepted');
        else setStatus('invalid');
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !loginValue.trim() || password.length < 4) return;

    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/auth/accept-invitation', {
        token,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        login: loginValue.trim(),
        password,
      });
      login(res.data.accessToken, res.data.refreshToken, res.data.user);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message ?? '';
      if (msg === 'INVITATION_INVALID') setError(t('invite.errorInvalid'));
      else if (msg === 'LOGIN_TAKEN') setError(t('invite.errorLoginTaken'));
      else setError(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-secondary" />
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        <div className="text-center">
          <h4 className="mb-2">{t('invite.invalidTitle')}</h4>
          <p className="text-muted">{t('invite.invalidDesc')}</p>
          <a href="/login" className="btn btn-dark btn-sm">{t('nav.login')}</a>
        </div>
      </div>
    );
  }

  if (status === 'accepted') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        <div className="text-center">
          <h4 className="mb-2">{t('invite.alreadyAcceptedTitle')}</h4>
          <p className="text-muted">{t('invite.alreadyAcceptedDesc')}</p>
          <a href="/login" className="btn btn-dark btn-sm">{t('nav.login')}</a>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <div className="card shadow-sm" style={{ width: '100%', maxWidth: 440, borderRadius: 12 }}>
        <div className="card-body p-4">
          <h4 className="mb-1 fw-bold">{t('invite.title')}</h4>
          <p className="text-muted mb-4" style={{ fontSize: 14 }}>
            {t('invite.subtitle', { org: info?.organisationName })}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: 13 }}>Email</label>
              <input className="form-control form-control-sm" value={info?.email ?? ''} disabled
                     style={{ background: '#f1f1f1' }} />
            </div>
            <div className="row g-3 mb-3">
              <div className="col-6">
                <label className="form-label" style={{ fontSize: 13 }}>{t('orgUsers.firstName')} *</label>
                <input className="form-control form-control-sm" value={firstName}
                       onChange={e => setFirstName(e.target.value)} required />
              </div>
              <div className="col-6">
                <label className="form-label" style={{ fontSize: 13 }}>{t('orgUsers.lastName')} *</label>
                <input className="form-control form-control-sm" value={lastName}
                       onChange={e => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: 13 }}>{t('orgUsers.login')} *</label>
              <input className="form-control form-control-sm" value={loginValue}
                     onChange={e => setLoginValue(e.target.value)} required autoComplete="username" />
            </div>
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: 13 }}>{t('login.password')} *</label>
              <input type="password" className="form-control form-control-sm" value={password}
                     onChange={e => setPassword(e.target.value)} required minLength={4}
                     autoComplete="new-password" />
            </div>

            {error && (
              <div className="alert alert-danger py-2" style={{ fontSize: 13 }}>{error}</div>
            )}

            <button type="submit" className="btn btn-dark w-100" disabled={submitting}>
              {submitting ? t('common.loading') : t('invite.acceptBtn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
