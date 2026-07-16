import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { X, ShieldAlert, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export type ToastType = 'success' | 'error' | 'tier_limit';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const navigate = useNavigate();

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove standard toasts after 5 seconds
    if (type !== 'tier_limit') {
      setTimeout(() => {
        removeToast(id);
      }, 5000);
    }
  }, [removeToast]);

  // Global event listener to intercept tier limit custom events from API calls
  useEffect(() => {
    const handleApiToast = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string; type: ToastType }>;
      if (customEvent.detail) {
        showToast(customEvent.detail.message, customEvent.detail.type);
      }
    };

    window.addEventListener('api-toast-error', handleApiToast);
    return () => {
      window.removeEventListener('api-toast-error', handleApiToast);
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      
      {/* Toast container floating on screen */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full px-4 sm:px-0">
        {toasts.map((toast) => {
          const isTier = toast.type === 'tier_limit';
          return (
            <div
              key={toast.id}
              className={`animate-slide-in flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg transition-all duration-300 ${
                isTier
                  ? 'bg-amber-50/90 border-amber-200 text-amber-900 ring-2 ring-amber-500/20'
                  : toast.type === 'success'
                  ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50/90 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {isTier ? (
                  <ShieldAlert className="h-5 w-5 text-amber-600 animate-pulse" />
                ) : toast.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-rose-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-1">
                  {isTier ? 'Plan Limit Reached' : toast.type === 'success' ? 'Success' : 'Error'}
                </p>
                <p className="text-xs opacity-90 leading-relaxed">{toast.message}</p>
                
                {isTier && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigate('/billing');
                        removeToast(toast.id);
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 active:scale-95 transition-all shadow-sm shadow-amber-600/10"
                    >
                      <Sparkles className="h-3 w-3" />
                      Upgrade Plan
                    </button>
                    <button
                      onClick={() => removeToast(toast.id)}
                      className="px-2 py-1 bg-transparent hover:bg-amber-100 rounded-lg text-xs font-medium text-amber-700 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
              {!isTier && (
                <button
                  onClick={() => removeToast(toast.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
