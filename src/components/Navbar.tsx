import React from 'react';
import { Home, Package, User as UserIcon, ShoppingBag, ShieldCheck, LogIn, Utensils } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export type ActiveTab = 'home' | 'orders' | 'profile' | 'admin';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, isAdmin, openAuthModal } = useAuth();
  const { cart, openCart } = useCart();

  const navItems = [
    { id: 'home' as ActiveTab, label: 'Home', icon: Home },
    { id: 'orders' as ActiveTab, label: 'Orders', icon: Package },
    { id: 'profile' as ActiveTab, label: 'Profile', icon: UserIcon },
  ];

  return (
    <>
      {/* Desktop Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-stone-900/95 backdrop-blur-md border-b border-stone-800 text-stone-100 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            id="brand-logo"
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white shadow-lg shadow-red-900/30 group-hover:scale-105 transition-transform duration-200">
              <span className="text-2xl leading-none">🍕</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-2xl font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
                  Pizza Town
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Artisan
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-medium -mt-0.5 hidden sm:block">
                Woodfired & Hand-Stretched
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-800/80 p-1.5 rounded-full border border-stone-700/60 shadow-inner">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-red-700 text-white shadow-md shadow-red-950/40'
                      : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Admin Dashboard Tab (Visible to Admin or for easy preview) */}
            {isAdmin && (
              <button
                id="nav-link-admin"
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'admin'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-amber-400 hover:text-amber-200 hover:bg-stone-700/50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>Admin</span>
              </button>
            )}
          </nav>

          {/* Right Action Icons: Cart & Profile Auth */}
          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <button
              id="desktop-cart-trigger"
              onClick={openCart}
              className="relative flex items-center gap-2.5 bg-red-700 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md shadow-red-950/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              aria-label="View Shopping Cart"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-amber-200" />
                {(cart?.quantity ?? 0) > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-stone-950 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                    {cart.quantity}
                  </span>
                )}
              </div>
              <span className="text-sm hidden sm:inline font-bold">
                {!cart || (cart.quantity ?? 0) === 0 ? 'Cart' : `$${(cart.total ?? 0).toFixed(2)}`}
              </span>
            </button>

            {/* User Profile / Login */}
            {user ? (
              <button
                id="desktop-user-badge"
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700/80 border border-stone-700 transition-colors"
                title={`Logged in as ${user.name}`}
              >
                <img
                  src={user.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={user.name}
                  className="w-7 h-7 rounded-lg object-cover border border-amber-500/40"
                />
                <span className="text-xs font-semibold text-stone-200 max-w-[100px] truncate hidden lg:inline">
                  {user.name}
                </span>
              </button>
            ) : (
              <button
                id="desktop-login-button"
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-bold border border-stone-700 transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav
        id="mobile-bottom-navbar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-900/98 backdrop-blur-lg border-t border-stone-800 px-3 py-2 text-stone-300 shadow-2xl flex items-center justify-around"
      >
        <button
          id="mobile-nav-home"
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all ${
            activeTab === 'home' ? 'text-red-500 font-bold' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">Home</span>
        </button>

        <button
          id="mobile-nav-orders"
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all ${
            activeTab === 'orders' ? 'text-red-500 font-bold' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">Orders</span>
        </button>

        {/* Floating Center Cart Action */}
        <button
          id="mobile-nav-cart"
          onClick={openCart}
          className="relative flex flex-col items-center justify-center -top-3 w-13 h-13 rounded-full bg-gradient-to-tr from-red-700 to-red-600 text-white shadow-lg shadow-red-950/60 border-4 border-stone-900 active:scale-95 transition-transform"
          aria-label="Shopping Cart"
        >
          <ShoppingBag className="w-5 h-5 text-amber-200" />
          {(cart?.quantity ?? 0) > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-400 text-stone-950 text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow">
              {cart.quantity}
            </span>
          )}
        </button>

        <button
          id="mobile-nav-profile"
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all ${
            activeTab === 'profile' ? 'text-red-500 font-bold' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <UserIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">Profile</span>
        </button>

        {isAdmin && (
          <button
            id="mobile-nav-admin"
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all ${
              activeTab === 'admin' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">Admin</span>
          </button>
        )}
      </nav>
    </>
  );
};
