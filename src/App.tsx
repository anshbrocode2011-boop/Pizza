import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';
import { HomeView } from './views/HomeView';
import { OrdersView } from './views/OrdersView';
import { ProfileView } from './views/ProfileView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { Pizza, Category, Order } from './types';
import { apiRequest } from './lib/api';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'profile' | 'orders' | 'admin'>('home');
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch initial catalog
  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const [pizzasRes, catsRes] = await Promise.all([
          apiRequest<{ pizzas: Pizza[] }>('/api/pizzas'),
          apiRequest<{ categories: Category[] }>('/api/categories'),
        ]);
        setPizzas(pizzasRes.pizzas || []);
        setCategories(catsRes.categories || []);
      } catch (err) {
        console.error('Failed to load catalog:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  const handleOrderSuccess = (_order: Order) => {
    // When order is successfully placed, switch to Orders tab so they can watch live progress
    setTimeout(() => {
      setActiveTab('orders');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 text-stone-900 font-sans selection:bg-red-700 selection:text-white">
      {/* Top and Mobile Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Active View */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomeView pizzas={pizzas} categories={categories} loading={loading} />
        )}
        {activeTab === 'orders' && (
          <OrdersView onNavigateHome={() => setActiveTab('home')} />
        )}
        {activeTab === 'profile' && (
          <ProfileView
            onNavigateOrders={() => setActiveTab('orders')}
            onNavigateHome={() => setActiveTab('home')}
          />
        )}
        {activeTab === 'admin' && <AdminDashboardView />}
      </main>

      {/* Cart Drawer & Checkout Modal */}
      <CartDrawer />
      <CheckoutModal onOrderSuccess={handleOrderSuccess} />

      {/* Auth Modal for Sign in / Register */}
      <AuthModal />

      {/* Site Footer */}
      <Footer onNavigateTab={setActiveTab} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
