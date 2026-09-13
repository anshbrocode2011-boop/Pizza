import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Order } from '../types';

export interface Toast {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

interface NotificationContextType {
  toasts: Toast[];
  showToast: (title: string, message: string, type?: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
  lastOrderUpdate: { order: Order; message: string } | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastOrderUpdate, setLastOrderUpdate] = useState<{ order: Order; message: string } | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, message: string, type: Toast['type'] = 'info', duration: number = 5000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      setToasts(prev => [...prev, { id, title, message, type, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  // Connect to SSE for real-time order updates
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    function connectSSE() {
      try {
        eventSource = new EventSource('/api/orders/stream');

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'ORDER_UPDATED' || data.type === 'ORDER_CREATED') {
              setLastOrderUpdate({ order: data.order, message: data.message });
              showToast(
                data.type === 'ORDER_UPDATED' ? 'Order Status Updated' : 'New Order Activity',
                data.message,
                'success',
                6000
              );
            }
          } catch {
            // ignore malformed
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Reconnect after 8s
          reconnectTimeout = setTimeout(connectSSE, 8000);
        };
      } catch (err) {
        console.warn('Could not connect to order stream:', err);
      }
    }

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [user?.id, showToast]);

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        showToast,
        removeToast,
        lastOrderUpdate,
      }}
    >
      {children}

      {/* Floating Toast Notification Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4">
        {toasts.map(toast => (
          <div
            key={toast.id}
            id={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all transform duration-300 animate-in fade-in slide-in-from-top-4 ${
              toast.type === 'success'
                ? 'bg-stone-900/95 text-white border-red-500/40'
                : toast.type === 'error'
                ? 'bg-red-900/95 text-white border-red-400'
                : 'bg-stone-900/95 text-white border-stone-700'
            }`}
          >
            <div className="text-xl">
              {toast.type === 'success' ? '🍕' : toast.type === 'error' ? '⚠️' : '🔔'}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold tracking-tight text-amber-300">{toast.title}</h4>
              <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-stone-400 hover:text-white text-xs p-1 rounded transition-colors"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
