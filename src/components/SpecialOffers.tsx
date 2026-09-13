import React from 'react';
import { Tag, Sparkles, Copy, Check } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export const SpecialOffers: React.FC = () => {
  const { showToast } = useNotification();
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const offers = [
    {
      id: 'offer-1',
      title: 'Grand Opening Feast',
      discount: '20% OFF',
      code: 'PIZZATOWN20',
      description: 'Get 20% off your entire order on any 2 or more artisan pizzas.',
      bgGradient: 'from-red-900 to-stone-900',
      tag: 'Limited Time',
    },
    {
      id: 'offer-2',
      title: 'Free Express Delivery',
      discount: '$0 Delivery',
      code: 'FREESHIP',
      description: 'Zero delivery fee applied automatically on all orders over $40.',
      bgGradient: 'from-amber-950 to-stone-900',
      tag: 'Popular',
    },
    {
      id: 'offer-3',
      title: 'Family Feast Combo',
      discount: '10% OFF',
      code: 'PIZZA10',
      description: 'Save 10% on your mid-week cravings with quick checkout.',
      bgGradient: 'from-stone-900 to-red-950',
      tag: 'Everyday Deal',
    },
  ];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast('Promo Code Copied!', `Applied ${code} to your clipboard`, 'info', 2500);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-100 text-red-700">
            <Tag className="w-4 h-4" />
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">Special Offers & Deals</h3>
        </div>
        <span className="text-xs text-stone-500 font-medium hidden sm:inline">Tap to copy voucher code</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {offers.map(offer => (
          <div
            key={offer.id}
            className={`relative rounded-2xl p-5 text-white bg-gradient-to-br ${offer.bgGradient} border border-stone-800 shadow-lg flex flex-col justify-between overflow-hidden group`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full bg-white/20 text-amber-300">
                  {offer.tag}
                </span>
                <span className="text-lg font-black text-amber-400">{offer.discount}</span>
              </div>

              <h4 className="font-serif text-lg font-bold text-white mb-1">{offer.title}</h4>
              <p className="text-xs text-stone-300 leading-relaxed mb-4">{offer.description}</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-200 bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                <span>{offer.code}</span>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(offer.code)}
                className="flex items-center gap-1 text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
              >
                {copiedCode === offer.code ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
