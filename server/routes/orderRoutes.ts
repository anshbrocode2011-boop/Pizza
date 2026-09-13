import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest, requireAdmin } from '../auth';
import { Order, OrderItem, OrderStatus, PizzaSize, PaymentMethod, PaymentStatus } from '../../src/types';

const router = Router();

// Server-Sent Events (SSE) clients list
interface SSEClient {
  id: string;
  res: Response;
  userId?: string;
  isAdmin: boolean;
}

let sseClients: SSEClient[] = [];

export function broadcastOrderEvent(event: {
  type: 'ORDER_CREATED' | 'ORDER_UPDATED' | 'ORDER_CANCELLED';
  order: Order;
  message: string;
}) {
  const dataString = `data: ${JSON.stringify(event)}\n\n`;
  sseClients.forEach(client => {
    // Send to admin, or to the customer who owns the order
    if (client.isAdmin || client.userId === event.order.userId) {
      try {
        client.res.write(dataString);
      } catch (err) {
        console.error('Error writing to SSE client:', err);
      }
    }
  });
}

// GET /api/orders/stream - Server-Sent Events
router.get('/stream', (req: AuthenticatedRequest, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newClient: SSEClient = {
    id: clientId,
    res,
    userId: req.user?.id,
    isAdmin: req.user?.role === 'admin',
  };

  sseClients.push(newClient);

  // Send initial handshake
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Connected to Pizza Town Live Stream' })}\n\n`);

  // Keep-alive ping every 25 seconds
  const interval = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(interval);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(interval);
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// GET /api/orders
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Please log in to view orders.' });
    return;
  }

  if (req.user.role === 'admin') {
    const orders = db.getOrders();
    res.json({ orders });
  } else {
    const orders = db.getOrdersByUserId(req.user.id);
    res.json({ orders });
  }
});

// GET /api/orders/:id
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const order = db.findOrderById(req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  // Ensure authorized (order owner or admin)
  if (req.user && req.user.role !== 'admin' && order.userId !== req.user.id) {
    res.status(403).json({ error: 'Access denied.' });
    return;
  }

  res.json({ order });
});

// POST /api/orders - Place Order
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items, deliveryAddress, paymentMethod = 'cod', promoCode, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Cannot place an order with an empty cart.' });
      return;
    }

    if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.fullName || !deliveryAddress.phone) {
      res.status(400).json({ error: 'Complete delivery address and contact information are required.' });
      return;
    }

    // SERVER-SIDE PRICE VALIDATION:
    // Look up each item from database, enforce verified pricing
    const validatedItems: OrderItem[] = [];
    let subtotal = 0;

    for (const rawItem of items) {
      const pizza = db.findPizzaById(rawItem.pizzaId);
      if (!pizza) {
        res.status(400).json({ error: `Pizza "${rawItem.pizzaName || 'item'}" is no longer available.` });
        return;
      }
      if (!pizza.available) {
        res.status(400).json({ error: `"${pizza.name}" is currently sold out.` });
        return;
      }

      const size: PizzaSize = (['Small', 'Medium', 'Large'].includes(rawItem.size) ? rawItem.size : 'Medium') as PizzaSize;
      const verifiedUnitPrice = pizza.prices[size] ?? 16.99;
      const quantity = Math.max(1, parseInt(rawItem.quantity, 10) || 1);
      const itemSubtotal = parseFloat((verifiedUnitPrice * quantity).toFixed(2));

      validatedItems.push({
        pizzaId: pizza.id,
        pizzaName: pizza.name,
        pizzaImage: pizza.image,
        size,
        quantity,
        unitPrice: verifiedUnitPrice,
        subtotal: itemSubtotal,
      });

      subtotal += itemSubtotal;
    }

    subtotal = parseFloat(subtotal.toFixed(2));

    // Calculate discount if promoCode applied
    let discount = 0;
    if (promoCode && typeof promoCode === 'string') {
      const code = promoCode.trim().toUpperCase();
      if (code === 'PIZZATOWN20') {
        discount = parseFloat((subtotal * 0.20).toFixed(2));
      } else if (code === 'PIZZA10' || code === 'FREESHIP') {
        discount = parseFloat((subtotal * 0.10).toFixed(2));
      }
    }

    const deliveryFee = subtotal >= 40 ? 0 : 3.99;
    const total = parseFloat(Math.max(0, subtotal - discount + deliveryFee).toFixed(2));

    const userId = req.user?.id || `guest-${Date.now()}`;
    const customerName = req.user?.name || deliveryAddress.fullName;
    const customerEmail = req.user?.email || 'guest@pizzatown.com';
    const customerPhone = req.user?.phone || deliveryAddress.phone;

    const orderNumber = Math.floor(1000 + Math.random() * 9000);
    const orderId = `PT-${orderNumber}`;

    const newOrder: Order = {
      id: orderId,
      userId,
      customerName,
      customerEmail,
      customerPhone,
      items: validatedItems,
      deliveryAddress: {
        id: `addr-${Date.now()}`,
        fullName: deliveryAddress.fullName,
        phone: deliveryAddress.phone,
        street: deliveryAddress.street,
        city: deliveryAddress.city || 'Springfield',
        state: deliveryAddress.state || 'IL',
        zipCode: deliveryAddress.zipCode || '62704',
        instructions: deliveryAddress.instructions || notes || '',
      },
      subtotal,
      deliveryFee,
      discount,
      total,
      paymentMethod: paymentMethod as PaymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed',
      orderStatus: 'Order Confirmed',
      estimatedDeliveryMinutes: 30,
      statusHistory: [
        {
          status: 'Order Confirmed',
          timestamp: new Date().toISOString(),
          note: 'Your order was received and confirmed by Pizza Town kitchen.',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const savedOrder = db.createOrder(newOrder);

    // Clear cart for the user
    db.clearCart(userId);

    // Broadcast SSE update
    broadcastOrderEvent({
      type: 'ORDER_CREATED',
      order: savedOrder,
      message: `New Order #${savedOrder.id} placed for $${savedOrder.total.toFixed(2)} 🍕`,
    });

    res.status(201).json({
      message: 'Your order has been placed successfully!',
      order: savedOrder,
    });
  } catch (error: any) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'Failed to place order.' });
  }
});

