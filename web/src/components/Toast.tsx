import { useCallback, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'info';
export type ToastItem = { id: number; kind: ToastKind; message: string };

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const sequence = useRef(0);

  const notify = useCallback((kind: ToastKind, message: string) => {
    const id = sequence.current + 1;
    sequence.current = id;
    setToasts((current) => [...current.slice(-3), { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, notify, dismiss };
}

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

export function Toasts({
  items,
  onDismiss,
}: {
  items: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="toasts" aria-live="polite">
      {items.map((toast) => {
        const Icon = ICONS[toast.kind];
        return (
          <div
            key={toast.id}
            className={`toast toast--${toast.kind}`}
            role={toast.kind === 'error' ? 'alert' : 'status'}
          >
            <span className="toast-icon">
              <Icon size={17} />
            </span>
            <p>{toast.message}</p>
            <button
              type="button"
              className="toast-close"
              onClick={() => onDismiss(toast.id)}
              aria-label="Bildirimi kapat"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
