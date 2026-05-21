export interface Book {
  id: number;
  /** IDs de cada ejemplar físico. Formato "bookId.N" (ej: "3.1", "3.2").
   *  Su longitud siempre coincide con `stock`. M1-HU6 */
  copyIds: string[];
  title: string;
  author: string;
  /** Categorías del libro — puede tener más de una. */
  categories: string[];
  price: number;
  rating: number;
  isNew: boolean;
  available: boolean;
  stock: number;
  cover: string;
  isbn: string;
  // Campos de AdminExtras persistidos
  publisher?: string;
  publishDate?: string;
  pages?: number;
  /** Año de publicación (Iteración 3 — bug fix: conservar al editar) */
  year?: number;
  /** Idioma (Iteración 3 — bug fix: conservar al editar) */
  language?: string;
  /** Fecha en que el libro fue añadido al catálogo (ISO string). Usado para sección Novedades. */
  addedDate?: string;
  /** Condición física del libro: nuevo o usado. Usado para filtrado en catálogo. */
  condition?: "nuevo" | "usado";
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

// ── M1-HU7 / M2-HU10-HU11 — Tiendas con coordenadas ──────────
export interface Store {
  id: number;
  name: string;
  address: string;
  /** Distancia textual aproximada (fallback) */
  distance: string;
  /** Coordenadas geográficas para el mapa Leaflet y cálculo Haversine */
  lat: number;
  lng: number;
  /** Horario de atención */
  hours?: string;
}

// ── M1-HU7 — Inventario por tienda física ────────────────────
/** Mapa: storeId → bookId → cantidad */
export type StoreInventory = Record<number, Record<number, number>>;

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

// ── M1-HU5 — Noticias automáticas por nuevo libro ────────────
export interface News {
  id: string;
  bookId: number;
  title: string;       // Título de la noticia ("Nuevo libro: ...")
  body: string;
  bookTitle: string;
  bookAuthor: string;
  bookCategory: string;
  bookPrice: number;
  publishedAt: Date;
  status: 'published' | 'pending';
  /** Cantidad de intentos de publicación fallidos (reproceso) */
  retries?: number;
  /** Mensaje del último error si quedó pendiente */
  lastError?: string;
}
