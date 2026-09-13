import React, { useState } from 'react';
import { Star, Flame, Leaf, Plus, Check } from 'lucide-react';
import { Pizza, PizzaSize } from '../types';
import { useCart } from '../context/CartContext';

interface PizzaCardProps {
  pizza: Pizza;
  onOpenDetails: (pizza: Pizza) => void;
}

export const PizzaCard: React.FC<PizzaCardProps> = ({ pizza, onOpenDetails }) => {
  const { addToCart, loading } = useCart();
  const [selectedSize, setSelectedSize] = useState<PizzaSize>('Medium');
  const [isAdding, setIsAdding] = useState(false);

  const price = (pizza?.prices && typeof pizza.prices[selectedSize] === 'number')
    ? pizza.prices[selectedSize]
    : (pizza?.prices ? Object.values(pizza.prices).find(v => typeof v === 'number') : undefined)
    ?? 16.99;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdding(true);
    await addToCart(pizza.id, selectedSize, 1);
    setTimeout(() => {
      setIsAdding(false);
    }, 1200);
  };

  return (
    <div
      id={`pizza-card-${pizza.id}`}
      onClick={() => onOpenDetails(pizza)}
      className="group bg-white rounded-2xl border border-stone-200/90 hover:border-red-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Pizza Image Container */}
      <div className="relative w-full aspect-[4/3] bg-stone-100 overflow-hidden">
        <img
          src={pizza.image}
          alt={pizza.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          {pizza.featured && (
            <span className="bg-amber-500 text-stone-950 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow">
              Best Seller
            </span>
          )}
          {pizza.isSpicy && (
            <span className="bg-red-700 text-white font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5" /> Spicy
            </span>
          )}
          {pizza.isVeg && (
            <span className="bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow flex items-center gap-0.5">
              <Leaf className="w-2.5 h-2.5" /> Veg
            </span>
          )}
        </div>

        {/* Rating pill */}
        <div className="absolute bottom-2 right-2 bg-stone-900/85 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>{typeof pizza?.rating === 'number' ? pizza.rating.toFixed(1) : '5.0'}</span>
          <span className="text-[10px] text-stone-400 font-normal">({pizza?.reviewsCount ?? 0})</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-red-700 transition-colors line-clamp-1">
            {pizza.name}
          </h3>
          <p className="text-stone-600 text-xs mt-1.5 line-clamp-2 leading-relaxed min-h-[32px]">
            {pizza.description}
          </p>
        </div>

        {/* Size Selection Pill Toggle */}
        <div className="mt-4 pt-3 border-t border-stone-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Select Size</span>
            <span className="text-xs font-semibold text-stone-700">{selectedSize}</span>
          </div>
          <div className="grid grid-cols-3 gap-1 p-1 bg-stone-100/90 rounded-xl" onClick={e => e.stopPropagation()}>
            {(['Small', 'Medium', 'Large'] as PizzaSize[]).map(size => {
              const isSelected = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`py-1 rounded-lg text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  {size[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Price and Add to Cart Button */}
        <div className="mt-4 pt-2 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">Total</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg sm:text-xl font-black text-stone-900">${(typeof price === 'number' ? price : 16.99).toFixed(2)}</span>
            </div>
          </div>

          <button
            type="button"
            id={`add-to-cart-btn-${pizza.id}`}
            onClick={handleAddToCart}
            disabled={!pizza.available || loading}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 ${
              isAdding
                ? 'bg-emerald-600 text-white'
                : pizza.available
                ? 'bg-red-700 hover:bg-red-800 text-white shadow-red-900/20'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            {isAdding ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added!</span>
              </>
            ) : pizza.available ? (
              <>
                <Plus className="w-4 h-4" />
                <span>Add to Cart</span>
              </>
            ) : (
              <span>Sold Out</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
