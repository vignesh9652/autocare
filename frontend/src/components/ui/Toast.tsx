import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TOAST_STYLES: Record<ToastType, { icon: ReactNode; ring: string; iconColor: string }> = {
  success: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    ring: 'border-emerald-200 dark:border-emerald-500/30',
    iconColor: 'text-emerald-500',
  },
  error: {
    icon: <XCircle className="h-5 w-5" />,
    ring: 'border-red-200 dark:border-red-500/30',
    iconColor: 'text-red-500',
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5" />,
    ring: 'border-amber-200 dark:border-amber-500/30',
    iconColor: 'text-amber-500',
  },
  info: {
    icon: <Info className="h-5 w-5" />,
    ring: 'border-sky-200 dark:border-sky-500/30',
    iconColor: 'text-sky-500',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = ++idRef.current;
      setToasts((t) => [...t.slice(-4), { id, type, title, message }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (t, m) => toast('success', t, m),
      error: (t, m) => toast('error', t, m),
      info: (t, m) => toast('info', t, m),
      warning: (t, m) => toast('warning', t, m),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,22rem)] flex-col gap-2.5">
          {toasts.map((t) => {
            const style = TOAST_STYLES[t.type];
            return (
              <div
                key={t.id}
                role="status"
                className={`pointer-events-auto animate-toast-in rounded-xl border bg-white p-4 shadow-lg shadow-slate-900/5 dark:bg-slate-900 dark:shadow-card ${style.ring}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 shrink-0 ${style.iconColor}`}>{style.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.title}</p>
                    {t.message && (
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t.message}</p>
                    )}
                  </div>
                  <button
                    onClick={() => dismiss(t.id)}
                    aria-label="Dismiss notification"
                    className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a <ToastProvider>');
  return ctx;
}
