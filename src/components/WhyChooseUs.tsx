import React from 'react';
import { Flame, Sparkles, HeartHandshake, ShieldCheck } from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  const pillars = [
    {
      icon: Flame,
      title: '800°F Italian Stone Oven',
      description: 'Our imported stone deck oven seals in moisture while producing blistered, airy leopard-spotted crust in under 90 seconds.',
      accent: 'text-red-600 bg-red-50 border-red-200',
    },
    {
      icon: Sparkles,
      title: '48-Hour Cold Fermentation',
      description: 'Slow, natural sourdough fermentation creates deep flavor, incredible airy texture, and effortless digestion.',
      accent: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      icon: HeartHandshake,
      title: 'Farm-Fresh Heritage Toppings',
      description: 'D.O.P. certified San Marzano tomatoes, fresh local buffalo mozzarella, and aged charcuterie sliced fresh daily.',
      accent: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      icon: ShieldCheck,
      title: 'Insulated Thermal Delivery',
      description: 'Dispatched in heated thermal boxes right out of the fire so your crust stays crisp and cheese stays molten.',
      accent: 'text-blue-600 bg-blue-50 border-blue-200',
    },
  ];

  return (
    <section className="bg-gradient-to-b from-stone-900 to-stone-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-stone-800">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <span className="text-amber-400 text-xs uppercase font-bold tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          The Pizza Town Craft
        </span>
        <h3 className="font-serif text-2xl sm:text-4xl font-bold text-white mt-3">
          Why Choose Pizza Town?
        </h3>
        <p className="text-stone-400 text-sm mt-2">
          We honor centuries of Italian baking traditions with modern culinary innovation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {pillars.map((pillar, idx) => {
          const Icon = pillar.icon;
          return (
            <div
              key={idx}
              className="bg-stone-900/80 p-6 rounded-2xl border border-stone-800 hover:border-stone-700 transition-colors flex flex-col items-start"
            >
              <div className={`p-3 rounded-xl border mb-4 ${pillar.accent}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-white mb-2">{pillar.title}</h4>
              <p className="text-xs text-stone-400 leading-relaxed">{pillar.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
