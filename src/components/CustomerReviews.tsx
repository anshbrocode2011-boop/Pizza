import React from 'react';
import { Star, MessageSquareQuote } from 'lucide-react';

export const CustomerReviews: React.FC = () => {
  const testimonials = [
    {
      id: '1',
      name: 'Elena Rostova',
      location: 'Downtown District',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      rating: 5,
      comment: 'Hands down the best pizza in town! The Truffle Pepperoni with hot honey blew my mind. Arrived piping hot with a bubbly, blistered crust.',
      favorite: 'Truffle Pepperoni Supreme',
    },
    {
      id: '2',
      name: 'David Kelling',
      location: 'North Hill',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      rating: 5,
      comment: 'You can immediately tell the sourdough crust undergoes a long cold ferment. Incredibly light, easy to digest, and topped with legitimate San Marzano tomatoes.',
      favorite: 'Margherita Royale',
    },
    {
      id: '3',
      name: 'Samantha Myers',
      location: 'West Riverside',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      rating: 5,
      comment: 'Delivery was under 25 minutes on a Friday night! The live status tracker kept us updated every step from stone oven to our doorstep.',
      favorite: 'Garden Harvest Burrata',
    },
  ];

  return (
    <section className="space-y-6">
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold uppercase tracking-wider mb-2">
          <MessageSquareQuote className="w-3.5 h-3.5" />
          <span>Real Customer Feedback</span>
        </div>
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
          Loved by Pizza Enthusiasts
        </h3>
        <p className="text-stone-600 text-sm mt-2">
          Over 10,000+ hand-crafted pies baked and delivered with 4.9 average customer satisfaction.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {testimonials.map(t => (
          <div
            key={t.id}
            className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              {/* Stars */}
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-stone-700 text-sm italic leading-relaxed mb-6">
                "{t.comment}"
              </p>
            </div>

            <div className="pt-4 border-t border-stone-100 flex items-center gap-3">
              <img
                src={t.avatar}
                alt={t.name}
                className="w-10 h-10 rounded-full object-cover border border-amber-500/30"
              />
              <div>
                <h5 className="font-bold text-sm text-stone-900">{t.name}</h5>
                <p className="text-xs text-stone-400">{t.location} • Fav: {t.favorite}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
