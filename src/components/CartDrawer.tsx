import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Sparkles, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { PizzaSize } from '../types';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    closeCart,
    updateQuantity,
    updateSize,
    removeItem,
    clearCart,
    openCheckout,
  } = useCart();

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const subtotal = typeof cart?.subtotal === 'number' ? cart.subtotal : 0;
  const deliveryFee = typeof cart?.deliveryFee === 'number' ? cart.deliveryFee : 0;
  const total = typeof cart?.total === 'number' ? cart.total : (subtotal + deliveryFee);
  const cartQuantity = typeof cart?.quantity === 'number' ? cart.quantity : 0;
  const cartItems = Array.isArray(cart?.items) ? cart.items : [];

  const freeDeliveryThreshold = 40;
  const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);
  const deliveryProgress = Math.min(100, (subtotal / freeDeliveryThreshold) * 100);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    const code = promoCodeInput.trim().toUpperCase();
    if (code === 'PIZZATOWN20' || code === 'PIZZA10' || code === 'FREESHIP') {
      setAppliedPromo(code);
      setPromoCodeInput('');
    } else {
      setPromoError('Invalid coupon code. Try PIZZATOWN20 or PIZZA10');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="absolute inset-0" onClick={closeCart} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          id="cart-drawer-panel"
          className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-stone-200 animate-in slide-in-from-right duration-300"
        >
          {/* Cart Header */}
          <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-900 text-white">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-700 text-amber-200">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-white">Your Pizza Cart</h3>
                <p className="text-xs text-stone-300">{cartQuantity} items in order</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cartItems.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-stone-400 hover:text-red-400 text-xs font-semibold px-2 py-1 rounded transition-colors"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={closeCart}
                className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors"
                aria-label="Close cart"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Free Delivery Bar */}
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-200/60">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-amber-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                {amountNeededForFreeDelivery > 0
                  ? `Add $${(amountNeededForFreeDelivery || 0).toFixed(2)} more for FREE delivery!`
                  : '🎉 You have qualified for FREE Express Delivery!'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-amber-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${deliveryProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-stone-100">
            {cartItems.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto text-3xl">
                  🍕
                </div>
                <div>
                  <h4 className="font-serif text-lg font-bold text-stone-900">Your cart is hungry!</h4>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1">
                    Explore our hand-tossed artisan pizzas and add delicious slices to your order.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCart}
                  className="px-6 py-2.5 rounded-xl bg-red-700 text-white text-xs font-bold shadow-md hover:bg-red-800 transition-colors"
                >
                  Explore Menu
                </button>
              </div>
            ) : (
              cartItems.map(item => (
                <div key={item.id} className="pt-4 first:pt-0 flex gap-3.5 items-center">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-serif text-sm font-bold text-stone-900 truncate">
                        {item.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-stone-400 hover:text-red-600 p-1 transition-colors"
                        aria-label="Remove pizza from cart"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Size Selector dropdown */}
                    <div className="flex items-center gap-2 mt-1">
                      <select
                        value={item.size}
                        onChange={e => updateSize(item.id, e.target.value as PizzaSize)}
                        className="text-[11px] font-bold text-stone-700 bg-stone-100 border border-stone-200 rounded-lg px-2 py-0.5 focus:outline-none cursor-pointer"
                      >
                        <option value="Small">Small (10")</option>
                        <option value="Medium">Medium (12")</option>
                        <option value="Large">Large (14")</option>
                      </select>
                      <span className="text-xs font-semibold text-stone-500">
                        ${(typeof item.unitPrice === 'number' ? item.unitPrice : 0).toFixed(2)} ea
                      </span>
                    </div>

                    {/* Quantity controls and item total */}
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-stone-600 hover:text-red-700 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-stone-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-stone-600 hover:text-red-700 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-black text-sm text-stone-900">
                        ${(typeof item.totalPrice === 'number' ? item.totalPrice : (item.unitPrice || 0) * (item.quantity || 1)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer & Checkout Action */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-stone-200 bg-stone-50 space-y-4">
              {/* Promo Code Input */}
              <form onSubmit={handleApplyPromo} className="space-y-1">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={e => setPromoCodeInput(e.target.value)}
                      placeholder="Promo code (e.g. PIZZATOWN20)"
                      className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-stone-200 bg-white uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold transition-colors shrink-0"
                  >
                    Apply
                  </button>
                </div>
                {appliedPromo && (
                  <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    ✓ Promo code {appliedPromo} applied at checkout!
                  </p>
                )}
                {promoError && (
                  <p className="text-[11px] text-red-600 font-semibold">{promoError}</p>
                )}
              </form>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-stone-600 pt-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-800">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Heated Delivery Fee</span>
                  <span className="font-semibold text-stone-800">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-600 font-bold">FREE</span>
                    ) : (
                      `$${deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-stone-900 pt-2 border-t border-stone-200">
                  <span>Estimated Total</span>
                  <span className="text-red-700 text-base">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  id="cart-checkout-proceed-btn"
                  onClick={openCheckout}
                  className="w-full py-3.5 px-5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-sm shadow-lg shadow-red-950/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={closeCart}
                  className="w-full py-2 text-center text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
