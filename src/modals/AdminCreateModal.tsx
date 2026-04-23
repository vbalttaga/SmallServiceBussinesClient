import { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../api/adminApi';
import { translateApiMessage } from '../utils/apiMessage';
import { useAuthStore } from '../store/authStore';
import type { EntityMetadata, PropertyMetadata, LookupItem } from '../types/admin';


interface Props {
  entityName: string;
  metadata: EntityMetadata;
  onClose: (saved?: boolean) => void;
}

/** Group visible, editable properties by displayGroup */
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

export default function AdminCreateModal({ entityName, metadata, onClose }: Props) {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const isSuperAdmin = user?.roles?.includes('admin') || ((user?.permission ?? 0) & 2) === 2;

  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    if (user?.organisationId) {
      const orgProp = metadata.properties.find(
        p => p.referenceType === 'Organisation' || p.name.toLowerCase() === 'organisationid' || p.name.toLowerCase() === 'organisation'
      );
      if (orgProp) {
        initial[orgProp.name] = user.organisationId;
      }
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lookups, setLookups] = useState<Record<string, LookupItem[]>>({});

  const grouped = useMemo(() => groupProperties(metadata.properties), [metadata]);

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
      await adminApi.createEntity(entityName, { item: formData });
      onClose(true);
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { message?: string } } };
      const code = axErr.response?.data?.message || 'SAVE_FAILED';
      setError(translateApiMessage(code, t) || t('admin.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  // Find the org name for display
  const orgProp = metadata.properties.find(
    p => p.referenceType === 'Organisation' || p.name.toLowerCase() === 'organisation'
  );
  const orgValue = orgProp ? formData[orgProp.name] : null;
  const orgLookup = orgProp?.referenceType ? lookups[orgProp.referenceType] : undefined;
  const orgDisplayName = orgLookup?.find(o => o.id === orgValue)?.displayName || user?.orgName || '';

  return createPortal(
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)', zIndex: 9990 }}
         onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-dialog" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {t('admin.createTitle', { entity: metadata.singleName || metadata.displayName })}
            </h5>
            <button className="btn-close" onClick={() => onClose()} />
          </div>

          <div className="modal-body">
            {error && (
              <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>
            )}

            {Array.from(grouped.entries()).map(([group, props]) => (
              <div key={group}>
                {group && (
                  <h6 style={{ fontSize: 13, fontWeight: 600, marginTop: 16, marginBottom: 8, color: '#666' }}>
                    {t(`admin.groups.${group}`, group)}
                  </h6>
                )}
                <div className="row g-3">
                  {props.map(p => {
                    const isOrgField = p.referenceType === 'Organisation' || p.name.toLowerCase() === 'organisation';
                    const isReadOnly = !isSuperAdmin && isOrgField;

                    // For org field, show as readonly text for non-super-admins
                    if (isOrgField && !isSuperAdmin) {
                      return (
                        <div key={p.name} className="col-12">
                          <label className="form-label">
                            {p.displayName}
                            {p.required && <span style={{ color: '#dc3545' }}> *</span>}
                          </label>
                          <input
                            className="form-control form-control-sm"
                            value={orgDisplayName}
                            disabled
                            style={{ background: '#f1f1f1' }}
                          />
                        </div>
                      );
                    }

                    // For select/dropdown fields with options
                    const options = p.referenceType ? lookups[p.referenceType] : undefined;
                    if ((p.editTemplate === 'select' || p.editTemplate === 'autocomplete') && options) {
                      const numVal = formData[p.name] ? Number(formData[p.name]) : '';
                      return (
                        <div key={p.name} className="col-12">
                          <label className="form-label">
                            {p.displayName}
                            {p.required && <span style={{ color: '#dc3545' }}> *</span>}
                          </label>
                          <select
                            className="form-select form-select-sm"
                            value={numVal}
                            disabled={isReadOnly}
                            onChange={e => handleFieldChange(p.name, e.target.value ? Number(e.target.value) : null)}
                          >
                            <option value="">— Select... —</option>
                            {options.map(opt => (
                              <option key={opt.id} value={opt.id}>{opt.displayName}</option>
                            ))}
                          </select>
                        </div>
                      );
                    }

                    // For simple input fields
                    return (
                      <div key={p.name} className="col-12">
                        <label className="form-label">
                          {p.displayName}
                          {p.required && <span style={{ color: '#dc3545' }}> *</span>}
                        </label>
                        <input
                          className="form-control form-control-sm"
                          value={formData[p.name] != null ? String(formData[p.name]) : ''}
                          disabled={isReadOnly}
                          onChange={e => handleFieldChange(p.name, e.target.value)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-sm btn-light" onClick={() => onClose()}>
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-dark"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? t('common.creating') : t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
