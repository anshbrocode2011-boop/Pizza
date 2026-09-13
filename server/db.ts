import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Pizza, Category, Cart, Order, Review, Address } from '../src/types';

interface DBUser extends User {
  passwordHash: string;
}

interface DatabaseSchema {
  users: DBUser[];
  pizzas: Pizza[];
  categories: Category[];
  carts: Record<string, Cart>; // keyed by userId
  orders: Order[];
  reviews: Review[];
  addresses: Address[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SEED_CATEGORIES: Category[] = [
  { id: 'all', name: 'All Pizzas', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=120&auto=format&fit=crop&q=80', description: 'Our full artisan oven menu' },
  { id: 'classic', name: 'Classic Italian', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=120&auto=format&fit=crop&q=80', description: 'Traditional Neapolitan recipes' },
  { id: 'specialty', name: 'Town Specialties', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=120&auto=format&fit=crop&q=80', description: 'Chef crafted gourmet combinations' },
  { id: 'spicy', name: 'Spicy & Bold', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=120&auto=format&fit=crop&q=80', description: 'Infused with chili oil & nduja' },
  { id: 'vegetarian', name: 'Garden Veggie', image: 'https://images.unsplash.com/photo-1576458088443-04a19bb13da6?w=120&auto=format&fit=crop&q=80', description: 'Fresh vegetables and artisanal cheeses' },
  { id: 'sweet', name: 'Sweet & Calzones', image: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=120&auto=format&fit=crop&q=80', description: 'Folded crusts and dessert delights' },
];

const SEED_PIZZAS: Pizza[] = [
  {
    id: 'pizza-1',
    name: 'Margherita Royale',
    description: 'Neapolitan classic with sweet San Marzano tomato sauce, fresh buffalo mozzarella, fresh basil, and extra virgin olive oil.',
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&auto=format&fit=crop&q=80',
    category: 'classic',
    rating: 4.9,
    reviewsCount: 142,
    sizes: ['Small', 'Medium', 'Large'],
    prices: { Small: 13.99, Medium: 17.99, Large: 21.99 },
    ingredients: ['San Marzano Tomatoes', 'Buffalo Mozzarella', 'Fresh Basil', 'EVOO', 'Sea Salt'],
    available: true,
    featured: true,
    isVeg: true,
    calories: 780,
    prepTimeMinutes: 18,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pizza-2',
    name: 'Truffle Pepperoni Supreme',
    description: 'Double-cured crispy pepperoni cups layered over smoked provolone, finished with white truffle oil and spicy hot honey drizzle.',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&auto=format&fit=crop&q=80',
    category: 'specialty',
    rating: 5.0,
    reviewsCount: 218,
    sizes: ['Small', 'Medium', 'Large'],
    prices: { Small: 16.49, Medium: 20.99, Large: 25.49 },
    ingredients: ['Aged Pepperoni', 'Smoked Provolone', 'White Truffle Oil', 'Calabrian Hot Honey', 'Fresh Mozzarella'],
    available: true,
    featured: true,
    isSpicy: true,
    calories: 980,
    prepTimeMinutes: 20,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pizza-3',
    name: 'Quattro Formaggi Bianca',
    description: 'Velvety garlic cream base topped with gorgonzola dolce, fontina, fior di latte, aged pecorino, toasted walnuts, and fresh rosemary.',
    image: 'https://images.unsplash.com/photo-1573821663912-569905455b1c?w=800&auto=format&fit=crop&q=80',
    category: 'classic',
    rating: 4.8,
    reviewsCount: 95,
    sizes: ['Small', 'Medium', 'Large'],
    prices: { Small: 15.99, Medium: 19.99, Large: 23.99 },
    ingredients: ['Gorgonzola Dolce', 'Fontina', 'Fior di Latte', 'Pecorino Romano', 'Toasted Walnuts', 'Rosemary'],
    available: true,
    featured: false,
    isVeg: true,
    calories: 920,
    prepTimeMinutes: 20,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pizza-4',
    name: 'Smoky BBQ Woodfire Chicken',
    description: 'Tender pulled herb chicken breast, thick applewood smoked bacon, caramelized red onions, smoked gouda, and craft bourbon BBQ sauce.',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80',
    category: 'specialty',
    rating: 4.9,
    reviewsCount: 164,
    sizes: ['Small', 'Medium', 'Large'],
    prices: { Small: 16.99, Medium: 21.49, Large: 25.99 },
    ingredients: ['Woodfire Chicken', 'Applewood Bacon', 'Caramelized Onions', 'Smoked Gouda', 'Bourbon BBQ Sauce', 'Cilantro'],
    available: true,
    featured: true,
    calories: 940,
    prepTimeMinutes: 22,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pizza-5',
    name: 'Spicy Calabrian Diavola',
    description: 'Spicy spreadable Nduja sausage, hot soppressata, fiery Calabrian red chili peppers, fresh mozzarella, and aromatic wild oregano.',
    image: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=800&auto=format&fit=crop&q=80',
    category: 'spicy',
    rating: 4.8,
    reviewsCount: 112,
    sizes: ['Small', 'Medium', 'Large'],
    prices: { Small: 15.99, Medium: 20.49, Large: 24.99 },
    ingredients: ['Calabrian Nduja', 'Hot Soppressata', 'Calabrian Chilis', 'Fior di Latte', 'Oregano', 'Chili Flakes'],
    available: true,
    featured: false,
    isSpicy: true,
    calories: 910,
    prepTimeMinutes: 19,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pizza-6',
    name: 'Garden Harvest Burrata',
    description: 'Crisp sourdough crust topped with roasted baby heirloom tomatoes, grilled artichoke hearts, wild baby arugula, and whole creamy burrata.',
    image: 'https://images.unsplash.com/photo-1576458088443-04a19bb13da6?w=800&auto=format&fit=crop&q=80',
    category: 'vegetarian',
    rating: 4.9,
    reviewsCount: 88,
    sizes: ['Small', 'Medium', 'Large'],
    prices: { Small: 16.99, Medium: 21.99, Large: 26.49 },
    ingredients: ['Fresh Burrata', 'Heirloom Tomatoes', 'Roasted Artichokes', 'Wild Arugula', 'Aged Balsamic Glaze', 'Pesto'],
    available: true,
    featured: true,
    isVeg: true,
    calories: 820,
    prepTimeMinutes: 20,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pizza-7',
    name: 'Wild Forest Mushroom & Thyme',
    description: 'Medley of cremini, chanterelle, and king oyster mushrooms sautéed in garlic butter, fontina cheese, fresh thyme, and white truffle essence.',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    category: 'vegetarian',
    rating: 4.7,
    reviewsCount: 76,
    sizes: ['Small', 'Medium', 'Large'],
    prices: { Small: 15.49, Medium: 19.99, Large: 24.49 },
    ingredients: ['Chanterelle & Oyster Mushrooms', 'Garlic Thyme Butter', 'Fontina Cheese', 'Truffle Essence', 'Fresh Parsley'],
    available: true,
    featured: false,
    isVeg: true,
    calories: 840,
    prepTimeMinutes: 21,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pizza-8',
    name: 'Prosciutto di Parma & Black Fig',
    description: 'Prosciutto di Parma aged 24 months, sweet black mission figs, shaved Parmigiano-Reggiano, baby arugula, and Modena balsamic drizzle.',
    image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=800&auto=format&fit=crop&q=80',
    category: 'specialty',
    rating: 4.9,
    reviewsCount: 130,
    sizes: ['Small', 'Medium', 'Large'],
    prices: { Small: 17.99, Medium: 22.99, Large: 27.99 },
    ingredients: ['Prosciutto di Parma', 'Black Mission Figs', 'Parmigiano-Reggiano', 'Baby Arugula', 'Modena Balsamic'],
    available: true,
    featured: true,
    calories: 890,
    prepTimeMinutes: 20,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pizza-9',
    name: 'Fire-Roasted Habanero & Hawaiian',
    description: 'Charred sweet golden pineapple rings, smoked cured ham, spicy habanero glaze, mozzarella, and crisp green jalapeños.',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop&q=80',
    category: 'spicy',
    rating: 4.6,
    reviewsCount: 94,
    sizes: ['Small', 'Medium', 'Large'],
    prices: { Small: 14.99, Medium: 18.99, Large: 23.49 },
    ingredients: ['Fire Roasted Pineapple', 'Smoked Ham', 'Habanero Honey Glaze', 'Fresh Jalapeños', 'Mozzarella'],
    available: true,
    featured: false,
    isSpicy: true,
    calories: 870,
    prepTimeMinutes: 19,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pizza-10',
    name: 'Artisan Meat Master Calzone',
    description: 'Folded golden sourdough pocket packed with Italian fennel sausage, spicy pepperoni, rich ricotta, melted mozzarella, and marinara dipping sauce.',
    image: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=800&auto=format&fit=crop&q=80',
    category: 'sweet',
    rating: 4.9,
    reviewsCount: 156,
    sizes: ['Small', 'Medium', 'Large'],
    prices: { Small: 14.99, Medium: 18.99, Large: 22.99 },
    ingredients: ['Italian Fennel Sausage', 'Crispy Pepperoni', 'Whole Milk Ricotta', 'Melted Mozzarella', 'Warm Marinara'],
    available: true,
    featured: true,
    calories: 1040,
    prepTimeMinutes: 24,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pizza-11',
    name: 'Sweet Whipped Ricotta & Nutella Calzone',
    description: 'Dessert pizza calzone baked golden, stuffed with sweet Sicilian whipped ricotta and creamy melted Nutella, dusted with powdered sugar.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    category: 'sweet',
    rating: 5.0,
    reviewsCount: 180,
    sizes: ['Small', 'Medium', 'Large'],
    prices: { Small: 11.99, Medium: 15.49, Large: 18.99 },
    ingredients: ['Warm Nutella Hazelnut Cream', 'Sweet Whipped Ricotta', 'Powdered Sugar', 'Roasted Hazelnuts', 'Mint'],
    available: true,
    featured: false,
    isVeg: true,
    calories: 740,
    prepTimeMinutes: 15,
    createdAt: new Date().toISOString(),
  }
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadOrSeed();
  }

  private loadOrSeed(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Failed to load existing db.json, generating fresh seed data:', err);
    }
    return this.createSeedData();
  }

  private createSeedData(): DatabaseSchema {
    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('admin123', salt);
    const userHash = bcrypt.hashSync('password123', salt);

    const users: DBUser[] = [
      {
        id: 'user-admin',
        name: 'Chef Mario Rossi',
        email: 'admin@pizzatown.com',
        phone: '+1 (555) 777-8899',
        passwordHash: adminHash,
        profileImage: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80',
        role: 'admin',
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: 'user-customer-1',
        name: 'Alex Morgan',
        email: 'alex@example.com',
        phone: '+1 (555) 234-5678',
        passwordHash: userHash,
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'customer',
        createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      },
    ];

    const addresses: Address[] = [
      {
        id: 'addr-1',
        userId: 'user-customer-1',
        fullName: 'Alex Morgan',
        phone: '+1 (555) 234-5678',
        street: '742 Evergreen Terrace, Apt 4B',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62704',
        instructions: 'Ring front buzzer 4B, please leave on porch mat.',
        isDefault: true,
      },
      {
        id: 'addr-2',
        userId: 'user-customer-1',
        fullName: 'Alex Morgan (Office)',
        phone: '+1 (555) 234-5678',
        street: '100 Innovation Parkway, Suite 210',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        instructions: 'Front desk reception on 2nd floor.',
        isDefault: false,
      }
    ];

    const reviews: Review[] = [
      {
        id: 'rev-1',
        userId: 'user-customer-1',
        userName: 'Alex Morgan',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        pizzaId: 'pizza-2',
        rating: 5,
        comment: 'The Truffle Pepperoni Supreme with hot honey is absolutely extraordinary. Crust has the perfect airy chew!',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'rev-2',
        userId: 'user-customer-2',
        userName: 'Sophia Chen',
        userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        pizzaId: 'pizza-1',
        rating: 5,
        comment: 'Authentic Napoli style. You can taste the quality in the San Marzano tomatoes and genuine buffalo mozzarella.',
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
      {
        id: 'rev-3',
        userId: 'user-customer-3',
        userName: 'Marcus Vance',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        pizzaId: 'pizza-4',
        rating: 5,
        comment: 'Smoky BBQ chicken pizza was piping hot upon delivery! Arrived in under 25 minutes.',
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      }
    ];

    const sampleOrders: Order[] = [
      {
        id: 'PT-8842',
        userId: 'user-customer-1',
        customerName: 'Alex Morgan',
        customerEmail: 'alex@example.com',
        customerPhone: '+1 (555) 234-5678',
        items: [
          {
            pizzaId: 'pizza-2',
            pizzaName: 'Truffle Pepperoni Supreme',
            pizzaImage: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&auto=format&fit=crop&q=80',
            size: 'Large',
            quantity: 1,
            unitPrice: 25.49,
            subtotal: 25.49,
          },
          {
            pizzaId: 'pizza-1',
            pizzaName: 'Margherita Royale',
            pizzaImage: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&auto=format&fit=crop&q=80',
            size: 'Medium',
            quantity: 1,
            unitPrice: 17.99,
            subtotal: 17.99,
          }
        ],
        deliveryAddress: addresses[0],
        subtotal: 43.48,
        deliveryFee: 3.99,
        discount: 0,
        total: 47.47,
        paymentMethod: 'stripe',
        paymentStatus: 'completed',
        orderStatus: 'Preparing',
        estimatedDeliveryMinutes: 25,
        statusHistory: [
          { status: 'Order Confirmed', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), note: 'Order received by Pizza Town kitchen.' },
          { status: 'Preparing', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), note: 'Artisan sourdough stretched and stone-baked in wood oven.' },
        ],
        createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
      },
      {
        id: 'PT-8710',
        userId: 'user-customer-1',
        customerName: 'Alex Morgan',
        customerEmail: 'alex@example.com',
        customerPhone: '+1 (555) 234-5678',
        items: [
          {
            pizzaId: 'pizza-6',
            pizzaName: 'Garden Harvest Burrata',
            pizzaImage: 'https://images.unsplash.com/photo-1576458088443-04a19bb13da6?w=800&auto=format&fit=crop&q=80',
            size: 'Medium',
            quantity: 2,
            unitPrice: 21.99,
            subtotal: 43.98,
          }
        ],
        deliveryAddress: addresses[0],
        subtotal: 43.98,
        deliveryFee: 3.99,
        discount: 5.00,
        total: 42.97,
        paymentMethod: 'cod',
        paymentStatus: 'completed',
        orderStatus: 'Delivered',
        estimatedDeliveryMinutes: 0,
        statusHistory: [
          { status: 'Order Confirmed', timestamp: new Date(Date.now() - 3 * 86400000).toISOString() },
          { status: 'Preparing', timestamp: new Date(Date.now() - 3 * 86400000 + 10 * 60000).toISOString() },
          { status: 'Out for Delivery', timestamp: new Date(Date.now() - 3 * 86400000 + 25 * 60000).toISOString() },
          { status: 'Delivered', timestamp: new Date(Date.now() - 3 * 86400000 + 40 * 60000).toISOString(), note: 'Delivered with care by driver Marco.' },
        ],
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 86400000 + 40 * 60000).toISOString(),
      }
    ];

    const initialCarts: Record<string, Cart> = {};

    const schema: DatabaseSchema = {
      users,
      pizzas: SEED_PIZZAS,
      categories: SEED_CATEGORIES,
      carts: initialCarts,
      orders: sampleOrders,
      reviews,
      addresses,
    };

    this.save(schema);
    return schema;
  }

  public save(dataToSave?: DatabaseSchema) {
    if (dataToSave) {
      this.data = dataToSave;
    }
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // Users
  public getUsers() {
    return this.data.users;
  }

  public findUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: DBUser) {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<DBUser>) {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    this.data.users[index] = { ...this.data.users[index], ...updates };
    this.save();
    return this.data.users[index];
  }

  // Pizzas
  public getPizzas() {
    return this.data.pizzas;
  }

  public findPizzaById(id: string) {
    return this.data.pizzas.find(p => p.id === id);
  }

  public createPizza(pizza: Pizza) {
    this.data.pizzas.unshift(pizza);
    this.save();
    return pizza;
  }

  public updatePizza(id: string, updates: Partial<Pizza>) {
    const index = this.data.pizzas.findIndex(p => p.id === id);
    if (index === -1) return null;
    this.data.pizzas[index] = { ...this.data.pizzas[index], ...updates };
    this.save();
    return this.data.pizzas[index];
  }

  public deletePizza(id: string) {
    const index = this.data.pizzas.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.data.pizzas.splice(index, 1);
    this.save();
    return true;
  }

  // Categories
  public getCategories() {
    return this.data.categories;
  }

  // Cart
  public getCart(userId: string): Cart {
    if (!this.data.carts[userId]) {
      this.data.carts[userId] = {
        userId,
        items: [],
        quantity: 0,
        subtotal: 0,
        deliveryFee: 0,
        total: 0,
        updatedAt: new Date().toISOString(),
      };
    }
    return this.data.carts[userId];
  }

  public saveCart(userId: string, cart: Cart) {
    this.data.carts[userId] = cart;
    this.save();
    return cart;
  }

  public clearCart(userId: string) {
    this.data.carts[userId] = {
      userId,
      items: [],
      quantity: 0,
      subtotal: 0,
      deliveryFee: 0,
      total: 0,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.carts[userId];
  }

  // Orders
  public getOrders() {
    return this.data.orders;
  }

  public findOrderById(id: string) {
    return this.data.orders.find(o => o.id === id);
  }

  public getOrdersByUserId(userId: string) {
    return this.data.orders.filter(o => o.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createOrder(order: Order) {
    this.data.orders.unshift(order);
    this.save();
    return order;
  }

  public updateOrder(id: string, updates: Partial<Order>) {
    const index = this.data.orders.findIndex(o => o.id === id);
    if (index === -1) return null;
    this.data.orders[index] = { ...this.data.orders[index], ...updates };
    this.save();
    return this.data.orders[index];
  }

  // Addresses
  public getAddressesByUserId(userId: string) {
    return this.data.addresses.filter(a => a.userId === userId);
  }

  public addAddress(address: Address) {
    if (address.isDefault) {
      // Set all other user addresses to not default
      this.data.addresses.forEach(a => {
        if (a.userId === address.userId) a.isDefault = false;
      });
    }
    this.data.addresses.push(address);
    this.save();
    return address;
  }

  public deleteAddress(id: string, userId: string) {
    const index = this.data.addresses.findIndex(a => a.id === id && a.userId === userId);
    if (index === -1) return false;
    this.data.addresses.splice(index, 1);
    this.save();
    return true;
  }

  // Reviews
  public getReviewsByPizzaId(pizzaId: string) {
    return this.data.reviews.filter(r => r.pizzaId === pizzaId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAllReviews() {
    return this.data.reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addReview(review: Review) {
    this.data.reviews.unshift(review);
    // Recalculate pizza rating
    const pizzaReviews = this.getReviewsByPizzaId(review.pizzaId);
    const avg = pizzaReviews.reduce((sum, r) => sum + r.rating, 0) / pizzaReviews.length;
    this.updatePizza(review.pizzaId, {
      rating: parseFloat(avg.toFixed(1)),
      reviewsCount: pizzaReviews.length,
    });
    this.save();
    return review;
  }

  public deleteReview(id: string) {
    const index = this.data.reviews.findIndex(r => r.id === id);
    if (index === -1) return false;
    const removed = this.data.reviews.splice(index, 1)[0];
    if (removed) {
      const remaining = this.getReviewsByPizzaId(removed.pizzaId);
      const avg = remaining.length ? remaining.reduce((sum, r) => sum + r.rating, 0) / remaining.length : 5.0;
      this.updatePizza(removed.pizzaId, {
        rating: parseFloat(avg.toFixed(1)),
        reviewsCount: remaining.length,
      });
    }
    this.save();
    return true;
  }
}

export const db = new Database();
