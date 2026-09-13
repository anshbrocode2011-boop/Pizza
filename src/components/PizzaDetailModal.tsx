import React, { useState, useEffect } from 'react';
import { X, Star, Flame, Leaf, Clock, Flame as CalorieIcon, Plus, Minus, Check, MessageSquare } from 'lucide-react';
import { Pizza, PizzaSize, Review } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { apiRequest } from '../lib/api';

interface PizzaDetailModalProps {
  pizza: Pizza | null;
  onClose: () => void;
}

export const PizzaDetailModal: React.FC<PizzaDetailModalProps> = ({ pizza, onClose }) => {
  const { addToCart } = useCart();
  const { user, openAuthModal } = useAuth();
  const { showToast } = useNotification();

  const [selectedSize, setSelectedSize] = useState<PizzaSize>('Medium');
  const [quantity, setQuantity] = useState<number>(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (pizza) {
      setSelectedSize('Medium');
      setQuantity(1);
      fetchReviews(pizza.id);
    }
  }, [pizza]);

  const fetchReviews = async (pizzaId: string) => {
    setLoadingReviews(true);
    try {
      const data = await apiRequest<{ reviews: Review[] }>(`/api/reviews/pizza/${pizzaId}`);
      setReviews(data.reviews || []);
    } catch {
      // ignore
    } finally {
      setLoadingReviews(false);
    }
  };

  if (!pizza) return null;

  const currentPrice = (pizza?.prices && typeof pizza.prices[selectedSize] === 'number')
    ? pizza.prices[selectedSize]
    : (pizza?.prices ? Object.values(pizza.prices).find(v => typeof v === 'number') : undefined)
    ?? 16.99;
  const totalPrice = parseFloat(((currentPrice || 16.99) * (quantity || 1)).toFixed(2));

  const handleAdd = async () => {
    setIsAdded(true);
    await addToCart(pizza.id, selectedSize, quantity);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 600);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      const res = await apiRequest<{ message: string; review: Review }>(`/api/reviews/pizza/${pizza.id}`, {
        method: 'POST',
        body: JSON.stringify({ rating: newRating, comment: newComment }),
      });
      setReviews(prev => [res.review, ...prev]);
      setNewComment('');
      showToast('Review Posted', 'Thank you for sharing your feedback!', 'success');
    } catch (err: any) {
      showToast('Review Failed', err.message || 'Could not post review', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in">
      <div
        id="pizza-detail-modal"
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-stone-900/70 hover:bg-stone-900 text-white flex items-center justify-center transition-colors shadow-md"
          aria-label="Close pizza modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto flex-1 divide-y divide-stone-100">
          {/* Header Image */}
          <div className="relative aspect-[16/9] w-full bg-stone-100">
            <img src={pizza.image} alt={pizza.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="flex items-center gap-2 mb-1">
                {pizza.featured && (
                  <span className="bg-amber-500 text-stone-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
                    Signature
                  </span>
                )}
                {pizza.isSpicy && (
                  <span className="bg-red-700 text-white text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Spicy
                  </span>
                )}
                {pizza.isVeg && (
                  <span className="bg-emerald-700 text-white text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Leaf className="w-3 h-3" /> Vegetarian
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif">{pizza.name}</h2>
            </div>
          </div>

          {/* Details & Customization */}
          <div className="p-5 sm:p-6 space-y-5">
            <p className="text-stone-700 text-sm leading-relaxed">{pizza.description}</p>

            {/* Prep & Calories info */}
            <div className="flex items-center gap-4 text-xs font-semibold text-stone-500">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>~{pizza.prepTimeMinutes || 20} mins woodfire baked</span>
              </div>
              <div className="flex items-center gap-1">
                <CalorieIcon className="w-4 h-4 text-red-600" />
                <span>{pizza.calories || 850} kcal</span>
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Ingredients & Toppings
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {pizza.ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200 text-xs font-medium text-stone-800"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>

            {/* Size Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Select Crust Size
                </h4>
                <span className="text-xs font-bold text-red-700">{selectedSize} (12")</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['Small', 'Medium', 'Large'] as PizzaSize[]).map(size => {
                  const sizePrice = (pizza?.prices && typeof pizza.prices[size] === 'number')
                    ? pizza.prices[size]
                    : 16.99;
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-red-600 bg-red-50 text-stone-900 shadow-sm'
                          : 'border-stone-200 hover:border-stone-300 text-stone-700'
                      }`}
                    >
                      <p className="text-xs font-bold">{size}</p>
                      <p className="text-sm font-black text-red-700 mt-0.5">${(sizePrice || 16.99).toFixed(2)}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity & Total Action Row */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 border border-stone-200 rounded-xl p-1 bg-stone-50">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-700 hover:bg-stone-100 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center font-bold text-sm text-stone-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-700 hover:bg-stone-100 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                className="flex-1 py-3.5 px-6 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-sm shadow-md shadow-red-900/20 flex items-center justify-between transition-all"
              >
                <span>{isAdded ? 'Added to Order!' : 'Add to Cart'}</span>
                <span className="font-extrabold">${(totalPrice || 0).toFixed(2)}</span>
              </button>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="p-5 sm:p-6 bg-stone-50/70 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-red-700" />
                <h4 className="font-bold text-sm text-stone-900">Customer Reviews</h4>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-stone-700">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{typeof pizza?.rating === 'number' ? pizza.rating.toFixed(1) : '5.0'} / 5</span>
              </div>
            </div>

            {/* Leave a review form */}
            <form onSubmit={handleReviewSubmit} className="bg-white p-4 rounded-xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">Rate this pizza</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= newRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder={user ? "Write your thoughts on the crust, sauce, and toppings..." : "Sign in to leave a review..."}
                rows={2}
                className="w-full text-xs p-2.5 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent resize-none"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingReview || !newComment.trim()}
                  className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-bold transition-all"
                >
                  {isSubmittingReview ? 'Posting...' : user ? 'Post Review' : 'Sign in to Review'}
                </button>
              </div>
            </form>

            {/* Reviews List */}
            <div className="space-y-3">
              {loadingReviews ? (
                <p className="text-xs text-stone-400 text-center py-4">Loading testimonials...</p>
              ) : reviews.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-3">No reviews yet. Be the first to try and review!</p>
              ) : (
                reviews.map(rev => (
                  <div key={rev.id} className="p-3 bg-white rounded-xl border border-stone-200/80">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <img
                          src={rev.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                          alt={rev.userName}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="text-xs font-bold text-stone-800">{rev.userName}</span>
                      </div>
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed pl-7">{rev.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
