import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, CalendarClock, TrendingUp, Users, Scissors, Store } from 'lucide-react';
import { internalApi } from '../../api/appointmentsApi';
import type { DashboardMetricsDto } from '../../types';

export default function InternalDashboardPage() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<DashboardMetricsDto | null>(null);

  useEffect(() => {
    internalApi.getDashboard().then(setMetrics).catch(() => setMetrics(null));
  }, []);

  const cards = [
    { icon: <CalendarDays  size={20} />, label: t('dash.today',        "Today's bookings"), value: metrics?.todayCount ?? '—' },
    { icon: <CalendarClock size={20} />, label: t('dash.upcoming',     'Upcoming'),         value: metrics?.upcomingCount ?? '—' },
    { icon: <TrendingUp    size={20} />, label: t('dash.monthRevenue', 'Month revenue'),    value: metrics?.monthRevenue != null ? metrics.monthRevenue.toFixed(2) : '—' },
    { icon: <Scissors      size={20} />, label: t('dash.staff',        'Staff'),            value: metrics?.staffCount ?? '—' },
    { icon: <Store         size={20} />, label: t('dash.services',     'Active services'),  value: metrics?.serviceCount ?? '—' },
    { icon: <Users         size={20} />, label: t('dash.clients',      'Clients'),          value: metrics?.clientCount ?? '—' },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>{t('dash.title', 'Dashboard')}</h1>
      <div className="dash-grid">
        {cards.map((c) => (
          <div key={c.label} className="dash-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="dash-card__label">{c.label}</span>
              <span style={{ opacity: .7 }}>{c.icon}</span>
            </div>
            <div className="dash-card__value">{String(c.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
