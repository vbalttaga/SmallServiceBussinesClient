import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Check } from 'lucide-react';
import { packagesApi, type ServicePackageDto } from '../api/featuresApi';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/toastStore';

interface Props {
  slug?: string;
}

/** Public "buy a package" block on the booking page. */
export default function PackagesSection({ slug }: Props) {
  const { t } = useTranslation();
  const authenticated = useAuthStore((s) => s.isAuthenticated());
  const [packages, setPackages] = useState<ServicePackageDto[]>([]);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    packagesApi.getPublic(slug).then(setPackages).catch(() => setPackages([]));
  }, [slug]);

  async function purchase(id: number) {
    if (!authenticated) {
      toast.info(t('packages.loginRequired', 'Please sign in to purchase a package.'));
      return;
    }
    setBusy(id);
    try {
      await packagesApi.purchase(id);
      toast.success(t('packages.purchased', 'Package added to your account.'));
    } catch {
      toast.error(t('packages.purchaseFailed', 'Could not purchase this package.'));
    } finally { setBusy(null); }
  }

  if (packages.length === 0) return null;

  return (
    <section style={{ margin: '32px 0' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 20, marginBottom: 16 }}>
        <Package size={20} /> {t('packages.title', 'Bundles & packages')}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {packages.map((p) => (
          <div key={p.id} style={{
            border: '1px solid var(--tenant-border, #e5e7eb)', borderRadius: 12, padding: 16,
            background: 'var(--tenant-surface, #fff)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{p.name}</div>
            {p.description && <p style={{ fontSize: 13, color: 'var(--tenant-text-muted, #64748b)', margin: '6px 0 12px' }}>{p.description}</p>}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Check size={14} color="#10b981" />
                {t('packages.sessions', '{{n}} sessions included', { n: p.sessionCount })}
              </li>
              {p.validityDays && (
                <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Check size={14} color="#10b981" />
                  {t('packages.validity', 'Valid for {{d}} days', { d: p.validityDays })}
                </li>
              )}
            </ul>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 14 }}>
              <span style={{ fontSize: 24, fontWeight: 700 }}>{p.totalPrice}</span>
              <span style={{ fontSize: 13 }}>{p.currency}</span>
            </div>
            <button
              type="button"
              onClick={() => purchase(p.id)}
              disabled={busy === p.id}
              style={{ marginTop: 12, background: 'var(--tenant-primary, #2563eb)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 0', cursor: busy === p.id ? 'wait' : 'pointer', fontWeight: 600 }}
            >
              {busy === p.id ? t('packages.buying', 'Processing...') : t('packages.buyNow', 'Buy package')}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
