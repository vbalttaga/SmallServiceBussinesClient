import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, Check } from 'lucide-react';
import { reviewsApi } from '../../api/featuresApi';

/**
 * Post-appointment review landing — reachable from a link in the "thanks for visiting" email.
 * The appointment confirmation token proves the client owns the appointment (no password needed).
 */
export default function ReviewSubmitPage() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!token) return;
    setSubmitting(true); setError(null);
    try {
      await reviewsApi.submitByToken(token, rating, comment.trim() || undefined);
      setDone(true);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'SUBMIT_FAILED');
    } finally { setSubmitting(false); }
  }

  if (done) {
    return (
      <div style={{ maxWidth: 480, margin: '64px auto', padding: 24, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, margin: '0 auto 16px', borderRadius: 32, background: '#10b98122', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={32} />
        </div>
        <h1>{t('review.thanks', 'Thank you!')}</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>{t('review.thanksDesc', 'Your review has been submitted.')}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '64px auto', padding: 24 }}>
      <h1>{t('review.title', 'Leave a review')}</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>
        {t('review.intro', 'Your feedback helps others discover great service.')}
      </p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, justifyContent: 'center' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button"
            onClick={() => setRating(i)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <Star size={40} fill={i <= rating ? '#f59e0b' : 'none'} color={i <= rating ? '#f59e0b' : '#d1d5db'} />
          </button>
        ))}
      </div>

      <textarea
        rows={4}
        placeholder={t('review.commentPlaceholder', 'Tell us about your experience (optional)')}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid var(--color-border, #e5e7eb)', marginBottom: 16, fontSize: 14, background: 'transparent', color: 'inherit' }}
      />

      {error && <p style={{ color: '#dc2626', marginBottom: 12 }}>{t(`api.${error}`, error)}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        style={{ width: '100%', padding: '12px 0', background: 'var(--color-primary, #2563eb)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: submitting ? 'wait' : 'pointer' }}
      >
        {submitting ? t('review.submitting', 'Submitting...') : t('review.submit', 'Submit review')}
      </button>
    </div>
  );
}
