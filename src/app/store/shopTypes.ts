export interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  price: number;
  rating: number;
  isNew: boolean;
  available: boolean;
  stock: number;
  cover: string;
  isbn: string;
}

export interface CartItem {
  book: Book;
  qty: number;
}

export interface TrackingStep {
  status: string;
  done: boolean;
  date: string;
}

export interface Purchase {
  id: string;
  date: Date;
  items: { book: Book; qty: number; price: number }[];
  total: number;
  status: 'preparing' | 'transit' | 'delivered' | 'cancelled' | 'returned';
  delivery: 'shipping' | 'pickup';
  address?: string;
  store?: string;
  tracking: TrackingStep[];
}

export interface Reservation {
  id: string;
  bookId: number;
  book: Book;
  createdAt: Date;
  status: 'active';
  expiresAt: Date;
}

export interface ReservationHistory {
  id: string;
  book: Book;
  date: Date;
  status: 'expired' | 'cancelled';
}

export interface Cancellation {
  id: string;
  type: 'purchase' | 'reservation';
  orderId: string;
  book: Book;
  date: Date;
  reason: string;
  refund?: number;
}

export interface Store {
  id: number;
  name: string;
  address: string;
  distance: string;
}
