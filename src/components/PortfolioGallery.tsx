import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';
import { portfolioApi, type PortfolioItemDto } from '../api/featuresApi';

interface Props {
  slug?: string;
  staffId?: number;
  serviceId?: number;
  compact?: boolean;
}

/**
 * Public-facing gallery. Clients browse work samples to inspire their service choice.
 * Deep-linking to "Book with {staff}" needs a prior service selection — deferred.
 */
export default function PortfolioGallery({ slug, staffId, serviceId, compact }: Props) {
  const { t } = useTranslation();
  const [items, setItems] = useState<PortfolioItemDto[]>([]);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    portfolioApi.getPublic(slug, staffId, serviceId).then(setItems).catch(() => setItems([]));
  }, [slug, staffId, serviceId]);

  async function like(id: number) {
    if (likedIds.has(id)) return;
    const r = await portfolioApi.like(id);
    setItems((list) => list.map((x) => x.id === id ? { ...x, likeCount: r.likes } : x));
    setLikedIds(new Set(likedIds).add(id));
  }

  if (items.length === 0) return null;

  return (
    <div style={{ margin: '24px 0' }}>
      {!compact && <h2 style={{ fontSize: 18, marginBottom: 12 }}>{t('portfolio.title', 'Work samples')}</h2>}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${compact ? 140 : 180}px, 1fr))`,
        gap: 12,
      }}>
        {items.map((p) => (
          <div key={p.id} style={{
            position: 'relative',
            borderRadius: 10,
            overflow: 'hidden',
            background: 'var(--tenant-surface-alt, #f3f4f6)',
            aspectRatio: '1 / 1',
          }}>
            <img
              src={p.thumbnailUrl ?? p.imageUrl}
              alt={p.title ?? ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: 8,
              background: 'linear-gradient(transparent, rgba(0,0,0,.7))',
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: 12,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {p.title && <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>}
                {p.staffName && <div style={{ fontSize: 11, opacity: .9 }}>{p.staffName}</div>}
              </div>
              <button
                type="button"
                onClick={() => like(p.id)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                aria-label="like"
              >
                <Heart size={14} fill={likedIds.has(p.id) ? '#fff' : 'none'} />
                <span>{p.likeCount}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
