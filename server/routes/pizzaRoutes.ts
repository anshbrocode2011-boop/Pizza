import { Router, Request, Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest, requireAdmin } from '../auth';
import { Pizza } from '../../src/types';

const router = Router();

// GET /api/pizzas/categories
router.get('/categories', (_req: Request, res: Response) => {
  res.json({ categories: db.getCategories() });
});

// GET /api/pizzas
router.get('/', (req: Request, res: Response) => {
  const { category, search, featured, available } = req.query;
  let pizzas = db.getPizzas();

  if (category && category !== 'all') {
    pizzas = pizzas.filter(p => p.category.toLowerCase() === (category as string).toLowerCase());
  }

  if (featured === 'true') {
    pizzas = pizzas.filter(p => p.featured);
  }

  if (available === 'true') {
    pizzas = pizzas.filter(p => p.available);
  }

  if (search && typeof search === 'string' && search.trim()) {
    const term = search.trim().toLowerCase();
    pizzas = pizzas.filter(
      p =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.ingredients.some(ing => ing.toLowerCase().includes(term))
    );
  }

  res.json({ pizzas, count: pizzas.length });
});

// GET /api/pizzas/:id
router.get('/:id', (req: Request, res: Response) => {
  const pizza = db.findPizzaById(req.params.id);
  if (!pizza) {
    res.status(404).json({ error: 'Pizza not found.' });
    return;
  }
  const reviews = db.getReviewsByPizzaId(pizza.id);
  res.json({ pizza, reviews });
});

// POST /api/pizzas (Admin only)
router.post('/', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, image, category, sizes, prices, ingredients, available, featured, isSpicy, isVeg, prepTimeMinutes, calories } = req.body;

    if (!name || !description || !image || !category || !prices) {
      res.status(400).json({ error: 'Missing required pizza attributes (name, description, image, category, prices).' });
      return;
    }

    const newPizza: Pizza = {
      id: `pizza-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      description: description.trim(),
      image: image.trim(),
      category: category.toLowerCase().trim(),
      rating: 5.0,
      reviewsCount: 0,
      sizes: Array.isArray(sizes) && sizes.length ? sizes : ['Small', 'Medium', 'Large'],
      prices: {
        Small: Number(prices.Small) || 12.99,
        Medium: Number(prices.Medium) || 16.99,
        Large: Number(prices.Large) || 20.99,
      },
      ingredients: Array.isArray(ingredients) ? ingredients : (ingredients ? ingredients.split(',').map((s: string) => s.trim()) : []),
      available: available !== undefined ? Boolean(available) : true,
      featured: Boolean(featured),
      isSpicy: Boolean(isSpicy),
      isVeg: Boolean(isVeg),
      prepTimeMinutes: prepTimeMinutes ? Number(prepTimeMinutes) : 20,
      calories: calories ? Number(calories) : 800,
      createdAt: new Date().toISOString(),
    };

    const saved = db.createPizza(newPizza);
    res.status(201).json({ message: 'Pizza added successfully!', pizza: saved });
  } catch (error: any) {
    console.error('Error creating pizza:', error);
    res.status(500).json({ error: 'Failed to create pizza.' });
  }
});

// PUT /api/pizzas/:id (Admin only)
router.put('/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const pizzaId = req.params.id;
    const existing = db.findPizzaById(pizzaId);
    if (!existing) {
      res.status(404).json({ error: 'Pizza not found.' });
      return;
    }

    const updates = req.body;
    if (updates.prices) {
      updates.prices = {
        Small: Number(updates.prices.Small) || existing.prices.Small,
        Medium: Number(updates.prices.Medium) || existing.prices.Medium,
        Large: Number(updates.prices.Large) || existing.prices.Large,
      };
    }

    const updated = db.updatePizza(pizzaId, updates);
    res.json({ message: 'Pizza updated successfully!', pizza: updated });
  } catch (error: any) {
    console.error('Error updating pizza:', error);
    res.status(500).json({ error: 'Failed to update pizza.' });
  }
});

// DELETE /api/pizzas/:id (Admin only)
router.delete('/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deletePizza(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Pizza not found.' });
    return;
  }
  res.json({ message: 'Pizza removed from menu successfully.' });
});

export default router;
