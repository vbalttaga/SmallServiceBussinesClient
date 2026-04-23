import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  title: string;
  onClose: () => void;
  onSave: () => void;
  loading?: boolean;
  children: ReactNode;
}

export default function BaseModal({ title, onClose, onSave, loading, children }: Props) {
  const { t } = useTranslation();
  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">{children}</div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>{t('common.close')}</button>
            <button className="btn btn-primary" onClick={onSave} disabled={loading}>
              {loading ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
