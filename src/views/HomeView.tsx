import React, { useState, useMemo } from 'react';
import { Hero } from '../components/Hero';
import { SpecialOffers } from '../components/SpecialOffers';
import { CategoryFilter } from '../components/CategoryFilter';
import { PizzaCard } from '../components/PizzaCard';
import { PizzaDetailModal } from '../components/PizzaDetailModal';
import { CustomerReviews } from '../components/CustomerReviews';
import { WhyChooseUs } from '../components/WhyChooseUs';
import { Pizza, Category } from '../types';
import { Sparkles, Utensils } from 'lucide-react';

interface HomeViewProps {
  pizzas: Pizza[];
  categories: Category[];
  loading: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({ pizzas, categories, loading }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlySpicy, setOnlySpicy] = useState<boolean>(false);
  const [onlyVeg, setOnlyVeg] = useState<boolean>(false);
  const [onlyFeatured, setOnlyFeatured] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('popular');
  const [detailPizza, setDetailPizza] = useState<Pizza | null>(null);

  // Filter and sort pizzas
  const filteredPizzas = useMemo(() => {
    let list = [...pizzas];

    if (selectedCategory && selectedCategory !== 'all') {
      list = list.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.ingredients.some(i => i.toLowerCase().includes(q))
      );
    }

    if (onlySpicy) {
      list = list.filter(p => p.isSpicy);
    }

    if (onlyVeg) {
      list = list.filter(p => p.isVeg);
    }

    if (onlyFeatured) {
      list = list.filter(p => p.featured);
    }

    // Sort
    if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === 'price-asc') {
      list.sort((a, b) => (a.prices?.Medium ?? 16.99) - (b.prices?.Medium ?? 16.99));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => (b.prices?.Medium ?? 16.99) - (a.prices?.Medium ?? 16.99));
    } else {
      // Default: featured first, then reviews count
      list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0));
    }

    return list;
  }, [pizzas, selectedCategory, searchQuery, onlySpicy, onlyVeg, onlyFeatured, sortBy]);

  const featuredPizzas = useMemo(() => {
    return pizzas.filter(p => p.featured);
  }, [pizzas]);

  const scrollToMenu = () => {
    const el = document.getElementById('menu-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">
      {/* Hero Section */}
      <Hero onOrderNowClick={scrollToMenu} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Special Offers Section */}
        <SpecialOffers />

        {/* Featured Pizzas / Best Sellers Showcase */}
        {selectedCategory === 'all' && !searchQuery && featuredPizzas.length > 0 && (
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-stone-900">
                    Town Best Sellers
                  </h3>
                  <p className="text-xs text-stone-500">The crowd favorites baked fresh every day</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredPizzas.slice(0, 4).map(pizza => (
                <PizzaCard
                  key={pizza.id}
                  pizza={pizza}
                  onOpenDetails={setDetailPizza}
                />
              ))}
            </div>
          </section>
        )}

        {/* Full Menu Section */}
        <section id="menu-section" className="space-y-6 pt-4 scroll-mt-24">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-100 text-red-700">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                Explore Our Artisan Menu
              </h2>
              <p className="text-xs text-stone-500">
                Handcrafted pizzas with 48h sourdough and authentic Italian ingredients
              </p>
            </div>
          </div>

          {/* Categories & Search */}
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onlySpicy={onlySpicy}
            setOnlySpicy={setOnlySpicy}
            onlyVeg={onlyVeg}
            setOnlyVeg={setOnlyVeg}
            onlyFeatured={onlyFeatured}
            setOnlyFeatured={setOnlyFeatured}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />

          {/* Pizza Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-80 rounded-2xl bg-stone-200/60 animate-pulse" />
              ))}
            </div>
          ) : filteredPizzas.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto text-xl">
                🔍
              </div>
              <h4 className="font-serif text-lg font-bold text-stone-800">No pizzas matched your search</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Try searching for different ingredients or clearing the dietary filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setOnlySpicy(false);
                  setOnlyVeg(false);
                  setOnlyFeatured(false);
                }}
                className="px-4 py-2 rounded-xl bg-red-700 text-white text-xs font-bold shadow hover:bg-red-800 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPizzas.map(pizza => (
                <PizzaCard
                  key={pizza.id}
                  pizza={pizza}
                  onOpenDetails={setDetailPizza}
                />
              ))}
            </div>
          )}
        </section>

        {/* Why Choose Pizza Town? */}
        <WhyChooseUs />

        {/* Customer Reviews */}
        <CustomerReviews />
      </div>

      {/* Detail & Customization Modal */}
      <PizzaDetailModal
        pizza={detailPizza}
        onClose={() => setDetailPizza(null)}
      />
    </div>
  );
};
