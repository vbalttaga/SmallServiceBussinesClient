import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { internalApi } from '../../api/appointmentsApi';
import type { AppointmentDto, StaffDto } from '../../types';

export default function SchedulePage() {
  const { t } = useTranslation();
  const [staff, setStaff] = useState<StaffDto[]>([]);
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [staffFilter, setStaffFilter] = useState<number | ''>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    internalApi.getStaff().then(setStaff).catch(() => setStaff([]));
  }, []);

  useEffect(() => {
    const from = new Date(date + 'T00:00:00').toISOString();
    const to   = new Date(date + 'T23:59:59').toISOString();
    internalApi.getSchedule(from, to, staffFilter || undefined).then(setAppointments).catch(() => setAppointments([]));
  }, [date, staffFilter]);

  const byTime = useMemo(
    () => [...appointments].sort((a, b) => a.startDateTime.localeCompare(b.startDateTime)),
    [appointments]);

  async function changeStatus(id: number, code: AppointmentDto['statusCode']) {
    await internalApi.updateStatus(id, { newStatusCode: code });
    setAppointments((list) => list.map((a) => (a.appointmentId === id || a.id === id
      ? { ...a, statusCode: code } : a)));
  }

  return (
    <div>
      <h1 style={{ marginBottom: 16 }}>{t('sched.title', 'Schedule')}</h1>

      <div className="sched-toolbar">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value ? Number(e.target.value) : '')}>
          <option value="">{t('sched.allStaff', 'All staff')}</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>{s.displayName}</option>
          ))}
        </select>
      </div>

      <div className="sched-row header">
        <div>{t('sched.time', 'Time')}</div>
        <div>{t('sched.client', 'Client')}</div>
        <div>{t('sched.service', 'Service')}</div>
        <div>{t('sched.staff', 'Staff')}</div>
        <div>{t('sched.status', 'Status')}</div>
        <div></div>
      </div>

      {byTime.length === 0 && (
        <div style={{ padding: 48, textAlign: 'center', opacity: .6 }}>
          {t('sched.empty', 'Nothing scheduled for this day')}
        </div>
      )}

      {byTime.map((a) => {
        const time = new Date(a.startDateTime);
        return (
          <div key={a.appointmentId ?? a.id} className="sched-row">
            <div>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {a.durationMinutes}m</div>
            <div>{a.clientName ?? `${a.clientFirstName ?? ''} ${a.clientLastName ?? ''}`.trim()}{a.clientPhone ? ` · ${a.clientPhone}` : ''}</div>
            <div>{a.serviceName}</div>
            <div>{a.staffName}</div>
            <div>
              <span className="sched-status" style={{ background: a.statusColor ?? '#64748b' }}>
                {a.statusName}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {a.statusCode === 'new' && <button className="btn btn-sm btn-success" onClick={() => changeStatus(a.appointmentId ?? a.id, 'confirmed')}>{t('sched.confirm', 'Confirm')}</button>}
              {(a.statusCode === 'new' || a.statusCode === 'confirmed') && <button className="btn btn-sm btn-primary" onClick={() => changeStatus(a.appointmentId ?? a.id, 'completed')}>{t('sched.complete', 'Complete')}</button>}
              {a.statusCode !== 'cancelled' && a.statusCode !== 'completed' && a.statusCode !== 'no_show' &&
                <button className="btn btn-sm btn-outline-danger" onClick={() => changeStatus(a.appointmentId ?? a.id, 'cancelled')}>{t('sched.cancel', 'Cancel')}</button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
