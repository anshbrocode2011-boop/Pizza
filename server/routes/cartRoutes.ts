import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest } from '../auth';
import { Cart, CartItem, PizzaSize } from '../../src/types';

const router = Router();

// Helper to determine active user ID or guest identifier
function getCartOwnerId(req: AuthenticatedRequest): string {
  if (req.user?.id) {
    return req.user.id;
  }
  const guestHeader = req.headers['x-guest-id'] as string;
  if (guestHeader && typeof guestHeader === 'string' && guestHeader.trim()) {
    return `guest-${guestHeader.trim()}`;
  }
  return 'guest-default';
}

function calculateCartTotals(items: CartItem[]): {
  quantity: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
} {
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = parseFloat(
    items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2)
  );
  // Free delivery over $40, otherwise $3.99 delivery fee if cart is not empty
  const deliveryFee = items.length === 0 ? 0 : subtotal >= 40 ? 0 : 3.99;
  const total = parseFloat((subtotal + deliveryFee).toFixed(2));

  return { quantity, subtotal, deliveryFee, total };
}

// GET /api/cart
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = getCartOwnerId(req);
  const cart = db.getCart(userId);

  // Recalculate with fresh pizza prices in case prices changed
  let modified = false;
  const verifiedItems: CartItem[] = [];

  for (const item of cart.items) {
    const pizza = db.findPizzaById(item.pizzaId);
    if (pizza && pizza.available) {
      const realUnitPrice = pizza.prices[item.size] ?? Object.values(pizza.prices)[0] ?? 14.99;
      if (item.unitPrice !== realUnitPrice || item.name !== pizza.name) {
        item.unitPrice = realUnitPrice;
        item.name = pizza.name;
        item.image = pizza.image;
        modified = true;
      }
      item.totalPrice = parseFloat((item.unitPrice * item.quantity).toFixed(2));
      verifiedItems.push(item);
    } else {
      // Pizza is deleted or unavailable, omit
      modified = true;
    }
  }

  const totals = calculateCartTotals(verifiedItems);
  const updatedCart: Cart = {
    userId,
    items: verifiedItems,
    ...totals,
    updatedAt: new Date().toISOString(),
  };

  if (modified) {
    db.saveCart(userId, updatedCart);
  }

  res.json({ cart: updatedCart });
});

// POST /api/cart - Add item
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getCartOwnerId(req);
    const { pizzaId, size = 'Medium', quantity = 1 } = req.body;

    if (!pizzaId) {
      res.status(400).json({ error: 'Pizza ID is required.' });
      return;
    }

    const pizza = db.findPizzaById(pizzaId);
    if (!pizza) {
      res.status(404).json({ error: 'Selected pizza was not found.' });
      return;
    }

    if (!pizza.available) {
      res.status(400).json({ error: 'This pizza is currently unavailable.' });
      return;
    }

    const validSize: PizzaSize = (['Small', 'Medium', 'Large'].includes(size) ? size : 'Medium') as PizzaSize;
    // Server-side price lookup - NEVER trust frontend price
    const unitPrice = pizza.prices[validSize] ?? 16.99;
    const addQty = Math.max(1, parseInt(quantity, 10) || 1);

    const cart = db.getCart(userId);
    const existingItemIndex = cart.items.findIndex(
      i => i.pizzaId === pizzaId && i.size === validSize
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += addQty;
      cart.items[existingItemIndex].totalPrice = parseFloat(
        (cart.items[existingItemIndex].unitPrice * cart.items[existingItemIndex].quantity).toFixed(2)
      );
    } else {
      const newItem: CartItem = {
        id: `cart-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        pizzaId: pizza.id,
        name: pizza.name,
        image: pizza.image,
        size: validSize,
        unitPrice,
        quantity: addQty,
        totalPrice: parseFloat((unitPrice * addQty).toFixed(2)),
      };
      cart.items.push(newItem);
    }

    const totals = calculateCartTotals(cart.items);
    const updatedCart: Cart = {
      userId,
      items: cart.items,
      ...totals,
      updatedAt: new Date().toISOString(),
    };

    db.saveCart(userId, updatedCart);
    res.json({ message: `${pizza.name} (${validSize}) added to cart!`, cart: updatedCart });
  } catch (error: any) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add item to cart.' });
  }
});

// PUT /api/cart/:itemId - Update item quantity/size
router.put('/:itemId', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getCartOwnerId(req);
    const { itemId } = req.params;
    const { quantity, size } = req.body;

    const cart = db.getCart(userId);
    const itemIndex = cart.items.findIndex(i => i.id === itemId);

    if (itemIndex === -1) {
      res.status(404).json({ error: 'Cart item not found.' });
      return;
    }

    const item = cart.items[itemIndex];
    const pizza = db.findPizzaById(item.pizzaId);

    if (size && ['Small', 'Medium', 'Large'].includes(size) && size !== item.size) {
      item.size = size as PizzaSize;
      if (pizza) {
        item.unitPrice = pizza.prices[item.size] ?? item.unitPrice;
      }
    }

    if (quantity !== undefined) {
      const newQty = parseInt(quantity, 10);
      if (newQty <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        item.quantity = newQty;
        item.totalPrice = parseFloat((item.unitPrice * newQty).toFixed(2));
      }
    }

    const totals = calculateCartTotals(cart.items);
    const updatedCart: Cart = {
      userId,
      items: cart.items,
      ...totals,
      updatedAt: new Date().toISOString(),
    };

    db.saveCart(userId, updatedCart);
    res.json({ cart: updatedCart });
  } catch (error: any) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ error: 'Failed to update cart.' });
  }
});

// DELETE /api/cart/:itemId - Remove single item
router.delete('/:itemId', (req: AuthenticatedRequest, res: Response) => {
  const userId = getCartOwnerId(req);
  const { itemId } = req.params;

  const cart = db.getCart(userId);
  cart.items = cart.items.filter(i => i.id !== itemId);

  const totals = calculateCartTotals(cart.items);
  const updatedCart: Cart = {
    userId,
    items: cart.items,
    ...totals,
    updatedAt: new Date().toISOString(),
  };

  db.saveCart(userId, updatedCart);
  res.json({ message: 'Item removed from cart.', cart: updatedCart });
});

// DELETE /api/cart - Clear cart
router.delete('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = getCartOwnerId(req);
  const cart = db.clearCart(userId);
  res.json({ message: 'Cart cleared.', cart });
});

export default router;
