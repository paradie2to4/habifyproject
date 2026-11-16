import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const STYLES = {
  success: { Icon: CheckCircle2, chip: 'bg-tea-50 text-tea-700' },
  info: { Icon: Info, chip: 'bg-stone-100 text-ink-700' },
  warning: { Icon: AlertTriangle, chip: 'bg-saffron-50 text-saffron-700' },
  error: { Icon: AlertCircle, chip: 'bg-red-50 text-red-700' }
} as const;

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <section
      aria-label="Notifications"
      aria-live="polite"
      className="fixed top-20 right-4 left-4 sm:left-auto z-[65] flex flex-col items-stretch sm:items-end gap-2 pointer-events-none"
    >
      {toasts.map(toast => {
        const { Icon, chip } = STYLES[toast.type];
        return (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            className="animate-pop pointer-events-auto w-full sm:w-[360px] flex items-start gap-3 p-3 pr-2 rounded-2xl bg-white border border-stone-200"
            style={{ boxShadow: 'var(--shadow-lift)' }}
          >
            <span className={`w-8 h-8 shrink-0 rounded-xl inline-flex items-center justify-center ${chip}`}>
              <Icon className="w-[18px] h-[18px]" />
            </span>
            <p className="flex-1 pt-1.5 text-sm text-ink-800 leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="w-8 h-8 shrink-0 rounded-lg inline-flex items-center justify-center text-stone-500 hover:text-ink-900 hover:bg-stone-100 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </section>
  );
};
