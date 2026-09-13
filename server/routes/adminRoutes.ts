import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest, requireAdmin } from '../auth';
import { AdminStats } from '../../src/types';

const router = Router();

// GET /api/admin/stats
router.get('/stats', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const orders = db.getOrders();
  const users = db.getUsers().filter(u => u.role === 'customer');

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const todayOrders = orders.filter(o => new Date(o.createdAt).getTime() >= todayStart);
  const totalRevenue = parseFloat(
    orders
      .filter(o => o.orderStatus !== 'Cancelled')
      .reduce((sum, o) => sum + o.total, 0)
      .toFixed(2)
  );

  // Calculate popular pizzas
  const pizzaMap: Record<string, { name: string; count: number; revenue: number; image: string }> = {};
  orders.forEach(order => {
    if (order.orderStatus !== 'Cancelled') {
      order.items.forEach(item => {
        if (!pizzaMap[item.pizzaId]) {
          pizzaMap[item.pizzaId] = {
            name: item.pizzaName,
            count: 0,
            revenue: 0,
            image: item.pizzaImage,
          };
        }
        pizzaMap[item.pizzaId].count += item.quantity;
        pizzaMap[item.pizzaId].revenue += item.subtotal;
      });
    }
  });

  const popularPizzas = Object.entries(pizzaMap)
    .map(([pizzaId, data]) => ({
      pizzaId,
      name: data.name,
      orderCount: data.count,
      revenue: parseFloat(data.revenue.toFixed(2)),
      image: data.image,
    }))
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 5);

  const stats: AdminStats = {
    totalOrders: orders.length,
    todayOrders: todayOrders.length,
    totalRevenue,
    totalCustomers: users.length,
    popularPizzas,
    recentOrders: orders.slice(0, 8),
  };

  res.json({ stats });
});

// GET /api/admin/customers
router.get('/customers', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const users = db.getUsers();
  const orders = db.getOrders();

  const customers = users.map(u => {
    const userOrders = orders.filter(o => o.userId === u.id);
    const totalSpent = userOrders
      .filter(o => o.orderStatus !== 'Cancelled')
      .reduce((sum, o) => sum + o.total, 0);

    const { passwordHash: _, ...safeUser } = u;
    return {
      ...safeUser,
      ordersCount: userOrders.length,
      totalSpent: parseFloat(totalSpent.toFixed(2)),
      lastOrderDate: userOrders[0]?.createdAt || null,
    };
  });

  res.json({ customers });
});

// GET /api/admin/reviews
router.get('/reviews', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const reviews = db.getAllReviews();
  const reviewsWithPizza = reviews.map(r => {
    const pizza = db.findPizzaById(r.pizzaId);
    return {
      ...r,
      pizzaName: pizza ? pizza.name : 'Unknown Pizza',
      pizzaImage: pizza ? pizza.image : '',
    };
  });
  res.json({ reviews: reviewsWithPizza });
});

export default router;
