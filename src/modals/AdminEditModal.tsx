import { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { translateApiMessage } from '../utils/apiMessage';
import { useAuthStore } from '../store/authStore';
import type { EntityMetadata, PropertyMetadata, LookupItem } from '../types/admin';

interface Props {
  entityName: string;
  metadata: EntityMetadata;
  itemId: number;
  onClose: (saved?: boolean) => void;
}

function groupProperties(properties: PropertyMetadata[]): Map<string, PropertyMetadata[]> {
  const map = new Map<string, PropertyMetadata[]>();
  properties
    .filter(p => p.visible && p.editTemplate !== 'hidden' && p.editTemplate !== 'readonly' && p.editTemplate !== 'label')
    .sort((a, b) => a.order - b.order)
    .forEach(p => {
      const group = p.displayGroup || '';
      const list = map.get(group) || [];
      list.push(p);
      map.set(group, list);
    });
  return map;
}

export default function AdminEditModal({ entityName, metadata, itemId, onClose }: Props) {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const isSuperAdmin = user?.roles?.includes('admin') || ((user?.permission ?? 0) & 2) === 2;

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [loadingItem, setLoadingItem] = useState(true);
  const [error, setError] = useState('');
  const [lookups, setLookups] = useState<Record<string, LookupItem[]>>({});

  const grouped = useMemo(() => groupProperties(metadata.properties), [metadata]);

  // Load item data
  useEffect(() => {
    setLoadingItem(true);
    adminApi.getEntityDetail(entityName, itemId).then(res => {
      const item = res.data.item || res.data;
      const data: Record<string, unknown> = {};
      for (const p of metadata.properties) {
        if (item[p.name] !== undefined) {
          data[p.name] = item[p.name];
        }
      }
      setFormData(data);
    }).catch(() => {
      setError(t('admin.recordNotFound'));
    }).finally(() => setLoadingItem(false));
  }, [entityName, itemId, metadata]);

  // Load lookups
  const loadLookups = useCallback(async () => {
    const refTypes = new Set<string>();
    for (const p of metadata.properties) {
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
  }, [metadata]);

  useEffect(() => { loadLookups(); }, [loadLookups]);

  const handleFieldChange = (name: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await adminApi.updateEntity(entityName, itemId, { item: formData });
      onClose(true);
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { message?: string } } };
      const code = axErr.response?.data?.message || 'SAVE_FAILED';
      setError(translateApiMessage(code, t) || t('admin.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  // Org display name
  const orgProp = metadata.properties.find(
    p => p.referenceType === 'Organisation' || p.name.toLowerCase() === 'organisation'
  );
  const orgValue = orgProp ? formData[orgProp.name] : null;
  const orgLookup = orgProp?.referenceType ? lookups[orgProp.referenceType] : undefined;
  const orgDisplayName = orgLookup?.find(o => o.id === orgValue)?.displayName || user?.orgName || '';

  return createPortal(
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)', zIndex: 9990 }}
         onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-dialog modal-lg" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <Pencil size={16} style={{ marginRight: 8 }} />
              {metadata.singleName || metadata.displayName} #{itemId}
            </h5>
            <button className="btn-close" onClick={() => onClose()} />
          </div>

          <div className="modal-body">
            {error && <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>}

            {loadingItem ? (
              <div className="text-center py-4 text-muted">{t('common.loading')}</div>
            ) : (
              Array.from(grouped.entries()).map(([group, props]) => (
                <div key={group}>
                  {group && (
                    <h6 style={{ fontSize: 13, fontWeight: 600, marginTop: 16, marginBottom: 8, color: '#666' }}>
                      {t(`admin.groups.${group}`, group)}
                    </h6>
                  )}
                  <div className="row g-3 mb-3">
                    {props.map(p => {
                      const isOrgField = p.referenceType === 'Organisation' || p.name.toLowerCase() === 'organisation';
                      const isReadOnly = !isSuperAdmin && isOrgField;

                      if (isOrgField && !isSuperAdmin) {
                        return (
                          <div key={p.name} className="col-6">
                            <label className="form-label">
                              {p.displayName}
                              {p.required && <span style={{ color: '#dc3545' }}> *</span>}
                            </label>
                            <input className="form-control form-control-sm" value={orgDisplayName} disabled style={{ background: '#f1f1f1' }} />
                          </div>
                        );
                      }

                      const options = p.referenceType ? lookups[p.referenceType] : undefined;

                      if ((p.editTemplate === 'select' || p.editTemplate === 'autocomplete') && options) {
                        const numVal = formData[p.name] ? Number(formData[p.name]) : '';
                        return (
                          <div key={p.name} className="col-6">
                            <label className="form-label">
                              {p.displayName}
                              {p.required && <span style={{ color: '#dc3545' }}> *</span>}
                            </label>
                            <select className="form-select form-select-sm" value={numVal} disabled={isReadOnly}
                                    onChange={e => handleFieldChange(p.name, e.target.value ? Number(e.target.value) : null)}>
                              <option value="">— Select... —</option>
                              {options.map(opt => <option key={opt.id} value={opt.id}>{opt.displayName}</option>)}
                            </select>
                          </div>
                        );
                      }

                      if (p.editTemplate === 'date') {
                        const dateVal = formData[p.name] ? String(formData[p.name]).substring(0, 10) : '';
                        return (
                          <div key={p.name} className="col-6">
                            <label className="form-label">
                              {p.displayName}
                              {p.required && <span style={{ color: '#dc3545' }}> *</span>}
                            </label>
                            <input type="date" className="form-control form-control-sm" value={dateVal}
                                   onChange={e => handleFieldChange(p.name, e.target.value)} />
                          </div>
                        );
                      }

                      if (p.editTemplate === 'textarea' || p.editTemplate === 'html') {
                        return (
                          <div key={p.name} className="col-12">
                            <label className="form-label">
                              {p.displayName}
                              {p.required && <span style={{ color: '#dc3545' }}> *</span>}
                            </label>
                            <textarea className="form-control form-control-sm" rows={3}
                                      value={formData[p.name] != null ? String(formData[p.name]) : ''}
                                      onChange={e => handleFieldChange(p.name, e.target.value)} />
                          </div>
                        );
                      }

                      if (p.editTemplate === 'checkbox') {
                        return (
                          <div key={p.name} className="col-6">
                            <div className="form-check" style={{ marginTop: 28 }}>
                              <input type="checkbox" className="form-check-input"
                                     checked={!!formData[p.name]}
                                     onChange={e => handleFieldChange(p.name, e.target.checked)} />
                              <label className="form-check-label">{p.displayName}</label>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={p.name} className="col-6">
                          <label className="form-label">
                            {p.displayName}
                            {p.required && <span style={{ color: '#dc3545' }}> *</span>}
                          </label>
                          <input className="form-control form-control-sm"
                                 value={formData[p.name] != null ? String(formData[p.name]) : ''}
                                 disabled={!p.editable}
                                 onChange={e => handleFieldChange(p.name, e.target.value)} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}

            {/* Meta info */}
            {!loadingItem && (
              <div style={{ borderTop: '1px solid #eee', paddingTop: 12, marginTop: 8 }}>
                <span style={{ fontSize: 12, color: '#999' }}>
                  ID: {itemId}
                  {formData.dateCreated ? <> · {t('admin.dateCreated')}: {new Date(String(formData.dateCreated)).toLocaleDateString()}</> : null}
                </span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-sm btn-light" onClick={() => onClose()}>
              {t('common.cancel')}
            </button>
            <button type="button" className="btn btn-sm btn-dark" disabled={saving || loadingItem} onClick={handleSave}>
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
