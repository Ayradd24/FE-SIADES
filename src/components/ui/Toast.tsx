import React from 'react';
import type { Toast as ToastType } from '../../hooks/useToast';

interface ToastContainerProps {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

const toastStyles = {
  success: { bg: 'bg-green-500', icon: '✓' },
  error: { bg: 'bg-red-500', icon: '✕' },
  warning: { bg: 'bg-yellow-500', icon: '⚠' },
  info: { bg: 'bg-blue-500', icon: 'ℹ' },
};

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => {
        const style = toastStyles[toast.type];
        return (
          <div
            key={toast.id}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-lg
              animate-slide-up min-w-[280px] max-w-[360px]
              ${style.bg}
            `}
          >
            <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              {style.icon}
            </span>
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              onClick={() => onRemove(toast.id)}
              className="text-white/70 hover:text-white transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
