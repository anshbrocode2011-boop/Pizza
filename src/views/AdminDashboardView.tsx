import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, DollarSign, Package, Users, Pizza as PizzaIcon, Plus,
  Trash2, Edit, CheckCircle, Clock, Search, RefreshCw, Star, Flame, Leaf, Radio
} from 'lucide-react';
import { Pizza, Order, OrderStatus, User, Review } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { apiRequest } from '../lib/api';

interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  todayOrders: number;
  ordersByStatus: Record<string, number>;
  popularPizzas: { name: string; count: number }[];
}

export const AdminDashboardView: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState<'orders' | 'pizzas' | 'stats' | 'reviews'>('orders');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [searchOrderText, setSearchOrderText] = useState<string>('');

  // Pizza modal state (Add / Edit)
  const [isPizzaModalOpen, setIsPizzaModalOpen] = useState(false);
  const [editingPizza, setEditingPizza] = useState<Pizza | null>(null);
  const [pizzaForm, setPizzaForm] = useState({
    name: '',
    description: '',
    category: 'Classic Italian',
    image: '',
    priceSmall: 14.99,
    priceMedium: 18.99,
    priceLarge: 23.99,
    ingredients: '',
    isSpicy: false,
    isVeg: false,
    featured: false,
    available: true,
  });

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, ordersData, pizzasData, reviewsData] = await Promise.all([
        apiRequest<AdminStats>('/api/admin/stats'),
        apiRequest<{ orders: Order[] }>('/api/admin/orders'),
        apiRequest<{ pizzas: Pizza[] }>('/api/pizzas'),
        apiRequest<{ reviews: Review[] }>('/api/admin/reviews'),
      ]);
      setStats(statsData);
      setOrders(ordersData.orders || []);
      setPizzas(pizzasData.pizzas || []);
      setReviews(reviewsData.reviews || []);
    } catch (err: any) {
      showToast('Admin Error', err.message || 'Could not fetch admin datasets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await apiRequest<{ message: string; order: Order }>(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          note: `Kitchen updated status to "${status}"`,
        }),
      });
      setOrders(prev => prev.map(o => (o.id === orderId ? res.order : o)));
      showToast('Status Updated', `Order #${orderId} broadcasted to "${status}" via real-time SSE!`, 'success');
    } catch (err: any) {
      showToast('Update Failed', err.message || 'Failed to update order status', 'error');
    }
  };

  const handleTogglePizzaAvailability = async (pizza: Pizza) => {
    try {
      const res = await apiRequest<{ message: string; pizza: Pizza }>(`/api/admin/pizzas/${pizza.id}`, {
        method: 'PUT',
        body: JSON.stringify({ available: !pizza.available }),
      });
      setPizzas(prev => prev.map(p => (p.id === pizza.id ? res.pizza : p)));
      showToast('Availability Toggled', `${pizza.name} is now ${!pizza.available ? 'Available' : 'Sold Out'}.`, 'info');
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to toggle availability', 'error');
    }
  };

  const handleDeletePizza = async (pizzaId: string, pizzaName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${pizzaName}" from the menu?`)) return;
    try {
      await apiRequest(`/api/admin/pizzas/${pizzaId}`, { method: 'DELETE' });
      setPizzas(prev => prev.filter(p => p.id !== pizzaId));
      showToast('Pizza Removed', `"${pizzaName}" deleted from menu.`, 'info');
    } catch (err: any) {
      showToast('Delete Failed', err.message, 'error');
    }
  };

  const handleSavePizza = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: pizzaForm.name,
        description: pizzaForm.description,
        category: pizzaForm.category,
        image: pizzaForm.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
        prices: {
          Small: Number(pizzaForm.priceSmall),
          Medium: Number(pizzaForm.priceMedium),
          Large: Number(pizzaForm.priceLarge),
        },
        ingredients: pizzaForm.ingredients.split(',').map(s => s.trim()).filter(Boolean),
        isSpicy: pizzaForm.isSpicy,
        isVeg: pizzaForm.isVeg,
        featured: pizzaForm.featured,
        available: pizzaForm.available,
      };

      if (editingPizza) {
        const res = await apiRequest<{ message: string; pizza: Pizza }>(`/api/admin/pizzas/${editingPizza.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setPizzas(prev => prev.map(p => (p.id === editingPizza.id ? res.pizza : p)));
        showToast('Pizza Updated', `Changes to "${res.pizza.name}" published!`, 'success');
      } else {
        const res = await apiRequest<{ message: string; pizza: Pizza }>('/api/admin/pizzas', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setPizzas(prev => [res.pizza, ...prev]);
        showToast('Pizza Added', `"${res.pizza.name}" is now live on the menu!`, 'success');
      }

      setIsPizzaModalOpen(false);
      setEditingPizza(null);
    } catch (err: any) {
      showToast('Failed to Save', err.message || 'Validation error', 'error');
    }
  };

  const openEditPizza = (pizza: Pizza) => {
    setEditingPizza(pizza);
    setPizzaForm({
      name: pizza.name,
      description: pizza.description,
      category: pizza.category,
      image: pizza.image,
      priceSmall: pizza.prices.Small || 14.99,
      priceMedium: pizza.prices.Medium || 18.99,
      priceLarge: pizza.prices.Large || 23.99,
      ingredients: pizza.ingredients.join(', '),
      isSpicy: !!pizza.isSpicy,
      isVeg: !!pizza.isVeg,
      featured: !!pizza.featured,
      available: pizza.available,
    });
    setIsPizzaModalOpen(true);
  };

  const openNewPizza = () => {
    setEditingPizza(null);
    setPizzaForm({
      name: '',
      description: '',
      category: 'Classic Italian',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
      priceSmall: 14.99,
      priceMedium: 18.99,
      priceLarge: 23.99,
      ingredients: 'San Marzano Sauce, Mozzarella, Fresh Basil',
      isSpicy: false,
      isVeg: true,
      featured: false,
      available: true,
    });
    setIsPizzaModalOpen(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await apiRequest(`/api/admin/reviews/${reviewId}`, { method: 'DELETE' });
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      showToast('Review Removed', 'Review deleted from database.', 'info');
    } catch (err: any) {
      showToast('Failed', err.message, 'error');
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = orderStatusFilter === 'all' || o.orderStatus === orderStatusFilter;
    const matchesSearch =
      !searchOrderText ||
      o.id.toLowerCase().includes(searchOrderText.toLowerCase()) ||
      o.deliveryAddress.fullName.toLowerCase().includes(searchOrderText.toLowerCase()) ||
      o.deliveryAddress.street.toLowerCase().includes(searchOrderText.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 pb-28">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider mb-2">
            <Radio className="w-3.5 h-3.5 text-red-600 animate-pulse" />
            <span>Pizzeria Stone-Oven Command Center</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">Admin Dashboard</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Real-time live order dispatch, stone-oven management, and revenue analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchAdminData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4 text-stone-500" />
            <span>Refresh Data</span>
          </button>

          <button
            type="button"
            onClick={openNewPizza}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Pizza</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-2xl font-black text-stone-900">${(typeof stats.totalRevenue === 'number' ? stats.totalRevenue : 0).toFixed(2)}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Realized sales</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Total Orders</p>
              <h3 className="text-2xl font-black text-stone-900">{stats.totalOrders}</h3>
              <p className="text-[11px] text-red-700 font-semibold mt-0.5">
                {stats.todayOrders} placed today
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <PizzaIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Pizzas on Menu</p>
              <h3 className="text-2xl font-black text-stone-900">{pizzas.length}</h3>
              <p className="text-[11px] text-stone-500 font-semibold mt-0.5">
                {pizzas.filter(p => p.available).length} in stock & baking
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Registered Users</p>
              <h3 className="text-2xl font-black text-stone-900">{stats.totalCustomers}</h3>
              <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Active Pizza Town club</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Orders Management ({orders.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pizzas')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'pizzas'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Menu & Recipes ({pizzas.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'reviews'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Customer Reviews ({reviews.length})
        </button>
      </div>

      {/* TAB 1: Orders Dispatch */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Orders Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchOrderText}
                onChange={e => setSearchOrderText(e.target.value)}
                placeholder="Search by order ID, customer or address..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-stone-500 whitespace-nowrap">Filter Status:</span>
              <select
                value={orderStatusFilter}
                onChange={e => setOrderStatusFilter(e.target.value)}
                className="text-xs font-bold p-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="all">All Statuses ({orders.length})</option>
                <option value="Order Confirmed">Order Confirmed</option>
                <option value="Preparing">Preparing (Baking)</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Orders Table / Cards */}
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Order ID & Date</th>
                    <th className="py-3.5 px-4">Customer & Address</th>
                    <th className="py-3.5 px-4">Items & Details</th>
                    <th className="py-3.5 px-4">Total & Payment</th>
                    <th className="py-3.5 px-4">Current Status</th>
                    <th className="py-3.5 px-4 text-right">Update Status (Broadcast)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400">
                        No orders match the specified criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-stone-900 block">#{order.id}</span>
                          <span className="text-[11px] text-stone-400">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </td>

                        <td className="py-4 px-4 max-w-xs">
                          <p className="font-bold text-stone-900">{order.deliveryAddress.fullName}</p>
                          <p className="text-[11px] text-stone-500 truncate">{order.deliveryAddress.street}</p>
                          <p className="text-[11px] text-stone-400">{order.deliveryAddress.phone}</p>
                        </td>

                        <td className="py-4 px-4 max-w-sm">
                          <div className="space-y-0.5">
                            {order.items.map((item, idx) => (
                              <p key={idx} className="text-[11px] text-stone-700">
                                <span className="font-bold">{item.quantity}x</span> {item.pizzaName} ({item.size})
                              </p>
                            ))}
                          </div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="font-bold text-stone-900 block">${(typeof order?.total === 'number' ? order.total : 0).toFixed(2)}</span>
                          <span className="text-[10px] uppercase font-bold text-stone-500">
                            {order.paymentMethod} • {order.paymentStatus}
                          </span>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              order.orderStatus === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.orderStatus === 'Cancelled'
                                ? 'bg-stone-200 text-stone-600'
                                : order.orderStatus === 'Preparing'
                                ? 'bg-amber-100 text-amber-900'
                                : order.orderStatus === 'Out for Delivery'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {order.orderStatus}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <select
                            value={order.orderStatus}
                            onChange={e => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                            className="text-xs font-bold p-1.5 rounded-lg border border-stone-300 bg-white hover:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600 cursor-pointer"
                          >
                            <option value="Order Confirmed">Order Confirmed</option>
                            <option value="Preparing">Preparing (Baking)</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Pizzas Menu & Recipes */}
      {activeTab === 'pizzas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-bold text-stone-900">
              Stone-Oven Pizza Recipes ({pizzas.length})
            </h3>
            <button
              onClick={openNewPizza}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Recipe</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pizzas.map(pizza => (
              <div
                key={pizza.id}
                className={`bg-white rounded-2xl border p-4 shadow-sm flex flex-col justify-between transition-all ${
                  pizza.available ? 'border-stone-200' : 'border-stone-300 opacity-75 bg-stone-50'
                }`}
              >
                <div>
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-stone-100">
                    <img src={pizza.image} alt={pizza.name} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 flex gap-1">
                      {pizza.featured && (
                        <span className="bg-amber-500 text-stone-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Featured
                        </span>
                      )}
                      {pizza.isSpicy && (
                        <span className="bg-red-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5" /> Spicy
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          pizza.available ? 'bg-emerald-600 text-white' : 'bg-stone-800 text-stone-200'
                        }`}
                      >
                        {pizza.available ? 'In Stock' : 'Sold Out'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-serif font-bold text-base text-stone-900">{pizza.name}</h4>
                    <span className="text-xs font-bold text-stone-500">{pizza.category}</span>
                  </div>

                  <p className="text-stone-600 text-xs line-clamp-2 leading-relaxed mb-3">
                    {pizza.description}
                  </p>

                  <div className="flex items-center justify-between text-xs py-2 border-t border-stone-100">
                    <span className="text-stone-500">Prices:</span>
                    <span className="font-bold text-stone-800">
                      S: ${pizza?.prices?.Small ?? 0} | M: ${pizza?.prices?.Medium ?? 0} | L: ${pizza?.prices?.Large ?? 0}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleTogglePizzaAvailability(pizza)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      pizza.available
                        ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                    }`}
                  >
                    {pizza.available ? 'Mark Sold Out' : 'Mark Available'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditPizza(pizza)}
                      className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
                      title="Edit Pizza"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePizza(pizza.id, pizza.name)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Pizza"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Customer Reviews */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
            <h3 className="font-serif text-xl font-bold text-stone-900 mb-4">
              Customer Feedback & Reviews ({reviews.length})
            </h3>

            <div className="space-y-3 divide-y divide-stone-100">
              {reviews.map(rev => (
                <div key={rev.id} className="pt-3 first:pt-0 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-stone-900">{rev.userName}</span>
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-[10px] text-stone-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed">{rev.comment}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteReview(rev.id)}
                    className="p-1.5 text-stone-400 hover:text-red-600 transition-colors rounded-lg"
                    title="Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pizza Add / Edit Modal */}
      {isPizzaModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif text-xl font-bold text-stone-900">
                {editingPizza ? 'Edit Pizza Recipe' : 'Add New Artisan Pizza'}
              </h3>
              <button
                onClick={() => setIsPizzaModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-xs p-1"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSavePizza} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Pizza Name *</label>
                  <input
                    type="text"
                    required
                    value={pizzaForm.name}
                    onChange={e => setPizzaForm({ ...pizzaForm, name: e.target.value })}
                    placeholder="e.g. Gorgonzola & Fig"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Category</label>
                  <select
                    value={pizzaForm.category}
                    onChange={e => setPizzaForm({ ...pizzaForm, category: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="Classic Italian">Classic Italian</option>
                    <option value="Town Specialties">Town Specialties</option>
                    <option value="Spicy & Bold">Spicy & Bold</option>
                    <option value="Garden Veggie">Garden Veggie</option>
                    <option value="Sweet & Calzones">Sweet & Calzones</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Description *</label>
                <textarea
                  required
                  rows={2}
                  value={pizzaForm.description}
                  onChange={e => setPizzaForm({ ...pizzaForm, description: e.target.value })}
                  placeholder="Describe the crust, sauce, cheeses and finish..."
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Image URL</label>
                <input
                  type="url"
                  value={pizzaForm.image}
                  onChange={e => setPizzaForm({ ...pizzaForm, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              {/* Prices for Small, Medium, Large */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Size Pricing (USD)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-stone-500 block">Small (10")</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={pizzaForm.priceSmall}
                      onChange={e => setPizzaForm({ ...pizzaForm, priceSmall: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs p-2 rounded-lg border border-stone-200"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 block">Medium (12")</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={pizzaForm.priceMedium}
                      onChange={e => setPizzaForm({ ...pizzaForm, priceMedium: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs p-2 rounded-lg border border-stone-200"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 block">Large (14")</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={pizzaForm.priceLarge}
                      onChange={e => setPizzaForm({ ...pizzaForm, priceLarge: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs p-2 rounded-lg border border-stone-200"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Ingredients (comma separated)
                </label>
                <input
                  type="text"
                  value={pizzaForm.ingredients}
                  onChange={e => setPizzaForm({ ...pizzaForm, ingredients: e.target.value })}
                  placeholder="San Marzano, Fior di Latte, Sliced Pepperoni, Basil"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pizzaForm.isVeg}
                    onChange={e => setPizzaForm({ ...pizzaForm, isVeg: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  <span>Vegetarian</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pizzaForm.isSpicy}
                    onChange={e => setPizzaForm({ ...pizzaForm, isSpicy: e.target.checked })}
                    className="rounded text-red-600"
                  />
                  <span>Spicy</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pizzaForm.featured}
                    onChange={e => setPizzaForm({ ...pizzaForm, featured: e.target.checked })}
                    className="rounded text-amber-600"
                  />
                  <span>Featured Best Seller</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pizzaForm.available}
                    onChange={e => setPizzaForm({ ...pizzaForm, available: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>In Stock & Ready</span>
                </label>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPizzaModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 text-xs font-bold hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-md transition-all"
                >
                  Save Pizza
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
