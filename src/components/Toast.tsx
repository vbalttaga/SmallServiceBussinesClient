import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToastStore, type ToastType } from '../store/toastStore';
import './Toast.css';

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} aria-hidden="true" />,
  error: <AlertCircle size={18} aria-hidden="true" />,
  warning: <AlertTriangle size={18} aria-hidden="true" />,
  info: <Info size={18} aria-hidden="true" />,
};

const roleMap: Record<ToastType, 'status' | 'alert'> = {
  success: 'status',
  error: 'alert',
  warning: 'alert',
  info: 'status',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-label="Notifications">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-item toast-item--${t.type}`}
          role={roleMap[t.type]}
          aria-atomic="true"
        >
          <span className="toast-item__icon">{iconMap[t.type]}</span>
          <span className="toast-item__message">{t.message}</span>
          <button
            className="toast-item__close"
            onClick={() => removeToast(t.id)}
            aria-label="Close notification"
            type="button"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
