import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';

interface ClientRow {
  id: number;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateCreated: string;
}

export default function ClientsPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // The generic admin endpoint handles pagination + search for any [Bo] entity.
    api.get('/admin/entities/Client', { params: { page: 1, pageSize: 50, search } })
      .then((r) => setRows(r.data.items ?? []))
      .catch(() => setRows([]));
  }, [search]);

  return (
    <div>
      <h1 style={{ marginBottom: 16 }}>{t('clients.title', 'Clients')}</h1>
      <div className="sched-toolbar">
        <input placeholder={t('clients.search', 'Search clients…')} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="sched-row header">
        <div>{t('clients.name', 'Name')}</div>
        <div>{t('clients.email', 'Email')}</div>
        <div>{t('clients.phone', 'Phone')}</div>
        <div>{t('clients.added', 'Added')}</div>
        <div></div>
        <div></div>
      </div>

      {rows.map((c) => (
        <div key={c.id} className="sched-row">
          <div>{c.firstName} {c.lastName ?? ''}</div>
          <div>{c.email ?? '—'}</div>
          <div>{c.phone ?? '—'}</div>
          <div>{new Date(c.dateCreated).toLocaleDateString()}</div>
          <div></div>
          <div></div>
        </div>
      ))}
      {rows.length === 0 && (
        <div style={{ padding: 48, textAlign: 'center', opacity: .6 }}>{t('clients.empty', 'No clients yet')}</div>
      )}
    </div>
  );
}
