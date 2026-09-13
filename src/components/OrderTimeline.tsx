import React from 'react';
import { CheckCircle2, ChefHat, Bike, Home, AlertCircle } from 'lucide-react';
import { OrderStatus, OrderStatusHistory } from '../types';

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  statusHistory?: OrderStatusHistory[];
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ currentStatus, statusHistory = [] }) => {
  const steps: { status: OrderStatus; label: string; icon: any; description: string }[] = [
    {
      status: 'Order Confirmed',
      label: 'Confirmed',
      icon: CheckCircle2,
      description: 'Order received & queued',
    },
    {
      status: 'Preparing',
      label: 'Baking',
      icon: ChefHat,
      description: 'Woodfired stone oven',
    },
    {
      status: 'Out for Delivery',
      label: 'On the Way',
      icon: Bike,
      description: 'Heated insulated pouch',
    },
    {
      status: 'Delivered',
      label: 'Delivered',
      icon: Home,
      description: 'Enjoy your hot pizza!',
    },
  ];

  if (currentStatus === 'Cancelled') {
    return (
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-800">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
        <div>
          <p className="text-xs font-bold">This order was cancelled</p>
          <p className="text-[11px] text-red-600">If you were charged online, a full refund has been initiated.</p>
        </div>
      </div>
    );
  }

  const statusOrder: OrderStatus[] = [
    'Order Confirmed',
    'Preparing',
    'Out for Delivery',
    'Delivered',
  ];

  const currentIdx = statusOrder.indexOf(currentStatus);

  return (
    <div className="py-2">
      <div className="relative flex items-center justify-between">
        {/* Continuous background track line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-stone-200 rounded-full z-0" />

        {/* Animated active progress bar */}
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-red-600 to-amber-500 rounded-full z-0 transition-all duration-700"
          style={{
            width: `calc(${Math.min(100, (Math.max(0, currentIdx) / (steps.length - 1)) * 100)}% - 12px)`,
          }}
        />

        {/* Steps */}
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <div key={step.status} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                  isCurrent
                    ? 'bg-red-700 text-white ring-4 ring-red-200 scale-110 animate-pulse'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-stone-400 border-2 border-stone-200'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              <div className="text-center mt-2">
                <p
                  className={`text-[11px] sm:text-xs font-bold ${
                    isCurrent
                      ? 'text-red-700'
                      : isDone
                      ? 'text-stone-900'
                      : 'text-stone-400'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[10px] text-stone-400 hidden sm:block max-w-[80px]">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Latest note from history */}
      {statusHistory.length > 0 && (
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
          <span>Latest status note:</span>
          <span className="font-semibold text-stone-700">
            {statusHistory[statusHistory.length - 1]?.note || currentStatus}
          </span>
        </div>
      )}
    </div>
  );
};
