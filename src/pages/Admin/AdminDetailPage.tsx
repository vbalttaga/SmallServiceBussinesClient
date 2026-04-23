import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Save, Trash2, Plus, X } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { translateApiMessage } from '../../utils/apiMessage';
import type { EntityDetailResponse, EntityMetadata, PropertyMetadata, LookupItem } from '../../types/admin';
import FieldRenderer from '../../components/admin/FieldRenderer';

/** Group properties by displayGroup. Empty group = "General" */
function groupProperties(properties: PropertyMetadata[]): Map<string, PropertyMetadata[]> {
  const map = new Map<string, PropertyMetadata[]>();

  for (const p of properties) {
    // Skip hidden/invisible fields
    if (!p.visible && p.editTemplate !== 'hidden') continue;
    if (p.editTemplate === 'hidden') continue;

    const group = p.displayGroup || 'General';
    const list = map.get(group) || [];
    list.push(p);
    map.set(group, list);
  }

  return map;
}

function formatDateTime(v: unknown): string {
  if (v === null || v === undefined) return '—';
  const d = new Date(String(v));
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleString('ro-RO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export default function AdminDetailPage() {
  const { t } = useTranslation();
  const { entityName, id } = useParams<{ entityName: string; id: string }>();
  const isNew = id === 'new';
  const navigate = useNavigate();

  const [detail, setDetail] = useState<EntityDetailResponse | null>(null);
  const [metadata, setMetadata] = useState<EntityMetadata | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lookups, setLookups] = useState<Record<string, LookupItem[]>>({});

  // ── Load lookup data for FK reference fields ────────────────
  const loadLookups = useCallback(async (meta: EntityMetadata) => {
    const refTypes = new Set<string>();
    for (const p of meta.properties) {
      if (p.referenceType) refTypes.add(p.referenceType);
    }
    if (refTypes.size === 0) return;

    const entries: Record<string, LookupItem[]> = {};
    await Promise.all(
      [...refTypes].map(async (typeName) => {
        try {
          const res = await adminApi.getLookup(typeName);
          entries[typeName] = res.data;
        } catch {
          entries[typeName] = [];
        }
      })
    );
    setLookups(entries);
  }, []);

  // ── Load existing record ────────────────
  useEffect(() => {
    if (!entityName || !id) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (isNew) {
      // Create mode: load only metadata
      adminApi.getEntities()
        .then(res => {
          const meta = res.data.find(e => e.typeName === entityName);
          if (meta) {
            setMetadata(meta);
            setFormData({});
            loadLookups(meta);
          } else {
            setError(t('api.ENTITY_NOT_FOUND'));
          }
        })
        .catch(() => setError(t('api.ENTITY_NOT_FOUND')))
        .finally(() => setLoading(false));
    } else {
      // Edit mode: load record + metadata
      adminApi.getEntityDetail(entityName, Number(id))
        .then(res => {
          setDetail(res.data);
          setMetadata(res.data.metadata);
          setFormData({ ...res.data.item });
          loadLookups(res.data.metadata);
        })
        .catch(() => setError(t('api.ITEM_NOT_FOUND')))
        .finally(() => setLoading(false));
    }
  }, [entityName, id, isNew, loadLookups]);

  const activeMeta = metadata;

  const grouped = useMemo(
    () => activeMeta ? groupProperties(activeMeta.properties) : new Map<string, PropertyMetadata[]>(),
    [activeMeta]
  );

  const handleFieldChange = (name: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ── Save (Create or Update) ────────────────
  const handleSave = async () => {
    if (!entityName || !activeMeta) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (isNew) {
        const res = await adminApi.createEntity(entityName, { item: formData });
        const msg = res.data.message;
        setSuccess(msg ? translateApiMessage(msg, t) : t('api.CREATED_OK'));
        // Navigate to the newly created record
        navigate(`/admin/${entityName}/${res.data.id}`, { replace: true });
      } else {
        const res = await adminApi.updateEntity(entityName, Number(id), { item: formData });
        const msg = res.data.message;
        setSuccess(msg ? translateApiMessage(msg, t) : t('api.UPDATED_OK'));
      }
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(code ? translateApiMessage(code, t) : t('admin.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────
  const handleDelete = async () => {
    if (!entityName || !id || isNew) return;
    if (!window.confirm(t('admin.confirmDelete'))) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await adminApi.deleteEntity(entityName, { ids: [Number(id)] });
      navigate(`/admin/${entityName}`, { replace: true });
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(code ? translateApiMessage(code, t) : t('admin.deleteFailed'));
      setSaving(false);
    }
  };

  // ── Loading state ────────────────
  if (loading) {
    return <div className="admin-loading">{t('common.loading')}</div>;
  }

  if ((!isNew && (!detail || !activeMeta)) || (isNew && !activeMeta)) {
    return (
      <div>
        <button className="admin-back-btn" onClick={() => navigate(`/admin/${entityName}`)}>
          <ChevronLeft size={16} />
          {t('admin.backToList')}
        </button>
        <div className="admin-empty">{error || t('admin.recordNotFound')}</div>
      </div>
    );
  }

  const hasMultipleGroups = grouped.size > 1;
  const canEdit = isNew ? activeMeta!.allowCreate : activeMeta!.allowEdit;
  const canDelete = !isNew && activeMeta!.allowDelete;

  return (
    <div>
      <button className="admin-back-btn" onClick={() => navigate(`/admin/${entityName}`)}>
        <ChevronLeft size={16} />
        {t('admin.backToList')}
      </button>

      <div className="admin-page-header">
        <h1>
          {isNew
            ? `${t('admin.new')} ${activeMeta!.singleName}`
            : `${activeMeta!.singleName}: #${id}`}
        </h1>
      </div>

      {/* Alerts */}
      {error && (
        <div className="admin-alert admin-alert--error">
          {error}
          <button className="admin-alert__close" onClick={() => setError(null)}>
            <X size={14} />
          </button>
        </div>
      )}
      {success && (
        <div className="admin-alert admin-alert--success">
          {success}
          <button className="admin-alert__close" onClick={() => setSuccess(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* ID + DateCreated card (only for existing records) */}
      {!isNew && detail && (
        <div className="admin-detail-card" style={{ marginBottom: 16 }}>
          <div className="admin-detail-row">
            <span className="admin-detail-label">{t('admin.id')}</span>
            <span className="admin-detail-value">{String(detail.item.id)}</span>
          </div>
          <div className="admin-detail-row">
            <span className="admin-detail-label">{t('admin.dateCreated')}</span>
            <span className="admin-detail-value">{formatDateTime(detail.item.dateCreated)}</span>
          </div>
        </div>
      )}

      {/* Grouped fields */}
      {Array.from(grouped.entries()).map(([group, props]) => (
        <div key={group} className="admin-detail-group">
          {hasMultipleGroups && (
            <div className="admin-detail-group__title">{group}</div>
          )}
          <div className="admin-detail-card">
            {props.map(p => (
              <div key={p.name} className="admin-detail-row">
                <span className="admin-detail-label">
                  {p.displayName}
                  {p.required && <span className="label-required">*</span>}
                </span>
                <div className="admin-detail-value">
                  <FieldRenderer
                    property={p}
                    value={formData[p.name]}
                    mode="field"
                    readOnly={!canEdit || (!p.editable && !isNew)}
                    onChange={handleFieldChange}
                    options={p.referenceType ? lookups[p.referenceType] : undefined}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Action bar */}
      {(canEdit || canDelete) && (
        <div className="admin-detail-actions">
          {canEdit && (
            <button
              className="admin-btn admin-btn--primary"
              disabled={saving}
              onClick={handleSave}
            >
              {isNew ? <Plus size={14} /> : <Save size={14} />}
              {saving ? t('common.saving') : isNew ? t('admin.createNew') : t('common.save')}
            </button>
          )}
          {canDelete && (
            <div className="admin-detail-actions--right">
              <button
                className="admin-btn admin-btn--danger"
                disabled={saving}
                onClick={handleDelete}
              >
                <Trash2 size={14} />
                {t('common.delete')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
