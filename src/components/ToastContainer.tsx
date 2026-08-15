import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <aside aria-label="Notifications" className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3">
      {toasts.map(toast => {
        let border = 'border-cream-300';
        let Icon = Info;
        let iconColor = 'text-navy-300';

        if (toast.type === 'success') {
          border = 'border-sage-600/40';
          Icon = CheckCircle2;
          iconColor = 'text-sage-400';
        } else if (toast.type === 'warning') {
          border = 'border-terra-500/40';
          Icon = AlertTriangle;
          iconColor = 'text-terra-400';
        } else if (toast.type === 'error') {
          border = 'border-terra-700/50';
          Icon = AlertCircle;
          iconColor = 'text-terra-400';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-lg border bg-navy-950 text-white shadow-lg ${border}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 text-sm font-medium leading-snug">{toast.message}</div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-cream-500 hover:text-white p-0.5 rounded transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </aside>
  );
};
