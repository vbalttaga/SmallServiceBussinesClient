import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, MapPin, Search } from 'lucide-react';
import { marketplaceApi, type MarketplaceBusinessDto } from '../../api/featuresApi';
import { businessTypesApi } from '../../api/appointmentsApi';
import { buildSubdomainUrl } from '../../utils/tenant';
import type { BusinessTypeDto } from '../../types';

export default function MarketplacePage() {
  const { t } = useTranslation();
  const [businesses, setBusinesses] = useState<MarketplaceBusinessDto[]>([]);
  const [types, setTypes] = useState<BusinessTypeDto[]>([]);
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  useEffect(() => {
    businessTypesApi.list().then(setTypes).catch(() => setTypes([]));
  }, []);

  // Guard against stale responses beating newer ones back (fast typing).
  const requestSeq = useRef(0);
  useEffect(() => {
    const mySeq = ++requestSeq.current;
    const handle = setTimeout(() => {
      marketplaceApi
        .search({ query: q || undefined, businessType: typeFilter || undefined, pageSize: 30 })
        .then((r) => { if (mySeq === requestSeq.current) setBusinesses(r); })
        .catch(() => { if (mySeq === requestSeq.current) setBusinesses([]); });
    }, 250);
    return () => clearTimeout(handle);
  }, [q, typeFilter]);

  return (
    <div style={{ maxWidth: 1100, margin: '40px auto', padding: 16 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
        {t('marketplace.title', 'Discover service businesses')}
      </h1>
      <p style={{ color: 'var(--color-text-secondary, #6b7280)', marginBottom: 24 }}>
        {t('marketplace.subtitle', 'Book barbershops, salons, clinics — all in one place.')}
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <div style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 10, padding: '10px 14px' }}>
          <Search size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('marketplace.searchPlaceholder', 'Search by name or description...')}
            style={{ border: 0, outline: 0, flex: 1, background: 'transparent', color: 'inherit' }}
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-border, #e5e7eb)', background: 'transparent', color: 'inherit' }}
        >
          <option value="">{t('marketplace.allTypes', 'All types')}</option>
          {types.map((ty) => <option key={ty.code} value={ty.code}>{ty.name}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {businesses.map((b) => (
          <a key={b.id} href={buildSubdomainUrl(b.slug)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 12, overflow: 'hidden', background: 'var(--color-surface, #fff)', transition: 'transform .15s, box-shadow .15s' }}
                 onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,.08)'}
                 onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ height: 140, background: b.bookingCoverUrl ? `center/cover url(${b.bookingCoverUrl})` : 'linear-gradient(135deg, #eef2ff, #ecfeff)' }} />
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                  {b.logoUrl && <img src={b.logoUrl} alt={b.name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />}
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{b.name}</div>
                </div>
                {b.shortTagline && <div style={{ fontSize: 13, opacity: .7, marginBottom: 8 }}>{b.shortTagline}</div>}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 12, color: 'var(--color-text-secondary, #6b7280)' }}>
                  {b.averageRating != null && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      <Star size={12} fill="#f59e0b" color="#f59e0b" /> {b.averageRating.toFixed(1)}
                      <span> ({b.reviewCount})</span>
                    </span>
                  )}
                  {b.cityTag && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}><MapPin size={12} />{b.cityTag}</span>}
                  {b.businessTypeName && <span>{b.businessTypeName}</span>}
                </div>
              </div>
            </div>
          </a>
        ))}
        {businesses.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 64, opacity: .6 }}>
            {t('marketplace.noResults', 'No businesses match this filter yet.')}
          </div>
        )}
      </div>
    </div>
  );
}
