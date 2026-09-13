import React from 'react';
import { Flame, Clock, Award, ArrowRight, Sparkles } from 'lucide-react';

interface HeroProps {
  onOrderNowClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOrderNowClick }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 text-white pt-10 pb-16 sm:pt-14 sm:pb-24 border-b border-stone-800">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-700/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 text-center lg:text-left">
            {/* Tag badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/80 border border-red-800/60 text-amber-300 text-xs font-bold uppercase tracking-wider mb-6 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Authentic Stone Oven Pizzeria</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15] mb-5">
              Fresh Pizza. <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-red-400 to-amber-200">
                Happy Moments.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-stone-300 font-medium max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
              Hot, cheesy and freshly made just for you. Hand-stretched sourdough, slow-simmered San Marzano tomatoes, and melted buffalo mozzarella baked in our 800°F woodfired oven.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <button
                id="hero-order-now-btn"
                onClick={onOrderNowClick}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-base shadow-xl shadow-red-950/50 flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 group"
              >
                <span>Order Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="flex items-center gap-2 text-stone-400 text-sm font-medium px-2 py-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Stone oven currently hot & baking</span>
              </div>
            </div>

            {/* Value Props Row */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-6 border-t border-stone-800/80 max-w-lg mx-auto lg:mx-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-red-950/60 border border-red-800/50 flex items-center justify-center text-red-400 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white leading-tight">30 Mins</p>
                  <p className="text-[11px] text-stone-400">Fast Delivery</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-950/60 border border-amber-800/50 flex items-center justify-center text-amber-400 shrink-0">
                  <Flame className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white leading-tight">800°F Fire</p>
                  <p className="text-[11px] text-stone-400">Stone Baked</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-stone-800/80 border border-stone-700/60 flex items-center justify-center text-amber-300 shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white leading-tight">4.9 Stars</p>
                  <p className="text-[11px] text-stone-400">Top Rated</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Hero Image Column */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full max-w-md aspect-square rounded-3xl p-3 bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950 border border-stone-700/60 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&auto=format&fit=crop&q=80"
                alt="Artisan Woodfire Pizza"
                className="w-full h-full object-cover rounded-2xl shadow-inner transform hover:scale-[1.02] transition-transform duration-500"
              />

              {/* Floating Chef Special badge */}
              <div className="absolute -bottom-4 -left-4 bg-stone-900/95 border border-amber-500/40 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg">
                  🍕
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-amber-300 font-bold">Chef's Signature</p>
                  <p className="text-xs font-semibold text-stone-200">Truffle Pepperoni Supreme</p>
                </div>
              </div>

              {/* Floating Free Delivery badge */}
              <div className="absolute -top-3 -right-3 bg-red-700 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg border border-red-500/50 animate-bounce">
                FREE DELIVERY OVER $40
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
