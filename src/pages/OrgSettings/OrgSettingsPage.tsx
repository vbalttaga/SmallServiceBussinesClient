import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Users2, CreditCard, Save, Trash2, Plus, Star, Check, X, Upload } from 'lucide-react';
import api from '../../api/client';

import { useToastStore } from '../../store/toastStore';
import { translateApiMessage } from '../../utils/apiMessage';

/* ─── Types ─── */
interface OrgProfile {
  organisationId: number; name: string; slug: string;
  description?: string; email?: string; phone?: string;
  address?: string; logoUrl?: string; locale?: string; timezone?: string;
}
interface OrgSettings {
  workDays: string; workStartTime: string; workEndTime: string;
  defaultVacationDays: number; requireApproval: boolean; allowHalfDays: boolean;
}
interface Holiday { organisationHolidayId: number; date: string; name: string; isRecurring: boolean; }
interface Plan { planId: number; name: string; priceMonthly: number; priceYearly: number; maxUsers: number; maxStorage: number; features: string; }
interface Sub { subscriptionId: number; planId: number; planName: string; billingCycle: string; status: string; currentPeriodStart: string; currentPeriodEnd: string; priceMonthly: number; priceYearly: number; maxUsers: number; features: string; }
interface Payment { paymentId: number; amount: number; currency: string; status: string; description: string; dateCreated: string; }

type Tab = 'general' | 'members' | 'billing';

