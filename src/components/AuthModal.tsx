import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { apiRequest } from '../lib/api';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    login,
    register,
    demoLogin,
  } = useAuth();
  const { showToast } = useNotification();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isForgotPassword) {
        const res = await apiRequest('/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
        showToast('Password Reset', res.message, 'info');
        setIsForgotPassword(false);
      } else if (authModalMode === 'login') {
        await login(email, password);
        showToast('Welcome!', 'Logged into Pizza Town successfully.', 'success');
      } else {
        await register(name, email, password, phone);
        showToast('Welcome!', 'Your account has been created!', 'success');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role: 'customer' | 'admin') => {
    setLoading(true);
    setError(null);
    try {
      await demoLogin(role);
      showToast('Demo Access Granted', `Signed in as ${role === 'admin' ? 'Admin (Chef Mario)' : 'Customer (Alex Morgan)'}`, 'success');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div
        id="auth-modal-card"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-800 via-red-700 to-stone-900 p-6 text-white text-center relative">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-2 text-2xl border border-white/20 shadow-md">
            🍕
          </div>
          <h3 className="font-serif text-2xl font-bold">Pizza Town</h3>
          <p className="text-xs text-amber-200 mt-0.5">
            {isForgotPassword
              ? 'Reset Your Password'
              : authModalMode === 'login'
              ? 'Sign in to your account'
              : 'Create your customer profile'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* One-Click Quick Demo Switchers for instant evaluation */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block">
              ⚡ Quick Demo One-Click Sign In:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="demo-customer-btn"
                onClick={() => handleDemo('customer')}
                disabled={loading}
                className="py-1.5 px-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs"
              >
                <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Customer (Alex)</span>
              </button>

              <button
                type="button"
                id="demo-admin-btn"
                onClick={() => handleDemo('admin')}
                disabled={loading}
                className="py-1.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Admin (Chef Mario)</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {authModalMode === 'register' && !isForgotPassword && (
              <>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Phone (Optional)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+1 (555) 234-5678"
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-700">Password</label>
                  {authModalMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-[11px] font-semibold text-red-700 hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-md shadow-red-950/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isForgotPassword ? (
                'Send Reset Instructions'
              ) : authModalMode === 'login' ? (
                'Sign In to Pizza Town'
              ) : (
                'Create My Account'
              )}
            </button>
          </form>

          {/* Toggle between login / register */}
          <div className="pt-2 text-center text-xs text-stone-500 border-t border-stone-100">
            {isForgotPassword ? (
              <button
                onClick={() => setIsForgotPassword(false)}
                className="font-bold text-red-700 hover:underline"
              >
                Back to Sign In
              </button>
            ) : authModalMode === 'login' ? (
              <p>
                Don't have an account yet?{' '}
                <button
                  onClick={() => openAuthModal('register')}
                  className="font-bold text-red-700 hover:underline ml-1"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => openAuthModal('login')}
                  className="font-bold text-red-700 hover:underline ml-1"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
