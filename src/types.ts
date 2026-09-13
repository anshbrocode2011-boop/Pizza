export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  role: UserRole;
  createdAt: string;
}

export type PizzaSize = 'Small' | 'Medium' | 'Large';

export interface PizzaPrices {
  Small: number;
  Medium: number;
  Large: number;
  [key: string]: number;
}

export interface Pizza {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  rating: number;
  reviewsCount: number;
  sizes: PizzaSize[];
  prices: PizzaPrices;
  ingredients: string[];
  available: boolean;
  featured: boolean;
  isSpicy?: boolean;
  isVeg?: boolean;
  calories?: number;
  prepTimeMinutes?: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  description?: string;
}

export interface CartItem {
  id: string;
  pizzaId: string;
  name: string;
  image: string;
  size: PizzaSize;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Cart {
  id?: string;
  userId?: string;
  items: CartItem[];
  quantity: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  updatedAt?: string;
}

export type OrderStatus =
  | 'Order Confirmed'
  | 'Preparing'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMethod = 'cod' | 'online' | 'stripe';
export type PaymentStatus = 'pending' | 'completed' | 'refunded';

export interface Address {
  id: string;
  userId?: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  instructions?: string;
  isDefault?: boolean;
}

export interface OrderItem {
  pizzaId: string;
  pizzaName: string;
  pizzaImage: string;
  size: PizzaSize;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  deliveryAddress: Address;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  estimatedDeliveryMinutes: number;
  statusHistory: OrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  pizzaId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface AdminStats {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  popularPizzas: {
    pizzaId: string;
    name: string;
    orderCount: number;
    revenue: number;
    image: string;
  }[];
  recentOrders: Order[];
}
