import { Router, Request, Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest, requireAuth, requireAdmin } from '../auth';
import { Review } from '../../src/types';

const router = Router();

// GET /api/reviews/pizza/:id
router.get('/pizza/:id', (req: Request, res: Response) => {
  const reviews = db.getReviewsByPizzaId(req.params.id);
  res.json({ reviews });
});

// POST /api/reviews/pizza/:id
router.post('/pizza/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const pizzaId = req.params.id;
    const pizza = db.findPizzaById(pizzaId);

    if (!pizza) {
      res.status(404).json({ error: 'Pizza not found.' });
      return;
    }

    const { rating, comment } = req.body;
    const numRating = Math.min(5, Math.max(1, Number(rating) || 5));

    if (!comment || typeof comment !== 'string' || comment.trim().length < 3) {
      res.status(400).json({ error: 'Please enter a review comment (minimum 3 characters).' });
      return;
    }

    const newReview: Review = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: req.user!.id,
      userName: req.user!.name,
      userAvatar: req.user!.profileImage,
      pizzaId,
      rating: numRating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    const saved = db.addReview(newReview);
    res.status(201).json({ message: 'Thank you for your review!', review: saved });
  } catch (error: any) {
    console.error('Error adding review:', error);
    res.status(500).json({ error: 'Failed to post review.' });
  }
});

// DELETE /api/reviews/:id (Admin only)
router.delete('/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteReview(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Review not found.' });
    return;
  }
  res.json({ message: 'Review removed by administrator.' });
});

export default router;
