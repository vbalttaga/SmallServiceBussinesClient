import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, TrendingUp } from 'lucide-react';
import { loyaltyApi, type LoyaltyAccountDto, type LoyaltyTransactionDto } from '../api/featuresApi';

/** Compact loyalty summary for the client's "My appointments" page. */
export default function LoyaltyWidget() {
  const { t } = useTranslation();
  const [account, setAccount] = useState<LoyaltyAccountDto | null>(null);
  const [history, setHistory] = useState<LoyaltyTransactionDto[]>([]);

  useEffect(() => {
    loyaltyApi.getMyAccount()
      .then((r) => { setAccount(r.account ?? null); setHistory(r.transactions ?? []); })
      .catch(() => setAccount(null));
  }, []);

  if (!account) return null;

  return (
    <div style={{
      border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 12, padding: 16,
      marginBottom: 20, background: 'var(--color-surface, #fff)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Award size={20} color="#f59e0b" />
          <strong>{t('loyalty.title', 'Loyalty')}</strong>
          {account.tierCode && <span style={{ fontSize: 12, padding: '2px 8px', background: 'var(--color-surface-alt, #f3f4f6)', borderRadius: 999 }}>{account.tierCode}</span>}
        </div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>{account.points} <span style={{ fontSize: 13, fontWeight: 400 }}>{t('loyalty.points', 'pts')}</span></div>
      </div>

      {history.length > 0 && (
        <details style={{ fontSize: 13 }}>
          <summary style={{ cursor: 'pointer', color: 'var(--color-text-secondary, #6b7280)' }}>
            <TrendingUp size={12} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
            {t('loyalty.history', 'Recent activity')}
          </summary>
          <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
            {history.slice(0, 8).map((tx) => (
              <li key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>{tx.reason ?? tx.type}</span>
                <span style={{ color: tx.points >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                  {tx.points >= 0 ? '+' : ''}{tx.points}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