export default function OrgSettingsPage() {
  const { t } = useTranslation();
  const addToast = useToastStore(s => s.addToast);

  const [tab, setTab] = useState<Tab>('general');

  /* ─── General State ─── */
  const [profile, setProfile] = useState<OrgProfile | null>(null);
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [saving, setSaving] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '', isRecurring: false });

  /* ─── Billing State ─── */
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Sub | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [changingPlan, setChangingPlan] = useState(false);

  /* ─── Load Data ─── */
  const loadGeneral = useCallback(async () => {
    try {
      const [pRes, sRes, hRes] = await Promise.all([
        api.get('/org/profile'), api.get('/org/settings'), api.get('/org/holidays')
      ]);
      setProfile(pRes.data);
      setSettings(sRes.data);
      setHolidays(hRes.data);
    } catch { /* first time — settings may not exist */ }
  }, []);

  const loadBilling = useCallback(async () => {
    try {
      const [plRes, subRes, payRes] = await Promise.all([
        api.get('/billing/plans'), api.get('/billing/subscription'), api.get('/billing/payments')
      ]);
      setPlans(plRes.data);
      setSubscription(subRes.data);
      setPayments(payRes.data);
      if (subRes.data?.billingCycle) setBillingCycle(subRes.data.billingCycle);
    } catch { /* */ }
  }, []);

  useEffect(() => { loadGeneral(); }, [loadGeneral]);
  useEffect(() => { if (tab === 'billing') loadBilling(); }, [tab, loadBilling]);

  /* ─── Handlers ─── */
  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await api.put('/org/profile', profile);
      addToast('success', t('orgSettings.profileSaved'));
    } catch { addToast('error', t('admin.saveFailed')); }
    finally { setSaving(false); }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await api.put('/org/settings', settings);
      addToast('success', t('orgSettings.settingsSaved'));
    } catch { addToast('error', t('admin.saveFailed')); }
    finally { setSaving(false); }
  };

  const addHoliday = async () => {
    if (!newHoliday.name || !newHoliday.date) return;
    try {
      await api.post('/org/holidays', newHoliday);
      setNewHoliday({ name: '', date: '', isRecurring: false });
      loadGeneral();
      addToast('success', t('orgSettings.holidayAdded'));
    } catch { addToast('error', t('admin.saveFailed')); }
  };

  const deleteHoliday = async (id: number) => {
    try {
      await api.delete(`/org/holidays/${id}`);
      setHolidays(prev => prev.filter(h => h.organisationHolidayId !== id));
    } catch { /* */ }
  };

  const changePlan = async (planId: number) => {
    setChangingPlan(true);
    try {
      await api.put('/billing/subscription', { planId, billingCycle });
      addToast('success', t('orgSettings.planChanged'));
      await loadBilling();
    } catch (e: any) {
      const code = e.response?.data?.message;
      addToast('error', code ? translateApiMessage(code, t) : t('admin.saveFailed'));
    } finally { setChangingPlan(false); }
  };

  const cancelSub = async () => {
    if (!confirm(t('orgSettings.confirmCancel'))) return;
    try {
      await api.post('/billing/subscription/cancel');
      addToast('success', t('orgSettings.subscriptionCancelled'));
      await loadBilling();
    } catch { addToast('error', t('admin.saveFailed')); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/upload/photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile({ ...profile, logoUrl: res.data.url });
    } catch { addToast('error', 'Upload failed'); }
  };

  const parseFeatures = (f?: string): string[] => {
    if (!f) return [];
    try { return JSON.parse(f); } catch { return []; }
  };

  /* ─── TABS ─── */
  const tabs: { key: Tab; icon: React.ReactNode; label: string }[] = [
    { key: 'general', icon: <Settings size={16} />, label: t('orgSettings.tabGeneral') },
    { key: 'members', icon: <Users2 size={16} />, label: t('orgSettings.tabMembers') },
    { key: 'billing', icon: <CreditCard size={16} />, label: t('orgSettings.tabBilling') },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 20px' }}>{t('orgSettings.title')}</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #eee', marginBottom: 24 }}>
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
            background: 'none', border: 'none', borderBottom: tab === tb.key ? '2px solid #1a1a2e' : '2px solid transparent',
            fontWeight: tab === tb.key ? 600 : 400, color: tab === tb.key ? '#1a1a2e' : '#999',
            cursor: 'pointer', fontSize: 14, marginBottom: -2,
          }}>
            {tb.icon} {tb.label}
          </button>
        ))}
      </div>

      {/* ═══ GENERAL TAB ═══ */}
      {tab === 'general' && profile && (
        <div>
          {/* Org Profile */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, border: '1px solid #eee' }}>
            <h5 style={{ fontWeight: 600, marginBottom: 16 }}>{t('orgSettings.orgProfile')}</h5>
            <div className="row g-3">
              <div className="col-12">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  {profile.logoUrl ? (
                    <img src={profile.logoUrl} alt="Logo" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: 12, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                      <Upload size={24} />
                    </div>
                  )}
                  <label className="btn btn-sm btn-outline-secondary" style={{ cursor: 'pointer' }}>
                    {t('orgSettings.uploadLogo')}
                    <input type="file" accept="image/*" hidden onChange={handleLogoUpload} />
                  </label>
                </div>
              </div>
              <div className="col-6">
                <label className="form-label">{t('orgSettings.name')}</label>
                <input className="form-control form-control-sm" value={profile.name}
                  onChange={e => setProfile({ ...profile, name: e.target.value })} />
              </div>
              <div className="col-6">
                <label className="form-label">Slug</label>
                <input className="form-control form-control-sm" value={profile.slug || ''}
                  onChange={e => setProfile({ ...profile, slug: e.target.value })} />
              </div>
              <div className="col-12">
                <label className="form-label">{t('orgSettings.description')}</label>
                <textarea className="form-control form-control-sm" rows={2} value={profile.description || ''}
                  onChange={e => setProfile({ ...profile, description: e.target.value })} />
              </div>
              <div className="col-4">
                <label className="form-label">Email</label>
                <input className="form-control form-control-sm" value={profile.email || ''}
                  onChange={e => setProfile({ ...profile, email: e.target.value })} />
              </div>
              <div className="col-4">
                <label className="form-label">{t('orgSettings.phone')}</label>
                <input className="form-control form-control-sm" value={profile.phone || ''}
                  onChange={e => setProfile({ ...profile, phone: e.target.value })} />
              </div>
              <div className="col-4">
                <label className="form-label">{t('orgSettings.address')}</label>
                <input className="form-control form-control-sm" value={profile.address || ''}
                  onChange={e => setProfile({ ...profile, address: e.target.value })} />
              </div>
              <div className="col-4">
                <label className="form-label">{t('orgSettings.locale')}</label>
                <select className="form-select form-select-sm" value={profile.locale || 'en'}
                  onChange={e => setProfile({ ...profile, locale: e.target.value })}>
                  <option value="en">English</option>
                  <option value="ru">Русский</option>
                  <option value="ro">Romana</option>
                </select>
              </div>
              <div className="col-4">
                <label className="form-label">{t('orgSettings.timezone')}</label>
                <select className="form-select form-select-sm" value={profile.timezone || 'Europe/Chisinau'}
                  onChange={e => setProfile({ ...profile, timezone: e.target.value })}>
                  <option value="Europe/Chisinau">Europe/Chisinau</option>
                  <option value="Europe/Moscow">Europe/Moscow</option>
                  <option value="Europe/Bucharest">Europe/Bucharest</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div className="col-12">
                <button className="btn btn-dark btn-sm" onClick={saveProfile} disabled={saving}>
                  <Save size={14} style={{ marginRight: 4 }} />
                  {saving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </div>
          </div>

          {/* Work Settings */}
          {settings && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, border: '1px solid #eee' }}>
              <h5 style={{ fontWeight: 600, marginBottom: 16 }}>{t('orgSettings.workSettings')}</h5>
              <div className="row g-3">
                <div className="col-4">
                  <label className="form-label">{t('orgSettings.workDays')}</label>
                  <input className="form-control form-control-sm" value={settings.workDays}
                    onChange={e => setSettings({ ...settings, workDays: e.target.value })}
                    placeholder="1,2,3,4,5" />
                  <small className="text-muted">1=Mon, 7=Sun</small>
                </div>
                <div className="col-4">
                  <label className="form-label">{t('orgSettings.workStart')}</label>
                  <input type="time" className="form-control form-control-sm" value={settings.workStartTime}
                    onChange={e => setSettings({ ...settings, workStartTime: e.target.value })} />
                </div>
                <div className="col-4">
                  <label className="form-label">{t('orgSettings.workEnd')}</label>
                  <input type="time" className="form-control form-control-sm" value={settings.workEndTime}
                    onChange={e => setSettings({ ...settings, workEndTime: e.target.value })} />
                </div>
                <div className="col-4">
                  <label className="form-label">{t('orgSettings.vacationDays')}</label>
                  <input type="number" className="form-control form-control-sm" value={settings.defaultVacationDays}
                    onChange={e => setSettings({ ...settings, defaultVacationDays: Number(e.target.value) })} />
                </div>
                <div className="col-4">
                  <div className="form-check" style={{ marginTop: 28 }}>
                    <input type="checkbox" className="form-check-input" checked={settings.requireApproval}
                      onChange={e => setSettings({ ...settings, requireApproval: e.target.checked })} />
                    <label className="form-check-label">{t('orgSettings.requireApproval')}</label>
                  </div>
                </div>
                <div className="col-4">
                  <div className="form-check" style={{ marginTop: 28 }}>
                    <input type="checkbox" className="form-check-input" checked={settings.allowHalfDays}
                      onChange={e => setSettings({ ...settings, allowHalfDays: e.target.checked })} />
                    <label className="form-check-label">{t('orgSettings.allowHalfDays')}</label>
                  </div>
                </div>
                <div className="col-12">
                  <button className="btn btn-dark btn-sm" onClick={saveSettings} disabled={saving}>
                    <Save size={14} style={{ marginRight: 4 }} />
                    {saving ? t('common.saving') : t('common.save')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Holidays */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #eee' }}>
            <h5 style={{ fontWeight: 600, marginBottom: 16 }}>{t('orgSettings.holidays')}</h5>
            <div className="row g-2 mb-3">
              <div className="col-4">
                <input className="form-control form-control-sm" placeholder={t('orgSettings.holidayName')}
                  value={newHoliday.name} onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })} />
              </div>
              <div className="col-3">
                <input type="date" className="form-control form-control-sm"
                  value={newHoliday.date} onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })} />
              </div>
              <div className="col-3">
                <div className="form-check" style={{ marginTop: 6 }}>
                  <input type="checkbox" className="form-check-input" checked={newHoliday.isRecurring}
                    onChange={e => setNewHoliday({ ...newHoliday, isRecurring: e.target.checked })} />
                  <label className="form-check-label" style={{ fontSize: 13 }}>{t('orgSettings.recurring')}</label>
                </div>
              </div>
              <div className="col-2">
                <button className="btn btn-dark btn-sm w-100" onClick={addHoliday}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
            {holidays.length === 0 ? (
              <p className="text-muted" style={{ fontSize: 13 }}>{t('orgSettings.noHolidays')}</p>
            ) : (
              <table className="table table-sm" style={{ fontSize: 13 }}>
                <tbody>
                  {holidays.map(h => (
                    <tr key={h.organisationHolidayId}>
                      <td>{h.name}</td>
                      <td>{new Date(h.date).toLocaleDateString()}</td>
                      <td>{h.isRecurring ? '🔄' : ''}</td>
                      <td style={{ width: 40 }}>
                        <button className="btn btn-sm btn-outline-danger" style={{ padding: '1px 6px' }}
                          onClick={() => deleteHoliday(h.organisationHolidayId)}>
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ═══ MEMBERS TAB ═══ */}
      {tab === 'members' && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #eee', textAlign: 'center' }}>
          <Users2 size={40} style={{ color: '#ccc', marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>{t('orgSettings.membersHint')}</p>
          <a href="/admin/users" className="btn btn-dark btn-sm">
            {t('orgSettings.goToUsers')}
          </a>
        </div>
      )}

      {/* ═══ BILLING TAB ═══ */}
      {tab === 'billing' && (
        <div>
          {/* Current plan */}
          {subscription && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, border: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h5 style={{ fontWeight: 600, margin: 0 }}>
                    <Star size={16} style={{ color: '#f5a623', marginRight: 6 }} />
                    {t('orgSettings.currentPlan')}: <strong>{subscription.planName}</strong>
                  </h5>
                  <p style={{ fontSize: 13, color: '#999', margin: '4px 0 0' }}>
                    {t('orgSettings.billingCycle')}: {subscription.billingCycle === 'yearly' ? t('orgSettings.yearly') : t('orgSettings.monthly')}
                    {' · '}{t('orgSettings.status')}: <span style={{ color: subscription.status === 'active' ? '#34c759' : '#ff3b30' }}>{subscription.status}</span>
                    {' · '}{t('orgSettings.nextPayment')}: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
                {subscription.status === 'active' && subscription.planId > 1 && (
                  <button className="btn btn-outline-danger btn-sm" onClick={cancelSub}>
                    <X size={14} style={{ marginRight: 4 }} />
                    {t('orgSettings.cancelSubscription')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Billing cycle toggle */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 20 }}>
            <button className={`btn btn-sm ${billingCycle === 'monthly' ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => setBillingCycle('monthly')}>{t('orgSettings.monthly')}</button>
            <button className={`btn btn-sm ${billingCycle === 'yearly' ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => setBillingCycle('yearly')}>
              {t('orgSettings.yearly')} <span style={{ fontSize: 11, color: billingCycle === 'yearly' ? '#fff' : '#34c759' }}>-17%</span>
            </button>
          </div>

          {/* Plan cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            {plans.map(plan => {
              const isCurrent = subscription?.planId === plan.planId;
              const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
              const features = parseFeatures(plan.features);
              return (
                <div key={plan.planId} style={{
                  background: '#fff', borderRadius: 12, padding: 24, border: isCurrent ? '2px solid #1a1a2e' : '1px solid #eee',
                  position: 'relative'
                }}>
                  {isCurrent && (
                    <span style={{ position: 'absolute', top: -10, right: 16, background: '#1a1a2e', color: '#fff', fontSize: 11, padding: '2px 10px', borderRadius: 10 }}>
                      {t('orgSettings.current')}
                    </span>
                  )}
                  <h5 style={{ fontWeight: 700, marginBottom: 4 }}>{plan.name}</h5>
                  <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
                    ${price.toFixed(2)}
                    <span style={{ fontSize: 13, fontWeight: 400, color: '#999' }}>
                      /{billingCycle === 'yearly' ? t('orgSettings.year') : t('orgSettings.month')}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
                    {t('orgSettings.upToUsers', { count: plan.maxUsers })} · {plan.maxStorage}MB
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', fontSize: 13 }}>
                    {features.map((f, i) => (
                      <li key={i} style={{ padding: '3px 0' }}>
                        <Check size={14} style={{ color: '#34c759', marginRight: 6 }} />{f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <button className="btn btn-sm btn-outline-secondary w-100" disabled>{t('orgSettings.currentPlanBtn')}</button>
                  ) : (
                    <button className="btn btn-sm btn-dark w-100" disabled={changingPlan} onClick={() => changePlan(plan.planId)}>
                      {changingPlan ? t('common.saving') : (plan.priceMonthly === 0 ? t('orgSettings.downgrade') : t('orgSettings.upgrade'))}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Payment history */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #eee' }}>
            <h5 style={{ fontWeight: 600, marginBottom: 16 }}>{t('orgSettings.paymentHistory')}</h5>
            {payments.length === 0 ? (
              <p className="text-muted" style={{ fontSize: 13 }}>{t('orgSettings.noPayments')}</p>
            ) : (
              <table className="table table-sm" style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>{t('orgSettings.date')}</th>
                    <th>{t('orgSettings.descriptionCol')}</th>
                    <th>{t('orgSettings.amount')}</th>
                    <th>{t('orgSettings.paymentStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.paymentId}>
                      <td>{new Date(p.dateCreated).toLocaleDateString()}</td>
                      <td>{p.description}</td>
                      <td>${p.amount.toFixed(2)} {p.currency}</td>
                      <td>
                        <span style={{ color: p.status === 'succeeded' ? '#34c759' : '#ff3b30', fontWeight: 500 }}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
