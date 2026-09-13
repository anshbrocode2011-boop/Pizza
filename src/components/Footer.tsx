import React from 'react';
import { Phone, MapPin, Clock, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onNavigateTab: (tab: 'home' | 'profile' | 'orders' | 'admin') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateTab }) => {
  return (
    <footer className="bg-stone-950 text-stone-300 border-t border-stone-800 pt-12 pb-24 md:pb-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍕</span>
              <span className="font-serif text-xl font-bold text-white tracking-wide">Pizza Town</span>
            </div>
            <p className="text-stone-400 leading-relaxed">
              Authentic artisanal Italian pizzas hand-crafted with 48-hour cold-fermented sourdough and baked in our 800°F stone oven.
            </p>
            <div className="flex items-center gap-2 text-stone-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Certified D.O.P. San Marzano & Fior di Latte</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">Explore</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigateTab('home')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Artisan Pizza Menu
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('orders')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Live Order Tracker
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('profile')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Customer Account & Addresses
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('admin')}
                  className="hover:text-amber-400 transition-colors text-amber-300/80 font-semibold"
                >
                  Kitchen Dispatch Admin
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Hours */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">Stone Oven Hours</h4>
            <div className="space-y-1.5 text-stone-400">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-stone-200">Monday - Thursday</p>
                  <p>11:00 AM – 10:30 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-2 pt-1">
                <Clock className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-stone-200">Friday - Sunday</p>
                  <p>11:00 AM – 11:30 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Col 4: Contact & Location */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">Pizzeria Location</h4>
            <div className="space-y-2 text-stone-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p>142 Crust & Hearth Ave, Little Italy, Springfield, IL 62704</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <p>+1 (555) PIZZA-TOWN (749-9286)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-400 text-[11px]">
          <p>© {new Date().getFullYear()} Pizza Town Inc. All rights reserved. Fresh Pizza. Happy Moments.</p>
          <div className="flex items-center gap-1 text-stone-400">
            <span>Baked with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>in woodfire stone ovens</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
