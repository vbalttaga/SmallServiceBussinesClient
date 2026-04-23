import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronLeft, ChevronRight, Clock, User, Check, Calendar as CalendarIcon } from 'lucide-react';
import { publicApi } from '../../api/publicApi';
import { getSubdomainSlug } from '../../utils/tenant';
import type { ServiceDto, StaffDto, ServiceCategoryDto, TimeSlotDto, BusinessSummaryDto } from '../../types';
import './PublicBooking.css';

type Step = 'service' | 'staff' | 'time' | 'contact' | 'done';

export default function PublicBookingPage() {
  const { t } = useTranslation();
  const slug = getSubdomainSlug() ?? new URLSearchParams(window.location.search).get('org') ?? undefined;

  const [business, setBusiness] = useState<BusinessSummaryDto | null>(null);
  const [categories, setCategories] = useState<ServiceCategoryDto[]>([]);
  const [services, setServices]     = useState<ServiceDto[]>([]);
  const [staff, setStaff]           = useState<StaffDto[]>([]);
  const [slots, setSlots]           = useState<TimeSlotDto[]>([]);

  const [catFilter, setCatFilter] = useState<number | 'all'>('all');
  const [search, setSearch]       = useState('');

  const [selectedService, setSelectedService] = useState<ServiceDto | null>(null);
  const [selectedStaff, setSelectedStaff]     = useState<StaffDto | null>(null);
  const [selectedDate, setSelectedDate]       = useState<Date>(() => new Date());
  const [selectedSlot, setSelectedSlot]       = useState<TimeSlotDto | null>(null);
  const [step, setStep] = useState<Step>('service');

  const [contact, setContact] = useState({ firstName: '', lastName: '', email: '', phone: '', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationId, setConfirmationId] = useState<number | null>(null);
  const [confirmationToken, setConfirmationToken] = useState<string | null>(null);

  // ---- Initial loads ----
  useEffect(() => {
    publicApi.getBusiness(slug).then(setBusiness).catch(() => setBusiness(null));
    publicApi.getCategories(slug).then(setCategories).catch(() => {});
    publicApi.getServices(slug).then(setServices).catch(() => setServices([]));
  }, [slug]);

  // ---- Load staff when service picked ----
  useEffect(() => {
    if (!selectedService) { setStaff([]); return; }
    publicApi.getStaff(slug, selectedService.id).then(setStaff).catch(() => setStaff([]));
    setSelectedStaff(null);
    setSelectedSlot(null);
  }, [selectedService, slug]);

  // ---- Load slots when staff + date picked ----
  useEffect(() => {
    if (!selectedStaff || !selectedService) { setSlots([]); return; }
    const dateStr = selectedDate.toISOString().slice(0, 10);
    publicApi.getAvailability({ slug, staffId: selectedStaff.id, serviceId: selectedService.id, date: dateStr })
      .then(setSlots).catch(() => setSlots([]));
    setSelectedSlot(null);
  }, [selectedStaff, selectedService, selectedDate, slug]);

  // ---- Filtered services ----
  const filteredServices = useMemo(() => {
    let list = services;
    if (catFilter !== 'all') list = list.filter((s) => s.serviceCategoryId === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description ?? '').toLowerCase().includes(q) ||
        (s.categoryName ?? '').toLowerCase().includes(q));
    }
    return list;
  }, [services, catFilter, search]);

  // ---- Submit ----
  async function submit() {
    if (!selectedService || !selectedStaff || !selectedSlot) return;
    setSubmitting(true); setError(null);
    try {
      const res = await publicApi.createAppointment({
        serviceId: selectedService.id,
        staffId: selectedStaff.id,
        startDateTime: selectedSlot.startDateTime,
        firstName: contact.firstName.trim(),
        lastName: contact.lastName.trim() || undefined,
        email: contact.email.trim() || undefined,
        phone: contact.phone.trim() || undefined,
        clientNote: contact.note.trim() || undefined,
      }, slug);
      if (res.error) throw new Error(res.error);
      setConfirmationId(res.appointmentId);
      setConfirmationToken(res.confirmationToken ?? null);
      setStep('done');
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? 'BOOKING_FAILED';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!business) {
    return (
      <div className="pb-empty">
        <h1>{t('booking.unknownBusiness', 'Business not found')}</h1>
        <p>{t('booking.unknownBusinessDesc', 'Check the URL or ask the owner for the correct address.')}</p>
      </div>
    );
  }

  // ---- Steps rendering ---------------------------------------------------

  return (
    <div className="pb-shell">
      <div className="pb-header">
        <div className="pb-header__title">{business.name}</div>
        <BookingSteps step={step} />
      </div>

      {step === 'service' && (
        <div className="pb-card">
          <h2>{t('booking.pickService', 'Choose a service')}</h2>

          <div className="pb-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('booking.searchPlaceholder', 'Search services…')}
            />
          </div>

          {categories.length > 0 && (
            <div className="pb-chips">
              <button className={catFilter === 'all' ? 'pb-chip pb-chip--active' : 'pb-chip'} onClick={() => setCatFilter('all')}>
                {t('booking.all', 'All')}
              </button>
              {categories.map((c) => (
                <button key={c.id}
                  className={catFilter === c.id ? 'pb-chip pb-chip--active' : 'pb-chip'}
                  onClick={() => setCatFilter(c.id)}
                >{c.name}</button>
              ))}
            </div>
          )}

          <ul className="pb-list">
            {filteredServices.map((svc) => (
              <li key={svc.id} className="pb-item" onClick={() => { setSelectedService(svc); setStep('staff'); }}>
                {svc.imageUrl && <img className="pb-item__img" src={svc.imageUrl} alt={svc.name} />}
                <div className="pb-item__body">
                  <div className="pb-item__title">{svc.name}</div>
                  {svc.description && <div className="pb-item__desc">{svc.description}</div>}
                  <div className="pb-item__meta">
                    <span><Clock size={13}/> {svc.durationMinutes} {t('booking.min', 'min')}</span>
                    <span className="pb-item__price">
                      {svc.priceMin ? `${t('booking.from','from')} ` : ''}
                      {formatMoney(svc.priceMin ?? svc.price, svc.currency)}
                    </span>
                  </div>
                </div>
                <ChevronRight size={20} className="pb-item__arrow" />
              </li>
            ))}
            {filteredServices.length === 0 && (
              <li className="pb-empty-line">{t('booking.noServices', 'No services match the filter')}</li>
            )}
          </ul>
        </div>
      )}

      {step === 'staff' && selectedService && (
        <div className="pb-card">
          <BackBar onBack={() => setStep('service')} label={selectedService.name} />
          <h2>{t('booking.pickStaff', 'Choose a specialist')}</h2>
          <ul className="pb-list pb-list--grid">
            {staff.map((m) => (
              <li key={m.id} className="pb-staff" onClick={() => { setSelectedStaff(m); setStep('time'); }}>
                <div className="pb-staff__photo">
                  {m.photoUrl ? <img src={m.photoUrl} alt={m.displayName} /> : <User size={22}/>}
                </div>
                <div className="pb-staff__name">{m.displayName}</div>
                {m.specialization && <div className="pb-staff__spec">{m.specialization}</div>}
              </li>
            ))}
            {staff.length === 0 && (
              <li className="pb-empty-line">{t('booking.noStaff', 'No staff available for this service yet')}</li>
            )}
          </ul>
        </div>
      )}

      {step === 'time' && selectedStaff && selectedService && (
        <div className="pb-card">
          <BackBar onBack={() => setStep('staff')} label={selectedStaff.displayName} />
          <h2>{t('booking.pickTime', 'Choose a time')}</h2>
          <DatePicker date={selectedDate} onChange={setSelectedDate} />
          <div className="pb-slots">
            {slots.map((s) => {
              const t0 = new Date(s.startDateTime);
              const label = t0.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const active = selectedSlot?.startDateTime === s.startDateTime;
              return (
                <button key={s.startDateTime}
                  className={active ? 'pb-slot pb-slot--active' : 'pb-slot'}
                  onClick={() => { setSelectedSlot(s); setStep('contact'); }}
                >{label}</button>
              );
            })}
            {slots.length === 0 && (
              <div className="pb-empty-line">{t('booking.noSlots', 'No available slots for this day. Try another date.')}</div>
            )}
          </div>
        </div>
      )}

      {step === 'contact' && selectedSlot && selectedService && selectedStaff && (
        <div className="pb-card">
          <BackBar onBack={() => setStep('time')} label={new Date(selectedSlot.startDateTime).toLocaleString()} />
          <h2>{t('booking.yourDetails', 'Your details')}</h2>

          <div className="pb-summary">
            <div><b>{selectedService.name}</b> — {selectedService.durationMinutes} {t('booking.min','min')}, {formatMoney(selectedService.price, selectedService.currency)}</div>
            <div>{t('booking.with','with')} <b>{selectedStaff.displayName}</b></div>
            <div>{new Date(selectedSlot.startDateTime).toLocaleString()}</div>
          </div>

          <div className="pb-form">
            <label>{t('booking.firstName','First name')}*
              <input value={contact.firstName} onChange={(e)=>setContact({...contact,firstName:e.target.value})} required />
            </label>
            <label>{t('booking.lastName','Last name')}
              <input value={contact.lastName} onChange={(e)=>setContact({...contact,lastName:e.target.value})} />
            </label>
            <label>{t('booking.phone','Phone')}
              <input type="tel" value={contact.phone} onChange={(e)=>setContact({...contact,phone:e.target.value})} />
            </label>
            <label>{t('booking.email','Email')}
              <input type="email" value={contact.email} onChange={(e)=>setContact({...contact,email:e.target.value})} />
            </label>
            <label className="pb-form__full">{t('booking.note','Note (optional)')}
              <textarea rows={3} value={contact.note} onChange={(e)=>setContact({...contact,note:e.target.value})} />
            </label>
          </div>

          {error && <div className="pb-error">{t(`api.${error}`, error)}</div>}

          <button className="pb-primary"
            disabled={submitting || !contact.firstName || (!contact.email && !contact.phone)}
            onClick={submit}>
            {submitting ? t('booking.booking','Booking…') : t('booking.confirm','Confirm booking')}
          </button>
        </div>
      )}

      {step === 'done' && (
        <div className="pb-card pb-done">
          <div className="pb-done__icon"><Check size={32}/></div>
          <h2>{t('booking.confirmed', 'You are booked!')}</h2>
          <p>{t('booking.confirmedDesc', "We'll send a confirmation shortly.")}</p>
          {confirmationId && <p>{t('booking.id','ID')}: #{confirmationId}</p>}
          {confirmationToken && (
            <p className="pb-token">{t('booking.saveLink', 'Save this link to manage your booking')}:&nbsp;
              <code>/b/{confirmationToken}</code>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- small building blocks ----------

function BookingSteps({ step }: { step: Step }) {
  const steps: Step[] = ['service', 'staff', 'time', 'contact'];
  if (step === 'done') return null;
  const idx = steps.indexOf(step);
  return (
    <div className="pb-steps">
      {steps.map((s, i) => (
        <div key={s} className={'pb-step ' + (i <= idx ? 'pb-step--active' : '')}>
          <span>{i + 1}</span>
        </div>
      ))}
    </div>
  );
}

function BackBar({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <button className="pb-back" onClick={onBack}>
      <ChevronLeft size={18}/> {label}
    </button>
  );
}

function DatePicker({ date, onChange }: { date: Date; onChange: (d: Date) => void }) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  return (
    <div className="pb-dates">
      {days.map((d) => {
        const active = d.toDateString() === date.toDateString();
        return (
          <button key={d.toISOString()}
            className={active ? 'pb-date pb-date--active' : 'pb-date'}
            onClick={() => onChange(d)}>
            <div className="pb-date__dow">{d.toLocaleDateString([], { weekday: 'short' })}</div>
            <div className="pb-date__num">{d.getDate()}</div>
            <div className="pb-date__mon">{d.toLocaleDateString([], { month: 'short' })}</div>
          </button>
        );
      })}
    </div>
  );
}

function formatMoney(n: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n);
  } catch { return `${n} ${currency}`; }
}
