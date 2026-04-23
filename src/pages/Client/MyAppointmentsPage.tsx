import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clientApi } from '../../api/appointmentsApi';
import type { AppointmentDto } from '../../types';
import '../Internal/Internal.css';

export default function MyAppointmentsPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<AppointmentDto[]>([]);
  const [includePast, setIncludePast] = useState(false);

  useEffect(() => {
    clientApi.myAppointments(includePast).then(setRows).catch(() => setRows([]));
  }, [includePast]);

  async function cancel(id: number) {
    if (!confirm(t('myAppts.confirmCancel', 'Cancel this appointment?'))) return;
    await clientApi.cancel(id);
    setRows((list) => list.map((r) => (r.id === id || r.appointmentId === id) ? { ...r, statusCode: 'cancelled', statusName: 'Cancelled' } : r));
  }

  return (
    <div style={{ maxWidth: 860, margin: '24px auto', padding: 16 }}>
      <h1>{t('myAppts.title', 'My appointments')}</h1>
      <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center', margin: '12px 0' }}>
        <input type="checkbox" checked={includePast} onChange={(e) => setIncludePast(e.target.checked)} />
        {t('myAppts.includePast', 'Include past')}
      </label>

      {rows.map((a) => {
        const id = a.appointmentId ?? a.id;
        return (
          <div key={id} className="dash-card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{a.serviceName}</div>
                <div style={{ fontSize: 13, opacity: .7 }}>{t('myAppts.with','with')} {a.staffName}{a.branchName ? ` · ${a.branchName}` : ''}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  {new Date(a.startDateTime).toLocaleString()} · {a.durationMinutes} {t('booking.min','min')}
                </div>
              </div>
              <span className="sched-status" style={{ background: a.statusColor ?? '#64748b', alignSelf: 'start' }}>
                {a.statusName}
              </span>
            </div>
            {a.statusCode === 'new' || a.statusCode === 'confirmed' ? (
              <div style={{ marginTop: 10 }}>
                <button className="btn btn-sm btn-outline-danger" onClick={() => cancel(id)}>
                  {t('myAppts.cancel', 'Cancel')}
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
      {rows.length === 0 && <p style={{ opacity: .6 }}>{t('myAppts.empty', 'No appointments')}</p>}
    </div>
  );
}
