import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Download, Search, Pencil, Copy, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { translateApiMessage } from '../../utils/apiMessage';
import type { EntityMetadata, EntityListResponse, PropertyMetadata, LookupItem } from '../../types/admin';
import FieldRenderer from '../../components/admin/FieldRenderer';
import AdminCreateModal from '../../modals/AdminCreateModal';
import AdminEditModal from '../../modals/AdminEditModal';

function getVisibleColumns(properties: PropertyMetadata[]): PropertyMetadata[] {
  return properties.filter(p => {
    if (!p.visible) return false;
    if (p.editTemplate === 'hidden') return false;
    return (p.displayMode & 0x01) !== 0;
  });
}

const PAGE_SIZES = [10, 20, 50, 100];

export default function AdminListPage() {
  const { t } = useTranslation();
  const { entityName } = useParams<{ entityName: string }>();
  const [data, setData] = useState<EntityListResponse | null>(null);
  const [metadata, setMetadata] = useState<EntityMetadata | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [, setLookups] = useState<Record<string, LookupItem[]>>({});

  // Reset on entity change
  useEffect(() => {
    setPage(1); setData(null); setMetadata(null);
    setSearch(''); setActiveSearch(''); setAlert(null);
    setEditItemId(null); setLookups({});
  }, [entityName]);

  // Fetch metadata
  useEffect(() => {
    if (!entityName) return;
    adminApi.getEntities().then(res => {
      const meta = res.data.find(e => e.typeName === entityName);
      setMetadata(meta || null);
    });
  }, [entityName]);

  // Load lookups for FK
  useEffect(() => {
    if (!metadata) return;
    const refTypes = new Set<string>();
    for (const p of metadata.properties) {
      if (p.referenceType) refTypes.add(p.referenceType);
    }
    if (refTypes.size === 0) return;
    const entries: Record<string, LookupItem[]> = {};
    Promise.all(
      [...refTypes].map(async (typeName) => {
        try {
          const res = await adminApi.getLookup(typeName);
          entries[typeName] = res.data;
        } catch { entries[typeName] = []; }
      })
    ).then(() => setLookups(entries));
  }, [metadata]);

  // Fetch data
  const fetchData = useCallback(() => {
    if (!entityName) return;
    setLoading(true);
    adminApi.getEntityList(entityName, page, pageSize, activeSearch || undefined)
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [entityName, page, pageSize, activeSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateClose = (saved?: boolean) => {
    setShowCreateModal(false);
    if (saved) fetchData();
  };

  const handleEditClose = (saved?: boolean) => {
    setEditItemId(null);
    if (saved) fetchData();
  };

  const handleExport = async () => {
    if (!entityName) return;
    try {
      const res = await adminApi.exportEntity(entityName, activeSearch || undefined);
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${entityName}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch { setAlert({ type: 'error', message: t('admin.saveFailed') }); }
  };

  const handleClone = async (id: number) => {
    if (!entityName) return;
    try {
      const res = await adminApi.cloneEntity(entityName, id);
      setAlert({ type: 'success', message: translateApiMessage(res.data.message, t) });
      fetchData();
    } catch { setAlert({ type: 'error', message: t('admin.saveFailed') }); }
  };

  const handleDelete = async (id: number) => {
    if (!entityName) return;
    if (!confirm(t('admin.confirmDelete'))) return;
    try {
      const res = await adminApi.deleteEntity(entityName, { ids: [id] });
      setAlert({ type: 'success', message: translateApiMessage(res.data.message, t) });
      fetchData();
    } catch { setAlert({ type: 'error', message: t('admin.deleteFailed') }); }
  };

  const totalPages = data ? Math.ceil(data.totalCount / pageSize) : 0;
  const columns = useMemo(() => metadata ? getVisibleColumns(metadata.properties) : [], [metadata]);
  const hasActions = metadata && (metadata.allowEdit || metadata.allowCopy || metadata.allowDelete);
  const colCount = columns.length + 2 + (hasActions ? 1 : 0); // +ID +dateCreated +actions

  return (
    <div>
      {/* Header — like UsersPage */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
            {metadata?.displayName || entityName}
          </h2>
          {data && (
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
              {data.totalCount} {t('admin.records')}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {metadata?.allowCreate && (
            <button className="btn btn-dark btn-sm" onClick={() => setShowCreateModal(true)}>
              <Plus size={14} style={{ marginRight: 4 }} />
              {t('admin.addNew')}
            </button>
          )}
          <button className="btn btn-outline-secondary btn-sm" onClick={handleExport}>
            <Download size={14} style={{ marginRight: 4 }} />
            {t('admin.export')}
          </button>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`alert alert-${alert.type === 'success' ? 'success' : 'danger'} alert-dismissible`} style={{ fontSize: 13 }}>
          {alert.message}
          <button type="button" className="btn-close" style={{ fontSize: 10 }} onClick={() => setAlert(null)} />
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 16, maxWidth: 340, position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: '#999' }} />
        <input
          className="form-control form-control-sm"
          style={{ paddingLeft: 34 }}
          placeholder={t('admin.searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { setPage(1); setActiveSearch(search); } }}
        />
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-hover" style={{ fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ width: 60 }}>{t('admin.id')}</th>
              {columns.map(p => (
                <th key={p.name}>{p.displayName}</th>
              ))}
              <th>{t('admin.dateCreated')}</th>
              {hasActions && <th style={{ width: 120 }}></th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={colCount} className="text-center py-4">{t('common.loading')}</td></tr>
            ) : !data || data.items.length === 0 ? (
              <tr><td colSpan={colCount} className="text-center py-4 text-muted">{t('admin.noRecords')}</td></tr>
            ) : data.items.map((item, idx) => {
              const rowId = Number(item.id ?? idx);
              return (
                <tr key={String(item.id ?? idx)}>
                  <td><code style={{ fontSize: 12 }}>{String(item.id)}</code></td>
                  {columns.map(p => {
                    const val = p.isMultiCheck
                      ? item[p.name]
                      : p.referenceType
                        ? (item[p.name + '_display'] ?? item[p.name])
                        : item[p.name];
                    return (
                      <td key={p.name} style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <FieldRenderer property={p} value={val} mode="cell" />
                      </td>
                    );
                  })}
                  <td style={{ fontSize: 12, color: '#999' }}>
                    {item.dateCreated ? new Date(String(item.dateCreated)).toLocaleDateString() : '—'}
                  </td>
                  {hasActions && (
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {metadata.allowEdit && (
                          <button className="btn btn-sm btn-outline-secondary" style={{ padding: '2px 8px' }}
                                  title={t('admin.edit')} onClick={() => setEditItemId(rowId)}>
                            <Pencil size={13} />
                          </button>
                        )}
                        {metadata.allowCopy && (
                          <button className="btn btn-sm btn-outline-secondary" style={{ padding: '2px 8px' }}
                                  title={t('admin.clone')} onClick={() => handleClone(rowId)}>
                            <Copy size={13} />
                          </button>
                        )}
                        {metadata.allowDelete && (
                          <button className="btn btn-sm btn-outline-danger" style={{ padding: '2px 8px' }}
                                  title={t('common.delete')} onClick={() => handleDelete(rowId)}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <select className="form-select form-select-sm" style={{ width: 70 }}
                    value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="text-muted">{t('admin.perPage')}</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>&laquo;</button>
            <span style={{ alignSelf: 'center', fontSize: 13, padding: '0 8px' }}>
              {t('admin.page', { page, totalPages })}
            </span>
            <button className="btn btn-sm btn-outline-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>&raquo;</button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && metadata && entityName && (
        <AdminCreateModal entityName={entityName} metadata={metadata} onClose={handleCreateClose} />
      )}

      {/* Edit Modal */}
      {editItemId !== null && metadata && entityName && (
        <AdminEditModal entityName={entityName} metadata={metadata} itemId={editItemId} onClose={handleEditClose} />
      )}
    </div>
  );
}
