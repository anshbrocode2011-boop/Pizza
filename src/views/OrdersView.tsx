import React, { useState, useEffect } from 'react';
import { Package, Clock, RotateCcw, XCircle, MapPin, CreditCard, ChevronDown, ChevronUp, Radio, AlertCircle } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { OrderTimeline } from '../components/OrderTimeline';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { apiRequest } from '../lib/api';

interface OrdersViewProps {
  onNavigateHome: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ onNavigateHome }) => {
  const { user, openAuthModal } = useAuth();
  const { addToCart, openCart } = useCart();
  const { showToast, lastOrderUpdate } = useNotification();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ orders: Order[] }>('/api/orders');
      if (data.orders) {
        setOrders(data.orders);
        // Expand the most recent active order by default
        const firstActive = data.orders.find(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled');
        if (firstActive && !expandedOrderId) {
          setExpandedOrderId(firstActive.id);
        }
      }
    } catch {
      // User might be guest or offline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user?.id]);

  // When a real-time SSE event is received, update matching order in state
  useEffect(() => {
    if (lastOrderUpdate) {
      setOrders(prev => {
        const index = prev.findIndex(o => o.id === lastOrderUpdate.order.id);
        if (index > -1) {
          const next = [...prev];
          next[index] = lastOrderUpdate.order;
          return next;
        } else {
          return [lastOrderUpdate.order, ...prev];
        }
      });
    }
  }, [lastOrderUpdate]);

  const activeOrders = orders.filter(
    o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled'
  );
  const pastOrders = orders.filter(
    o => o.orderStatus === 'Delivered' || o.orderStatus === 'Cancelled'
  );

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId);
    try {
      const res = await apiRequest<{ message: string; order: Order }>(`/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
      });
      showToast('Order Cancelled', res.message, 'info');
      setOrders(prev => prev.map(o => (o.id === orderId ? res.order : o)));
    } catch (err: any) {
      showToast('Cancellation Failed', err.message || 'Could not cancel order', 'error');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleReorder = async (order: Order) => {
    for (const item of order.items) {
      await addToCart(item.pizzaId, item.size, item.quantity);
    }
    showToast('Reorder Added', 'Items from your previous order added to cart!', 'success');
    openCart();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold mb-2">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Real-Time Order Tracking Active</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">Your Pizza Orders</h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-1">
            Track stone-oven baking progress and delivery in real-time.
          </p>
        </div>

        {/* Tab switcher: Active vs History */}
        <div className="flex items-center bg-stone-100 p-1.5 rounded-2xl border border-stone-200 self-start sm:self-center">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'active'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>Active Orders</span>
            {activeOrders.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-700 text-white text-[10px] font-black flex items-center justify-center">
                {activeOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>Past Orders</span>
            <span className="text-[11px] text-stone-400">({pastOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Guest Notice if not logged in */}
      {!user && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900">You are browsing as a guest</p>
              <p className="text-[11px] text-amber-800">
                Sign in to link orders to your profile, save delivery addresses, and enjoy rapid re-ordering.
              </p>
            </div>
          </div>
          <button
            onClick={() => openAuthModal('login')}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors shadow-sm"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Orders Content */}
      {loading ? (
        <div className="space-y-4 py-8">
          {[1, 2].map(i => (
            <div key={i} className="h-44 rounded-2xl bg-stone-100 animate-pulse" />
          ))}
        </div>
      ) : (activeTab === 'active' ? activeOrders : pastOrders).length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto text-3xl">
            📦
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-stone-800">
              {activeTab === 'active' ? 'No active orders currently baking' : 'No previous orders found'}
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              {activeTab === 'active'
                ? 'Hungry? Place an order now and watch Chef Mario bake your pizza in real time!'
                : 'Your delivered and archived orders will appear here.'}
            </p>
          </div>
          <button
            onClick={onNavigateHome}
            className="px-6 py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-md transition-colors"
          >
            Order a Fresh Pizza
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {(activeTab === 'active' ? activeOrders : pastOrders).map(order => {
            const isExpanded = expandedOrderId === order.id;
            const canCancel = order.orderStatus === 'Order Confirmed';

            return (
              <div
                key={order.id}
                id={`order-card-${order.id}`}
                className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden transition-all duration-300 hover:border-stone-300"
              >
                {/* Order Summary Bar */}
                <div className="p-5 sm:p-6 bg-stone-50/80 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-black bg-stone-900 text-white px-2.5 py-1 rounded-lg">
                        #{order.id}
                      </span>

                      {/* Status Pill */}
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                          order.orderStatus === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : order.orderStatus === 'Cancelled'
                            ? 'bg-stone-200 text-stone-600'
                            : order.orderStatus === 'Preparing'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : order.orderStatus === 'Out for Delivery'
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                      >
                        {order.orderStatus}
                      </span>

                      <span className="text-xs text-stone-400">
                        {new Date(order.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 mt-2">
                      {order.items.map(i => `${i.quantity}x ${i.pizzaName} (${i.size})`).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Total</span>
                      <span className="text-lg font-black text-stone-900">${(typeof order?.total === 'number' ? order.total : 0).toFixed(2)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 transition-colors"
                      aria-label="Toggle order details"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Animated Timeline for Active Orders or Delivered Orders */}
                <div className="p-5 sm:p-6 bg-white border-b border-stone-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-4">
                    Live Progress Status
                  </h4>
                  <OrderTimeline
                    currentStatus={order.orderStatus}
                    statusHistory={order.statusHistory}
                  />
                </div>

                {/* Expanded Details View */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 bg-stone-50/50 space-y-5 animate-in fade-in duration-200">
                    {/* Items Breakdown */}
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                        Ordered Items
                      </h5>
                      <div className="space-y-2.5 divide-y divide-stone-100">
                        {order.items.map((item, idx) => {
                          const itemSub = typeof item.subtotal === 'number'
                            ? item.subtotal
                            : (item.unitPrice || 0) * (item.quantity || 1);
                          return (
                            <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.pizzaImage}
                                  alt={item.pizzaName}
                                  className="w-10 h-10 rounded-lg object-cover border border-stone-200"
                                />
                                <div>
                                  <p className="font-bold text-stone-900">{item.pizzaName}</p>
                                  <p className="text-[11px] text-stone-500">{item.size} • {item.quantity} unit{item.quantity > 1 ? 's' : ''}</p>
                                </div>
                              </div>
                              <span className="font-bold text-stone-800">${itemSub.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Delivery & Payment Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-stone-200/80 text-xs">
                      <div>
                        <span className="font-bold text-stone-700 flex items-center gap-1 mb-1">
                          <MapPin className="w-3.5 h-3.5 text-red-600" />
                          Delivery Address
                        </span>
                        <p className="text-stone-600">{order.deliveryAddress.fullName}</p>
                        <p className="text-stone-600">{order.deliveryAddress.street}</p>
                        <p className="text-stone-500 text-[11px]">{order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}</p>
                        {order.deliveryAddress.instructions && (
                          <p className="text-[11px] text-amber-800 mt-1 italic">
                            Note: {order.deliveryAddress.instructions}
                          </p>
                        )}
                      </div>

                      <div>
                        <span className="font-bold text-stone-700 flex items-center gap-1 mb-1">
                          <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                          Payment & Total
                        </span>
                        <p className="text-stone-600">
                          Method: <span className="font-semibold uppercase">{order.paymentMethod}</span> ({order.paymentStatus})
                        </p>
                        <p className="text-stone-500">Subtotal: ${(typeof order.subtotal === 'number' ? order.subtotal : 0).toFixed(2)}</p>
                        <p className="text-stone-500">Heated Delivery: ${(typeof order.deliveryFee === 'number' ? order.deliveryFee : 0).toFixed(2)}</p>
                        {typeof order.discount === 'number' && order.discount > 0 && (
                          <p className="text-emerald-600 font-bold">Discount: -${order.discount.toFixed(2)}</p>
                        )}
                        <p className="font-extrabold text-stone-900 text-sm mt-1">
                          Total: ${(typeof order.total === 'number' ? order.total : 0).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Actions: Cancel if eligible, Reorder */}
                    <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between gap-3">
                      <div>
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancellingOrderId === order.id}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-red-50 text-stone-700 hover:text-red-700 text-xs font-bold border border-stone-200 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel Order'}</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleReorder(order)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reorder Items</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
