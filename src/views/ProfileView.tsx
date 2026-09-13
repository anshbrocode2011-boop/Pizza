import React, { useState, useEffect } from 'react';
import { User as UserIcon, Mail, Phone, MapPin, Plus, Trash2, Edit3, LogOut, Check, ShieldCheck, Heart, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Address, Order } from '../types';
import { apiRequest } from '../lib/api';

interface ProfileViewProps {
  onNavigateOrders: () => void;
  onNavigateHome: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigateOrders, onNavigateHome }) => {
  const { user, logout, openAuthModal, refreshUser } = useAuth();
  const { showToast } = useNotification();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [avatarInput, setAvatarInput] = useState('');

  // Add Address Modal state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62704',
    instructions: '',
    isDefault: false,
  });

  useEffect(() => {
    if (user) {
      setNameInput(user.name || '');
      setPhoneInput(user.phone || '');
      setAvatarInput(user.profileImage || '');
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const data = await apiRequest<{ addresses: Address[] }>('/api/profile/addresses');
      setAddresses(data.addresses || []);
    } catch {
      // ignore
    } finally {
      setLoadingAddresses(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto text-3xl shadow-inner">
          👤
        </div>
        <div>
          <h2 className="font-serif text-2xl font-bold text-stone-900">Sign in to your Profile</h2>
          <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1">
            Access your saved addresses, track recent orders, and save your favorite sourdough pizzas.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => openAuthModal('login')}
            className="px-6 py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-md transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => openAuthModal('register')}
            className="px-6 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors"
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: nameInput,
          phone: phoneInput,
          profileImage: avatarInput,
        }),
      });
      await refreshUser();
      setIsEditingProfile(false);
      showToast('Profile Updated', 'Your changes have been saved!', 'success');
    } catch (err: any) {
      showToast('Update Failed', err.message || 'Could not update profile', 'error');
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest<{ message: string; address: Address }>('/api/profile/addresses', {
        method: 'POST',
        body: JSON.stringify(newAddr),
      });
      setAddresses(prev => [res.address, ...prev]);
      setIsAddingAddress(false);
      setNewAddr({
        fullName: user.name,
        phone: user.phone || '',
        street: '',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62704',
        instructions: '',
        isDefault: false,
      });
      showToast('Address Saved', 'New delivery location added.', 'success');
    } catch (err: any) {
      showToast('Failed', err.message || 'Could not save address', 'error');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await apiRequest(`/api/profile/addresses/${id}`, { method: 'DELETE' });
      setAddresses(prev => prev.filter(a => a.id !== id));
      showToast('Address Removed', 'Delivery address was deleted.', 'info');
    } catch (err: any) {
      showToast('Error', err.message || 'Could not delete address', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 pb-24">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            <img
              src={user.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
              alt={user.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-stone-200 shadow-md"
            />
            {user.role === 'admin' && (
              <span className="absolute -bottom-2 -right-2 bg-amber-500 text-stone-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow">
                Admin
              </span>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                  {user.name}
                </h1>
                <p className="text-xs text-stone-500 font-medium">
                  Pizza Town Club Member since {new Date(user.createdAt).getFullYear()}
                </p>
              </div>

              <div className="flex items-center justify-center sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-stone-600" />
                  <span>{isEditingProfile ? 'Cancel' : 'Edit Profile'}</span>
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-600" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Profile Contact Pills */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs text-stone-600">
              <span className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200/80">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                {user.email}
              </span>
              <span className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200/80">
                <Phone className="w-3.5 h-3.5 text-stone-400" />
                {user.phone || 'No phone added'}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Profile Form drawer */}
        {isEditingProfile && (
          <form onSubmit={handleUpdateProfile} className="mt-6 pt-6 border-t border-stone-100 space-y-4 animate-in fade-in">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Edit Personal Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Avatar Image URL</label>
                <input
                  type="url"
                  value={avatarInput}
                  onChange={e => setAvatarInput(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={onNavigateOrders}
          className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-red-300 shadow-sm cursor-pointer transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-base text-stone-900">Your Orders</h4>
              <p className="text-xs text-stone-500">Live order status and past receipts</p>
            </div>
          </div>
          <span className="text-stone-400 group-hover:text-red-700 font-bold text-sm">→</span>
        </div>

        <div
          onClick={onNavigateHome}
          className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-red-300 shadow-sm cursor-pointer transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-base text-stone-900">Pizza Menu</h4>
              <p className="text-xs text-stone-500">Explore signature recipes & specialties</p>
            </div>
          </div>
          <span className="text-stone-400 group-hover:text-red-700 font-bold text-sm">→</span>
        </div>
      </div>

      {/* Saved Addresses Section */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-100 text-red-700">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-stone-900">Saved Delivery Addresses</h3>
              <p className="text-xs text-stone-500">Locations stored for quick 1-click checkout</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingAddress(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Address</span>
          </button>
        </div>

        {/* Add Address Form Modal / Inline */}
        {isAddingAddress && (
          <form onSubmit={handleAddAddress} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-800 uppercase">New Address Details</h4>
              <button
                type="button"
                onClick={() => setIsAddingAddress(false)}
                className="text-stone-400 hover:text-stone-700 text-xs"
              >
                ✕ Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-stone-600 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newAddr.fullName}
                  onChange={e => setNewAddr({ ...newAddr, fullName: e.target.value })}
                  placeholder="e.g. Alex Morgan (Home)"
                  className="w-full text-xs p-2 rounded-lg border border-stone-200 bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-stone-600 block mb-1">Contact Phone</label>
                <input
                  type="tel"
                  required
                  value={newAddr.phone}
                  onChange={e => setNewAddr({ ...newAddr, phone: e.target.value })}
                  placeholder="+1 (555) 234-5678"
                  className="w-full text-xs p-2 rounded-lg border border-stone-200 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-stone-600 block mb-1">Street Address</label>
              <input
                type="text"
                required
                value={newAddr.street}
                onChange={e => setNewAddr({ ...newAddr, street: e.target.value })}
                placeholder="742 Evergreen Terrace, Apt 4B"
                className="w-full text-xs p-2 rounded-lg border border-stone-200 bg-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-stone-600 block mb-1">City</label>
                <input
                  type="text"
                  value={newAddr.city}
                  onChange={e => setNewAddr({ ...newAddr, city: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-stone-200 bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-stone-600 block mb-1">State</label>
                <input
                  type="text"
                  value={newAddr.state}
                  onChange={e => setNewAddr({ ...newAddr, state: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-stone-200 bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-stone-600 block mb-1">ZIP Code</label>
                <input
                  type="text"
                  value={newAddr.zipCode}
                  onChange={e => setNewAddr({ ...newAddr, zipCode: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-stone-200 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-colors shadow-sm"
              >
                Save Address
              </button>
            </div>
          </form>
        )}

        {/* Address Cards Grid */}
        {loadingAddresses ? (
          <p className="text-xs text-stone-400 py-4 text-center">Loading addresses...</p>
        ) : addresses.length === 0 ? (
          <p className="text-xs text-stone-500 py-6 text-center">
            No saved addresses yet. Add an address to make your next pizza order even faster!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map(addr => (
              <div
                key={addr.id}
                className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-white hover:border-stone-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-600" />
                      {addr.fullName}
                    </span>
                    {addr.isDefault && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-700">{addr.street}</p>
                  <p className="text-[11px] text-stone-500">{addr.city}, {addr.state} {addr.zipCode}</p>
                  <p className="text-[11px] text-stone-500 mt-1">Phone: {addr.phone}</p>
                  {addr.instructions && (
                    <p className="text-[11px] text-amber-900 mt-1.5 italic bg-amber-50 p-1.5 rounded-lg border border-amber-200/60">
                      "{addr.instructions}"
                    </p>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-stone-200/60 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="text-stone-400 hover:text-red-600 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
