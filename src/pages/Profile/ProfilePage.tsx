import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { translateApiMessage } from '../../utils/apiMessage';
import type { UserInfo } from '../../types';

interface ProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  oldPassword?: string;
  newPassword?: string;
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, login, token } = useAuthStore();
  const { register, handleSubmit, reset } = useForm<ProfileForm>();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<UserInfo>('/profile').then((res) => {
      reset({
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        email: res.data.email,
      });
    });
  }, [reset]);

  const onSubmit = async (data: ProfileForm) => {
    setMessage('');
    setError('');
    try {
      const res = await api.put('/profile', data);
      if (user && token) {
        const refreshToken = localStorage.getItem('refreshToken') || '';
        login(token, refreshToken, { ...user, firstName: data.firstName, lastName: data.lastName, email: data.email });
      }
      const code = res.data?.message;
      setMessage(code ? translateApiMessage(code, t) : t('profile.updated'));
    } catch (e: any) {
      const code = e.response?.data?.message;
      setError(code ? translateApiMessage(code, t) : t('profile.updateFailed'));
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: 560 }}>
      <h4 className="mb-4">{t('profile.title')}</h4>

      {message && <div className="alert alert-success py-2">{message}</div>}
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="row mb-3">
          <div className="col">
            <label className="form-label">{t('profile.firstName')}</label>
            <input className="form-control" {...register('firstName', { required: true })} />
          </div>
          <div className="col">
            <label className="form-label">{t('profile.lastName')}</label>
            <input className="form-control" {...register('lastName', { required: true })} />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">{t('profile.email')}</label>
          <input type="email" className="form-control" {...register('email')} />
        </div>

        <hr />
        <p className="text-muted small">{t('profile.changePassword')}</p>

        <div className="mb-3">
          <label className="form-label">{t('profile.currentPassword')}</label>
          <input type="password" className="form-control" {...register('oldPassword')} />
        </div>
        <div className="mb-4">
          <label className="form-label">{t('profile.newPassword')}</label>
          <input type="password" className="form-control" {...register('newPassword')} />
        </div>

        <button type="submit" className="btn btn-primary">{t('common.save')}</button>
        <a href="/dashboard" className="btn btn-link ms-2">{t('common.cancel')}</a>
      </form>
    </div>
  );
}
