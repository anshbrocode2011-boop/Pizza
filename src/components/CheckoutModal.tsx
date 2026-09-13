import React, { useState, useEffect } from 'react';
import { X, Check, MapPin, CreditCard, DollarSign, ShieldCheck, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Address, Order } from '../types';
import { apiRequest } from '../lib/api';

interface CheckoutModalProps {
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ onOrderSuccess }) => {
  const { cart, isCheckoutOpen, closeCheckout, clearCart } = useCart();
  const { user, openAuthModal } = useAuth();
  const { showToast } = useNotification();

  // Steps: 1: Address, 2: Payment & Review, 3: Success Confirmation
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Address form fields
  const [addressForm, setAddressForm] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62704',
    instructions: '',
  });

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'stripe' | 'online'>('cod');
  const [cardDetails, setCardDetails] = useState({
    number: '4242 •••• •••• 4242',
    exp: '12/28',
    cvv: '999',
    nameOnCard: user?.name || 'Alex Morgan',
  });

  // Promo code
  const [promoCode, setPromoCode] = useState<string>('');

  useEffect(() => {
    if (user && isCheckoutOpen) {
      setAddressForm(prev => ({
        ...prev,
        fullName: user.name || prev.fullName,
        phone: user.phone || prev.phone,
      }));
      // Fetch saved addresses
      apiRequest<{ addresses: Address[] }>('/api/profile/addresses')
        .then(data => {
          if (data.addresses && data.addresses.length > 0) {
            setSavedAddresses(data.addresses);
            const defaultAddr = data.addresses.find(a => a.isDefault) || data.addresses[0];
            setSelectedAddressId(defaultAddr.id);
            setAddressForm({
              fullName: defaultAddr.fullName,
              phone: defaultAddr.phone,
              street: defaultAddr.street,
              city: defaultAddr.city,
              state: defaultAddr.state,
              zipCode: defaultAddr.zipCode,
              instructions: defaultAddr.instructions || '',
            });
          }
        })
        .catch(() => {});
    }
  }, [user, isCheckoutOpen]);

  if (!isCheckoutOpen) return null;

  const handleSelectSavedAddress = (id: string) => {
    setSelectedAddressId(id);
    if (id === 'new') {
      setAddressForm({
        fullName: user?.name || '',
        phone: user?.phone || '',
        street: '',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62704',
        instructions: '',
      });
    } else {
      const found = savedAddresses.find(a => a.id === id);
      if (found) {
        setAddressForm({
          fullName: found.fullName,
          phone: found.phone,
          street: found.street,
          city: found.city,
          state: found.state,
          zipCode: found.zipCode,
          instructions: found.instructions || '',
        });
      }
    }
  };

  const handlePlaceOrder = async () => {
    if (!addressForm.fullName || !addressForm.phone || !addressForm.street) {
      showToast('Missing Details', 'Please provide your full name, phone number, and street address.', 'error');
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      // If Stripe or online payment is selected, initiate tokenized payment intent
      if (paymentMethod === 'stripe' || paymentMethod === 'online') {
        await apiRequest('/api/payments/create-intent', {
          method: 'POST',
          body: JSON.stringify({
            amount: cart.total,
            currency: 'usd',
          }),
        });
      }

      // Submit real order to backend API
      const res = await apiRequest<{ message: string; order: Order }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.items,
          deliveryAddress: addressForm,
          paymentMethod,
          promoCode: promoCode || undefined,
          notes: addressForm.instructions,
        }),
      });

      setCreatedOrder(res.order);
      setStep(3);

      // Trigger celebratory confetti effect
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#b91c1c', '#f59e0b', '#10b981', '#ffffff'],
        });
      } catch {
        // ignore
      }

      showToast('Order Placed!', `Your Pizza Town order #${res.order.id} is confirmed!`, 'success');
      onOrderSuccess(res.order);
    } catch (err: any) {
      showToast('Order Failed', err.message || 'Could not process order.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div
        id="checkout-modal-card"
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto"
      >
        {/* Header */}
        <div className="p-5 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          <div>
            <h3 className="font-serif text-lg font-bold">Pizza Town Checkout</h3>
            <p className="text-xs text-stone-300">
              {step === 1 && 'Step 1 of 2: Delivery Address'}
              {step === 2 && 'Step 2 of 2: Payment & Order Summary'}
              {step === 3 && 'Order Confirmed! 🎉'}
            </p>
          </div>

          <button
            onClick={closeCheckout}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: Delivery Address */}
        {step === 1 && (
          <div className="p-6 space-y-5">
            {/* If user has saved addresses, display quick selector */}
            {savedAddresses.length > 0 && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-2">
                  Saved Delivery Addresses
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {savedAddresses.map(addr => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => handleSelectSavedAddress(addr.id)}
                      className={`p-3 text-left rounded-xl border transition-all text-xs ${
                        selectedAddressId === addr.id
                          ? 'border-red-600 bg-red-50/70 text-stone-900 font-medium shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 text-stone-600'
                      }`}
                    >
                      <div className="flex items-center gap-1 font-bold text-stone-800 mb-0.5">
                        <MapPin className="w-3 h-3 text-red-600" />
                        <span>{addr.fullName}</span>
                      </div>
                      <p className="truncate text-[11px] text-stone-500">{addr.street}</p>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleSelectSavedAddress('new')}
                    className={`p-3 text-left rounded-xl border transition-all text-xs ${
                      selectedAddressId === 'new'
                        ? 'border-red-600 bg-red-50/70 text-stone-900 font-bold shadow-xs'
                        : 'border-dashed border-stone-300 hover:border-stone-400 text-stone-600'
                    }`}
                  >
                    + Enter New Address
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.fullName}
                    onChange={e => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    placeholder="e.g. Alex Morgan"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder="+1 (555) 234-5678"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  value={addressForm.street}
                  onChange={e => setAddressForm({ ...addressForm, street: e.target.value })}
                  placeholder="742 Evergreen Terrace, Apt 4B"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">State</label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={e => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">ZIP Code</label>
                  <input
                    type="text"
                    value={addressForm.zipCode}
                    onChange={e => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Delivery Notes / Gate Code (Optional)
                </label>
                <input
                  type="text"
                  value={addressForm.instructions}
                  onChange={e => setAddressForm({ ...addressForm, instructions: e.target.value })}
                  placeholder="Leave at porch, call on arrival, etc."
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <button
                type="button"
                onClick={closeCheckout}
                className="text-xs font-bold text-stone-600 hover:text-stone-900"
              >
                Back to Cart
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!addressForm.fullName || !addressForm.phone || !addressForm.street) {
                    showToast('Missing Required Fields', 'Please enter your name, phone, and delivery address.', 'error');
                    return;
                  }
                  setStep(2);
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-md transition-all"
              >
                <span>Continue to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Payment & Order Review */}
        {step === 2 && (
          <div className="p-6 space-y-5">
            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-2">
                Choose Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-red-600 bg-red-50/80 text-stone-900 shadow-sm'
                      : 'border-stone-200 hover:border-stone-300 text-stone-600'
                  }`}
                >
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <div className="text-left">
                    <p className="text-xs font-bold">Cash on Delivery</p>
                    <p className="text-[10px] text-stone-500">Pay cash upon driver arrival</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('stripe')}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                    paymentMethod === 'stripe'
                      ? 'border-red-600 bg-red-50/80 text-stone-900 shadow-sm'
                      : 'border-stone-200 hover:border-stone-300 text-stone-600'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <p className="text-xs font-bold">Credit Card (Stripe)</p>
                    <p className="text-[10px] text-stone-500">Secure tokenized payment</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Simulated Secure Card Input (when Stripe/online is chosen) */}
            {paymentMethod === 'stripe' && (
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    256-Bit SSL Encrypted Card Gateway
                  </span>
                  <span className="text-[10px] font-mono text-stone-500">STRIPE POWERED</span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-stone-500 block mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardDetails.number}
                    onChange={e => setCardDetails({ ...cardDetails, number: e.target.value })}
                    className="w-full text-xs font-mono p-2 rounded-lg border border-stone-200 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-500 block mb-1">Exp Date</label>
                    <input
                      type="text"
                      value={cardDetails.exp}
                      onChange={e => setCardDetails({ ...cardDetails, exp: e.target.value })}
                      className="w-full text-xs font-mono p-2 rounded-lg border border-stone-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-stone-500 block mb-1">CVC / CVV</label>
                    <input
                      type="password"
                      value={cardDetails.cvv}
                      onChange={e => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                      className="w-full text-xs font-mono p-2 rounded-lg border border-stone-200 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Order Items Review Summary */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-2">
              <h5 className="font-bold text-stone-800 flex items-center justify-between">
                <span>Items ({cart?.quantity ?? 0})</span>
                <span className="text-stone-500 font-normal">Delivering to: {addressForm.street}</span>
              </h5>
              <div className="max-h-28 overflow-y-auto space-y-1 divide-y divide-stone-200/50">
                {(cart?.items || []).map(item => {
                  const itemPrice = typeof item.totalPrice === 'number'
                    ? item.totalPrice
                    : (item.unitPrice || 0) * (item.quantity || 1);
                  return (
                    <div key={item.id} className="pt-1 first:pt-0 flex justify-between text-stone-700">
                      <span>{item.quantity}x {item.name} ({item.size})</span>
                      <span className="font-semibold">${itemPrice.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-stone-900 text-sm">
                <span>Total Due</span>
                <span className="text-red-700">${(typeof cart?.total === 'number' ? cart.total : 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Address</span>
              </button>

              <button
                type="button"
                id="place-order-confirm-btn"
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-sm shadow-xl shadow-red-950/20 transition-all active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transmitting Order...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Place Order (${(typeof cart?.total === 'number' ? cart.total : 0).toFixed(2)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Order Confirmed Screen */}
        {step === 3 && createdOrder && (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-inner">
              ✓
            </div>

            <div>
              <h3 className="font-serif text-2xl font-bold text-stone-900">
                Order Confirmed!
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Order #{createdOrder.id} has been transmitted to Chef Mario at the stone oven.
              </p>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Estimated Delivery:</span>
                <span className="font-bold text-stone-800">~25-35 Minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Destination:</span>
                <span className="font-semibold text-stone-800">{createdOrder.deliveryAddress.street}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Payment:</span>
                <span className="font-semibold text-stone-800 uppercase">
                  {createdOrder.paymentMethod} (${(typeof createdOrder.total === 'number' ? createdOrder.total : 0).toFixed(2)})
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={closeCheckout}
                className="flex-1 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-colors shadow-md"
              >
                Track in Orders Tab
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
