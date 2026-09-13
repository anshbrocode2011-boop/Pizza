import React from 'react';
import { Search, Flame, Leaf, Sparkles, Filter } from 'lucide-react';
import { Category } from '../types';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onlySpicy: boolean;
  setOnlySpicy: (val: boolean | ((prev: boolean) => boolean)) => void;
  onlyVeg: boolean;
  setOnlyVeg: (val: boolean | ((prev: boolean) => boolean)) => void;
  onlyFeatured: boolean;
  setOnlyFeatured: (val: boolean | ((prev: boolean) => boolean)) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  setSearchQuery,
  onlySpicy,
  setOnlySpicy,
  onlyVeg,
  setOnlyVeg,
  onlyFeatured,
  setOnlyFeatured,
  sortBy,
  setSortBy,
}) => {
  return (
    <div className="space-y-4">
      {/* Search and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search toppings, artisan crusts, sauce..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dietary & Sort Controls */}
        <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <button
            type="button"
            onClick={() => setOnlyFeatured(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              onlyFeatured
                ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-sm'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Best Sellers</span>
          </button>

          <button
            type="button"
            onClick={() => setOnlyVeg(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              onlyVeg
                ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-sm'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            <span>Vegetarian</span>
          </button>

          <button
            type="button"
            onClick={() => setOnlySpicy(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              onlySpicy
                ? 'bg-red-50 border-red-400 text-red-900 shadow-sm'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-red-600" />
            <span>Spicy</span>
          </button>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-stone-200 text-stone-700 focus:outline-none focus:ring-2 focus:ring-red-600 shadow-sm cursor-pointer"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl whitespace-nowrap text-xs sm:text-sm font-bold transition-all border shrink-0 ${
                isSelected
                  ? 'bg-stone-900 text-white border-stone-900 shadow-md scale-[1.02]'
                  : 'bg-white text-stone-700 hover:bg-stone-100/80 border-stone-200'
              }`}
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="w-5 h-5 rounded-full object-cover shadow-xs"
              />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
