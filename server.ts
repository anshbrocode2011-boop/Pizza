import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

// Initialize auth middleware & routes
import { db } from './server/db';
import { authMiddleware } from './server/auth';
import authRoutes from './server/routes/authRoutes';
import pizzaRoutes from './server/routes/pizzaRoutes';
import cartRoutes from './server/routes/cartRoutes';
import orderRoutes from './server/routes/orderRoutes';
import profileRoutes from './server/routes/profileRoutes';
import reviewRoutes from './server/routes/reviewRoutes';
import adminRoutes from './server/routes/adminRoutes';
import paymentRoutes from './server/routes/paymentRoutes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic security and parsing middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Security headers & simple API rate limit tracker
  const requestCounts = new Map<string, { count: number; resetTime: number }>();
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Rate limiting for API requests (120 req / min per IP)
    if (req.path.startsWith('/api/')) {
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      const client = requestCounts.get(ip);

      if (!client || now > client.resetTime) {
        requestCounts.set(ip, { count: 1, resetTime: now + 60000 });
      } else {
        client.count++;
        if (client.count > 150) {
          res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
          return;
        }
      }
    }

    next();
  });

  // Extract user if auth cookie or Bearer token is present
  app.use(authMiddleware);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Pizza Town API',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API endpoints
  app.get('/api/categories', (_req, res) => {
    res.json({ categories: db.getCategories() });
  });
  app.use('/api/auth', authRoutes);
  app.use('/api/pizzas', pizzaRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/payments', paymentRoutes);

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🍕 Pizza Town server listening on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal error launching server:', err);
  process.exit(1);
});
