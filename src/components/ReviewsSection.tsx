import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { reviewsApi, type ReviewDto } from '../api/featuresApi';
import { useTenantTheme } from '../theme/ThemeProvider';

interface Props {
  slug?: string;
  take?: number;
  /** Optional override — if present, shown instead of a locally-computed average of `take` items. */
  averageRating?: number;
  totalCount?: number;
}

export default function ReviewsSection({ slug, take = 12, averageRating, totalCount }: Props) {
  const { t } = useTranslation();
  const { theme } = useTenantTheme();
  const [reviews, setReviews] = useState<ReviewDto[]>([]);

  useEffect(() => {
    reviewsApi.getPublic(slug, take).then(setReviews).catch(() => setReviews([]));
  }, [slug, take]);

  if (reviews.length === 0) return null;

  // Prefer the server-side aggregate (accurate across all reviews) over a sample mean.
  const tenantAvg = theme?.averageRating ?? averageRating;
  const tenantCount = theme?.reviewCount ?? totalCount;
  const avg = tenantAvg ?? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const count = tenantCount ?? reviews.length;

  return (
    <section style={{ margin: '32px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, margin: 0 }}>{t('reviews.title', 'What clients say')}</h2>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontWeight: 600 }}>
          <Star size={16} fill="#f59e0b" /> {Number(avg).toFixed(1)}
          <span style={{ color: 'var(--tenant-text-muted, #64748b)', fontWeight: 400 }}>({count})</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {reviews.map((r) => (
          <div key={r.id} style={{
            border: '1px solid var(--tenant-border, #e5e7eb)',
            borderRadius: 12, padding: 16, background: 'var(--tenant-surface, #fff)',
          }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={14} fill={i <= r.rating ? '#f59e0b' : 'none'} color={i <= r.rating ? '#f59e0b' : '#d1d5db'} />
              ))}
            </div>
            {r.comment && <p style={{ marginBottom: 8, fontSize: 14 }}>{r.comment}</p>}
            <div style={{ fontSize: 12, color: 'var(--tenant-text-muted, #64748b)' }}>
              {r.clientName ?? t('reviews.anonymous', 'Anonymous')}
              {r.serviceName && ` · ${r.serviceName}`}
              {r.staffName && ` · ${r.staffName}`}
            </div>
            {r.responseText && (
              <div style={{ marginTop: 10, padding: 10, background: 'var(--tenant-surface-alt, #f3f4f6)', borderRadius: 8, fontSize: 13 }}>
                <strong>{t('reviews.reply', 'Reply')}:</strong> {r.responseText}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
