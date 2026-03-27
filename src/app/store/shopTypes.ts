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
  deliveredAt?: Date;
}

export interface Purchase {
  id: string;
  date: Date;
  deliveredAt?: Date;
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

// ── FINANCIAL MODULE (M8-HU1, M8-HU2, M8-HU3) ──────────────
export interface Card {
  id: string;
  lastFour: string;
  holder: string;
  expiry: string;
  type: "credit" | "debit";
  network: "visa" | "mastercard";
  isPrimary: boolean;
}

export interface WalletTransaction {
  id: string;
  date: Date;
  type: "recharge" | "purchase" | "refund";
  amount: number;
  description: string;
}

// ── ADMIN MODULE (M1-HU1, M1-HU2, M1-HU6) ──────────────────
export interface AdminBook {
  id: string;          // ID único generado automáticamente (M1-HU6)
  title: string;
  author: string;
  isbn: string;
  year: number;
  genre: string;
  pages: number;
  publisher: string;
  language: string;
  publishDate: string;
  status: "new" | "used";
  price: number;
  stock: number;
  cover: string;
}

// ── ROOT MODULE (M7-HU1, M7-HU2) ────────────────────────────
export interface AdminUser {
  id: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  lugarNacimiento: string;
  direccion: string;
  genero: string;
  correo: string;
  usuario: string;
  active: boolean;
  createdAt: Date;
}