// PATCH /api/orders/:id/status - Admin only: Update Order Status
router.patch('/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, note } = req.body;
    const order = db.findOrderById(req.params.id);

    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const validStatuses: OrderStatus[] = [
      'Order Confirmed',
      'Preparing',
      'Out for Delivery',
      'Delivered',
      'Cancelled',
    ];

    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const updatedHistory = [...order.statusHistory];
    updatedHistory.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || getStatusDefaultNote(status),
    });

    let paymentStatus: PaymentStatus = order.paymentStatus;
    if (status === 'Delivered' && order.paymentMethod === 'cod') {
      paymentStatus = 'completed';
    } else if (status === 'Cancelled' && order.paymentStatus === 'completed') {
      paymentStatus = 'refunded';
    }

    const updatedOrder = db.updateOrder(order.id, {
      orderStatus: status,
      paymentStatus,
      statusHistory: updatedHistory,
      updatedAt: new Date().toISOString(),
    });

    if (updatedOrder) {
      broadcastOrderEvent({
        type: 'ORDER_UPDATED',
        order: updatedOrder,
        message: getNotificationMessage(status, updatedOrder.id),
      });
    }

    res.json({ message: `Order status updated to ${status}`, order: updatedOrder });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

// PATCH /api/orders/:id/cancel - User or Admin: Cancel Order
router.patch('/:id/cancel', (req: AuthenticatedRequest, res: Response) => {
  const order = db.findOrderById(req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  const isAdmin = req.user?.role === 'admin';
  const isOwner = req.user && req.user.id === order.userId;

  if (!isAdmin && !isOwner) {
    res.status(403).json({ error: 'You are not authorized to cancel this order.' });
    return;
  }

  // If customer, can only cancel if still "Order Confirmed"
  if (!isAdmin && order.orderStatus !== 'Order Confirmed') {
    res.status(400).json({
      error: 'This order is already being prepared or out for delivery and cannot be cancelled automatically. Please call our store.',
    });
    return;
  }

  const updatedHistory = [...order.statusHistory];
  updatedHistory.push({
    status: 'Cancelled',
    timestamp: new Date().toISOString(),
    note: isAdmin ? 'Order cancelled by restaurant manager.' : 'Order cancelled by customer.',
  });

  const updatedOrder = db.updateOrder(order.id, {
    orderStatus: 'Cancelled',
    paymentStatus: order.paymentStatus === 'completed' ? 'refunded' : 'pending',
    statusHistory: updatedHistory,
    updatedAt: new Date().toISOString(),
  });

  if (updatedOrder) {
    broadcastOrderEvent({
      type: 'ORDER_CANCELLED',
      order: updatedOrder,
      message: `Order #${updatedOrder.id} has been cancelled.`,
    });
  }

  res.json({ message: 'Order has been cancelled.', order: updatedOrder });
});

function getStatusDefaultNote(status: OrderStatus): string {
  switch (status) {
    case 'Preparing':
      return 'Artisan crust stretched, premium toppings layered and baking in stone oven.';
    case 'Out for Delivery':
      return 'Dispatched in insulated thermal carrier with our delivery driver.';
    case 'Delivered':
      return 'Delivered piping hot. Buon appetito!';
    case 'Cancelled':
      return 'Order cancelled.';
    default:
      return 'Order update.';
  }
}

function getNotificationMessage(status: OrderStatus, orderId: string): string {
  switch (status) {
    case 'Preparing':
      return `Your Pizza Town order #${orderId} is now being prepared 🍕`;
    case 'Out for Delivery':
      return `Hot & fresh! Order #${orderId} is out for delivery 🛵`;
    case 'Delivered':
      return `Order #${orderId} has been delivered. Enjoy your meal! 🎉`;
    case 'Cancelled':
      return `Order #${orderId} has been cancelled.`;
    default:
      return `Order #${orderId} status updated to ${status}.`;
  }
}

export default router;
