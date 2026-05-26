import {
  createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo, useRef
} from "react";
import { io, Socket } from "socket.io-client";
import { sendAdminReplyEmail } from "../utils/notificationEmail";
import type {
  Book, CartItem, Purchase, Reservation,
  ReservationHistory, Cancellation, WalletTransaction,
  Store, StoreInventory, News, DirectMessage, DmMessage, Review,
  Recommendation, BotMessage, TrendMetrics
} from "./shopTypes";

// ── TIPOS DE USUARIO Y ROL ────────────────────────────────────
// "sucursal" representa la cuenta de cada tienda física (M1-HU7)
export type UserRole = "root" | "admin" | "cliente" | "visitante" | "sucursal";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  balance: number;      // Saldo en billetera digital (solo clientes)
  username: string;
  dni?: string;
  nombres?: string;
  apellidos?: string;
  fechaNacimiento?: string;
  lugarNacimiento?: string;
  direccion?: string;
  genero?: string;
  suscritoNoticias?: boolean;
  isProfileComplete?: boolean;
  temasPreferencia?: string[];
  fechaNacimientoLocked?: boolean;
}

export interface ChatMessage {
  sender: 'user' | 'admin' | 'bot';
  text: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  clientId: string;
  clientName: string;
  status: 'active' | 'resolved';
  startedAt: number;
  messages: ChatMessage[];
}

// ── USUARIOS DEMO (simula BD) ────────────────────────────────
export const DEMO_USERS: (SessionUser & { password: string })[] = [
  {
    id: "U-ROOT-001", name: "Administrador Root", email: "root@biblion.co",
    username: "root", password: "Root1234*", role: "root", balance: 0,
    nombres: "Administrador", apellidos: "Root", dni: "0000000000"
  },
  {
    id: "U-ADM-001", name: "Carlos Rodríguez", email: "admin@biblion.co",
    username: "carlos.admin", password: "admin1234", role: "admin", balance: 0,
    nombres: "Carlos", apellidos: "Rodríguez", dni: "1111111111"
  },
  {
    // Credenciales principales del cliente demo
    id: "U-CLI-001", name: "Juan Carlos Pérez",
    email: "juan.perez@correo.com",          // ← correo mostrado en el formulario
    username: "juanperez", password: "12345678",  // ← contraseña corta e intuitiva
    role: "cliente", balance: 125800,
    dni: "12345678", nombres: "Juan Carlos", apellidos: "Pérez", fechaNacimiento: "1990-05-15",
    lugarNacimiento: "Lima, Perú", direccion: "Av. Principal 123", genero: "masculino"
  },
  {
    // Alias adicional por si alguien usa el correo antiguo
    id: "U-CLI-001B", name: "Juan Carlos Pérez",
    email: "cliente@biblion.co",
    username: "juan.perez", password: "cliente1234",
    role: "cliente", balance: 125800,
    dni: "12345678", nombres: "Juan Carlos", apellidos: "Pérez",
  },
  // ── M1-HU7: Cuentas de sucursal (cada tienda física = un "usuario")
  // El admin debe ingresar este código/contraseña para desbloquear la edición
  // del inventario de la tienda correspondiente.
  {
    id: "U-SUC-001", name: "Sucursal Pereira Plaza",
    email: "pereiraplaza@biblion.co",
    username: "suc.pereiraplaza", password: "PereiraPlaza2026",
    role: "sucursal", balance: 0,
  },
  {
    id: "U-SUC-002", name: "Sucursal Unicentro",
    email: "unicentro@biblion.co",
    username: "suc.unicentro", password: "Unicentro2026",
    role: "sucursal", balance: 0,
  },
  {
    id: "U-SUC-003", name: "Sucursal Bolívar Plaza",
    email: "bolivarplaza@biblion.co",
    username: "suc.bolivarplaza", password: "BolivarPlaza2026",
    role: "sucursal", balance: 0,
  },
];

// ── INVENTARIO INICIAL ────────────────────────────────────────
const INITIAL_BOOKS: Book[] = [
  { id: 1,  copyIds: ["1.1","1.2","1.3"],                                                                            title: "Cien Años de Soledad",       author: "Gabriel García Márquez",   categories: ["Ficción"],   price: 28900, rating: 4.8, isNew: true,  available: true,  stock: 3,  cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop",    isbn: "978-84-376-0494-7", publisher: "Editorial Sudamericana", publishDate: "1967-05-30", pages: 471, year: 1967, language: "Español" },
  { id: 2,  copyIds: ["2.1","2.2","2.3","2.4","2.5","2.6","2.7","2.8"],                                              title: "El Principito",              author: "Antoine de Saint-Exupéry", categories: ["Ficción"],   price: 18500, rating: 4.9, isNew: true,  available: true,  stock: 8,  cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=450&fit=crop",    isbn: "978-84-261-1998-5", publisher: "Reynal & Hitchcock",     publishDate: "1943-04-06", pages: 96,  year: 1943, language: "Español" },
  { id: 3,  copyIds: ["3.1","3.2"],                                                                                   title: "Breve Historia del Tiempo",  author: "Stephen Hawking",          categories: ["Ciencia"],   price: 35000, rating: 4.7, isNew: true,  available: true,  stock: 2,  cover: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=300&h=450&fit=crop",    isbn: "978-0-553-38016-3", publisher: "Bantam Books",           publishDate: "1988-04-01", pages: 256, year: 1988, language: "Español" },
  { id: 4,  copyIds: ["4.1","4.2","4.3","4.4","4.5"],                                                                title: "Sapiens",                    author: "Yuval Noah Harari",        categories: ["Historia"],  price: 42000, rating: 4.6, isNew: false, available: true,  stock: 5,  cover: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=300&h=450&fit=crop",    isbn: "978-84-9992-441-0", publisher: "Debate",                 publishDate: "2014-09-04", pages: 496, year: 2014, language: "Español" },
  { id: 5,  copyIds: ["5.1","5.2","5.3","5.4","5.5","5.6","5.7","5.8","5.9","5.10","5.11","5.12"],                  title: "Veinte Poemas de Amor",      author: "Pablo Neruda",             categories: ["Poesía"],    price: 15000, rating: 4.9, isNew: false, available: true,  stock: 12, cover: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=450&fit=crop",    isbn: "978-84-376-2049-7", publisher: "Nascimento",             publishDate: "1924-06-13", pages: 112, year: 1924, language: "Español" },
  { id: 6,  copyIds: [],                                                                                              title: "1984",                       author: "George Orwell",            categories: ["Ficción"],   price: 24500, rating: 4.8, isNew: false, available: false, stock: 0,  cover: "https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=300&h=450&fit=crop",    isbn: "978-0-14-028360-8", publisher: "Secker & Warburg",       publishDate: "1949-06-08", pages: 328, year: 1949, language: "Español" },
  { id: 7,  copyIds: ["7.1","7.2","7.3","7.4"],                                                                      title: "El Mundo de Sofía",          author: "Jostein Gaarder",          categories: ["Filosofía"], price: 32000, rating: 4.7, isNew: false, available: true,  stock: 4,  cover: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=450&fit=crop",    isbn: "978-84-7844-138-4", publisher: "Siruela",                publishDate: "1991-01-01", pages: 638, year: 1991, language: "Español" },
  { id: 8,  copyIds: ["8.1"],                                                                                         title: "Historia del Arte",          author: "Ernst Gombrich",           categories: ["Arte"],      price: 68000, rating: 4.6, isNew: true,  available: true,  stock: 1,  cover: "https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=300&h=450&fit=crop",    isbn: "978-0-7148-3872-4", publisher: "Phaidon",                publishDate: "1950-01-01", pages: 688, year: 1950, language: "Español" },
  { id: 9,  copyIds: ["9.1","9.2","9.3","9.4","9.5","9.6"],                                                          title: "Don Quijote de la Mancha",   author: "Miguel de Cervantes",      categories: ["Ficción"],   price: 38000, rating: 4.5, isNew: false, available: true,  stock: 6,  cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=450&fit=crop",      isbn: "978-84-9895-001-5", publisher: "Francisco de Robles",    publishDate: "1605-01-16", pages: 863, year: 1605, language: "Español" },
  { id: 10, copyIds: ["10.1","10.2","10.3"],                                                                          title: "El Aleph",                   author: "Jorge Luis Borges",        categories: ["Ficción"],   price: 22000, rating: 4.8, isNew: false, available: true,  stock: 3,  cover: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=300&h=450&fit=crop",    isbn: "978-950-04-0009-2", publisher: "Losada",                 publishDate: "1949-06-01", pages: 157, year: 1949, language: "Español" },
  { id: 11, copyIds: ["11.1","11.2","11.3","11.4","11.5","11.6","11.7"],                                             title: "Cosmos",                     author: "Carl Sagan",               categories: ["Ciencia"],   price: 45000, rating: 4.9, isNew: true,  available: true,  stock: 7,  cover: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=300&h=450&fit=crop",    isbn: "978-84-344-2797-0", publisher: "Random House",           publishDate: "1980-09-12", pages: 396, year: 1980, language: "Español" },
  { id: 12, copyIds: ["12.1","12.2","12.3","12.4","12.5","12.6","12.7","12.8","12.9"],                               title: "La Iliada",                  author: "Homero",                   categories: ["Historia"],  price: 29000, rating: 4.4, isNew: false, available: true,  stock: 9,  cover: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=300&h=450&fit=crop",    isbn: "978-84-249-3521-1", publisher: "Gredos",                 publishDate: "1991-01-01", pages: 504, year: -750, language: "Español" },
];


// ── M1-HU7 / M2-HU10-HU11 — Tiendas físicas con coordenadas reales de Pereira ──
export const STORES: Store[] = [
  {
    id: 1,
    name: "Centro Comercial Pereira Plaza",
    address: "Cra. 13 #11-50, Pereira, Risaralda",
    distance: "0.8 km",
    lat: 4.8087,
    lng: -75.6906,
    hours: "Lun-Sáb 10:00 - 21:00 · Dom 11:00 - 20:00",
  },
  {
    id: 2,
    name: "Centro Comercial Unicentro",
    address: "Cra. 6 #34-80, Pereira, Risaralda",
    distance: "2.3 km",
    lat: 4.8198,
    lng: -75.6951,
    hours: "Lun-Dom 10:00 - 22:00",
  },
  {
    id: 3,
    name: "Centro Comercial Bolívar Plaza",
    address: "Cra. 14 #16-25, Pereira, Risaralda",
    distance: "1.4 km",
    lat: 4.8133,
    lng: -75.6957,
    hours: "Lun-Sáb 09:00 - 20:00 · Dom 11:00 - 19:00",
  },
];

// M1-HU7: Mapa storeId → username de la cuenta de sucursal asociada
export const STORE_TO_USERNAME: Record<number, string> = {
  1: "suc.pereiraplaza",
  2: "suc.unicentro",
  3: "suc.bolivarplaza",
};

// ── CONSTANTES DE NEGOCIO ─────────────────────────────────────
export const MAX_DIFFERENT_BOOKS = 5;   // RF-CR-03
export const MAX_SAME_BOOK_COPIES = 3;  // RF-CR-04
export const RESERVATION_HOURS = 24;   // RF-CR-05
export const RETURN_DAYS_LIMIT = 8;    // RF-CR-12

// Pereira (Risaralda) — centro aproximado, usado como referencia del cliente
export const PEREIRA_CENTER = { lat: 4.8133, lng: -75.6961 };

// ── HELPERS ───────────────────────────────────────────────────
export function fmt(price: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", minimumFractionDigits: 0,
  }).format(price);
}

/**
 * M2-HU11: Distancia haversine en kilómetros entre dos puntos lat/lng.
 * Usa el radio medio de la Tierra (6371 km).
 */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Genera un ID numérico único para libros */
function generateBookId(books: Book[]): number {
  const max = books.reduce((m, b) => Math.max(m, b.id), 0);
  return max + 1;
}

/**
 * Genera los IDs de ejemplares para un libro.
 * Formato: "bookId.N" — ej: "3.1", "3.2"
 * @param bookId  ID numérico del libro
 * @param from    Primer número de secuencia (evita reutilizar IDs eliminados)
 * @param count   Cantidad de IDs a generar
 */
function generateCopyIds(bookId: number, from: number, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${bookId}.${from + i}`);
}

/** Siguiente número de secuencia disponible para un libro (nunca reutiliza). */
function nextCopySeq(copyIds: string[]): number {
  if (!copyIds || copyIds.length === 0) return 1;
  const nums = copyIds.map(c => Number(c.split(".")[1])).filter(n => !isNaN(n));
  return nums.length > 0 ? Math.max(...nums) + 1 : 1;
}

/** Garantiza que un libro tenga copyIds coherentes con su stock (migración). */
function ensureCopyIds(b: Book): Book {
  if (b.copyIds && b.copyIds.length === b.stock) return b;
  return { ...b, copyIds: generateCopyIds(b.id, 1, b.stock) };
}

/** Genera un ISBN de demostración único */
function generateISBN(books: Book[]): string {
  let isbn: string;
  do {
    const rand = Math.floor(1000000 + Math.random() * 9000000);
    isbn = `978-XX-${rand}`;
  } while (books.find(b => b.isbn === isbn));
  return isbn;
}

export function isReturnEligible(purchase: Purchase): boolean {
  if (purchase.status !== "delivered") return false;
  const deliveredDate = new Date(purchase.deliveredAt || purchase.date);
  const diffDays = (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= RETURN_DAYS_LIMIT;
}

// ── CONTEXTO ─────────────────────────────────────────────────
interface ShopContextType {
  // Sesión
  user: SessionUser | null;
  login: (email: string, password: string) => { success: boolean; role?: UserRole; error?: string };
  logout: () => void;
  register: (data: {
    nombres: string; apellidos: string; dni: string;
    fechaNacimiento: string; lugarNacimiento: string;
    direccion: string; genero: string;
    correo: string; usuario: string; contrasena: string;
    temasPreferencia: string[];
  }) => { success: boolean; error?: string };
  registerAdmin: (data: {
    correo: string; usuario: string; contrasena: string;
  }) => { success: boolean; id?: string; error?: string };
  adminsList: { id: string; nombres: string; apellidos: string; correo: string; usuario: string; active: boolean; createdAt: Date; }[];
  usersList: { id: string; nombres: string; apellidos: string; correo: string; usuario: string; active: boolean; createdAt: Date; }[];
  toggleAdminStatus: (id: string) => void;
  toggleUserStatus: (id: string) => void;
  updateBalance: (amount: number) => void;
  updateProfile: (data: Partial<SessionUser & { password?: string }>) => { success: boolean; error?: string };
  verifyPassword: (password: string) => boolean;

  // Inventario dinámico (admin/root)
  books: Book[];
  addBook: (data: Omit<Book, "id" | "isbn" | "copyIds"> & { isbn?: string }) => Book;
  updateBook: (id: number, data: Partial<Book>) => void;
  deleteBook: (id: number) => void;

  // M1-HU5: Noticias automáticas por nuevo libro
  news: News[];
  pendingNews: News[];
  retryPendingNews: () => { recovered: number; stillFailing: number };

  // M1-HU7: Inventario por tienda física
  storeInventory: StoreInventory;
  setStoreStock: (storeId: number, bookId: number, qty: number) => void;
  getStoreStock: (storeId: number, bookId: number) => number;
  validateStoreCode: (storeId: number, code: string) => boolean;
  // M2-HU11: Tienda más cercana con disponibilidad para el libro/cantidad
  nearestStoreWithStock: (
    bookId: number,
    qty: number,
    from?: { lat: number; lng: number }
  ) => { store: Store; distanceKm: number } | null;

  // Carrito (solo clientes)
  cart: CartItem[];
  cartOpen: boolean;
  addToCart: (bookId: number) => void;
  removeFromCart: (bookId: number) => void;
  changeQty: (bookId: number, delta: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Compra con validación de saldo (M8)
  processPurchase: (purchase: Purchase) => { success: boolean; error?: string; transactionId?: string };

  // Reservas (solo clientes)
  reservations: Reservation[];
  addReservation: (bookId: number) => void;
  cancelReservation: (id: string) => void;
  convertReservationToCart: (id: string) => void;
  expireReservation: (id: string) => void;

  // Historial
  purchases: Purchase[];
  addPurchase: (purchase: Purchase) => void;
  cancelOrder: (orderId: string) => void;
  returnOrder: (orderId: string, reason: string, description: string, qrCode: string) => void;
  reservationHistory: ReservationHistory[];
  cancellations: Cancellation[];

  // Bot de recomendaciones
  botMessages: BotMessage[];
  botTyping: boolean;
  sendBotMessage: (text: string) => Promise<void>;
  clearBotHistory: () => void;
  /** ID del libro a abrir en el catálogo (señal de navegación desde el bot) */
  spotlightBookId: number | null;
  spotlightBook: (id: number) => void;
  clearSpotlight: () => void;

  // Recomendaciones personalizadas
  recommendations: Recommendation[];
  recommendationsLoading: boolean;
  refreshRecommendations: () => void;

  // Reseñas y calificaciones
  reviews: Review[];
  submitReview: (bookId: number, rating: number, comment: string) => Promise<{ success: boolean; error?: string }>;
  moderateReview: (reviewId: string, action: 'approved' | 'rejected') => void;
  getBookReviews: (bookId: number) => Review[];
  getBookAvgRating: (bookId: number) => number | null;
  hasPurchasedBook: (bookId: number) => boolean;
  hasReviewedBook: (bookId: number) => boolean;

  // Chat (soporte en línea)
  chats: ChatSession[];
  sendMessageToAdmin: (text: string) => void;
  replyToChat: (chatId: string, text: string) => void;
  resolveChat: (chatId: string) => void;

  // Mensajes directos al administrador
  directMessages: DirectMessage[];
  /** Número de conversaciones con mensajes del admin sin leer por el usuario */
  unreadDirectCount: number;
  /** Número de conversaciones activas con mensajes pendientes del usuario (para badge del admin) */
  pendingAdminCount: number;
  sendDirectMessage: (content: string) => void;
  adminSendToUser: (userId: string, userName: string, content: string) => void;
  markDirectMessageRead: (convId: string) => void;
  resolveConversation: (convId: string) => void;

  // Toast
  toast: string;
  toastType: "success" | "error" | "info" | "warning";
  showToast: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
  dismissToast: () => void;

  // Billetera — transacciones trazables
  walletTransactions: WalletTransaction[];
  addWalletTransaction: (tx: WalletTransaction) => void;
}

export const ShopContext = createContext<ShopContextType | undefined>(undefined);

// ── DATOS INICIALES DE DEMO ───────────────────────────────────
const INITIAL_PURCHASES: Purchase[] = [
  {
    id: "P-2024-001", date: new Date("2024-11-15"),
    items: [
      { book: INITIAL_BOOKS[0], qty: 1, price: 28900 },
      { book: INITIAL_BOOKS[4], qty: 2, price: 15000 },
    ],
    total: 58900, status: "delivered", delivery: "shipping",
    address: "Calle 100 #15-20, Bogotá",
    deliveredAt: new Date("2024-11-17"),
    tracking: [
      { status: "Pedido recibido", done: true, date: "15 Nov 09:15" },
      { status: "En preparación", done: true, date: "15 Nov 11:30" },
      { status: "Enviado", done: true, date: "16 Nov 08:00" },
      { status: "Entregado", done: true, date: "17 Nov 14:22" },
    ],
  },
  {
    id: "P-2024-002", date: new Date("2024-12-02"),
    items: [{ book: INITIAL_BOOKS[2], qty: 1, price: 35000 }],
    total: 35000, status: "transit", delivery: "shipping",
    address: "Calle 100 #15-20, Bogotá",
    tracking: [
      { status: "Pedido recibido", done: true, date: "2 Dic 10:00" },
      { status: "En preparación", done: true, date: "2 Dic 14:00" },
      { status: "Enviado", done: true, date: "3 Dic 09:00" },
      { status: "Entregado", done: false, date: "" },
    ],
  },
  {
    id: "P-2024-003", date: new Date("2024-12-10"),
    items: [{ book: INITIAL_BOOKS[8], qty: 1, price: 38000 }],
    total: 38000, status: "preparing", delivery: "pickup",
    store: "Biblioteca Digital Centro",
    tracking: [
      { status: "Pedido recibido", done: true, date: "10 Dic 16:45" },
      { status: "En preparación", done: false, date: "" },
      { status: "Listo para recoger", done: false, date: "" },
      { status: "Recogido", done: false, date: "" },
    ],
  },
];


// ── TRANSACCIONES INICIALES DE BILLETERA (demo) ───────────────
const INITIAL_WALLET_TXS: WalletTransaction[] = [
  { id: "t1", date: new Date("2024-12-01"), type: "recharge", amount: 50000,  description: "Recarga desde tarjeta •4521", userId: "U-CLI-001B" },
  { id: "t2", date: new Date("2024-12-03"), type: "purchase", amount: -28900, description: "Cien Años de Soledad",        userId: "U-CLI-001B" },
  { id: "t3", date: new Date("2024-12-10"), type: "refund",   amount: 35000,  description: "Reembolso pedido P-2024-002", userId: "U-CLI-001B" },
];

// ── PERSISTENCIA EN localStorage ─────────────────────────────
const LS_USERS_KEY = "biblion_users_v1";
const STORAGE_KEY_BOOKS         = "biblion_books";
const STORAGE_KEY_PURCHASES     = "biblion_purchases";
const STORAGE_KEY_RESERVATIONS  = "biblion_reservations";
const STORAGE_KEY_RES_HISTORY   = "biblion_reservation_history";
const STORAGE_KEY_CANCELLATIONS = "biblion_cancellations";
const STORAGE_KEY_CHATS         = "biblion_chats";
const STORAGE_KEY_WALLET_TXS    = "biblion_wallet_txs";
const STORAGE_KEY_NEWS          = "biblion_news";              // M1-HU5
const STORAGE_KEY_STORE_INVENT  = "biblion_store_inventory";   // M1-HU7
const STORAGE_KEY_DIRECT_MSGS   = "biblion_direct_messages_v2";
const STORAGE_KEY_REVIEWS       = "biblion_reviews";
const STORAGE_KEY_BOT_MSGS      = "biblion_bot_messages";

function loadUsers(): (SessionUser & { password: string })[] {
  try {
    const raw = localStorage.getItem(LS_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as (SessionUser & { password: string })[];
      
      // Forzar reset de credenciales root en localStorage por pérdida de acceso
      const rootUser = parsed.find(u => u.username === "root");
      if (rootUser) {
        rootUser.password = "Root1234*";
      }

      const merged = parsed.slice();
      for (const d of DEMO_USERS) {
        if (!merged.find(m => m.id === d.id)) merged.push(d);
      }
      return merged;
    }
  } catch (_) { /* ignorar errores de parseo */ }
  return [...DEMO_USERS]; // fallback
}

function saveUsers(users: (SessionUser & { password: string })[]) {
  try {
    localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
  } catch (_) { /* ignorar si localStorage no está disponible */ }
}

function loadBooks(): Book[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_BOOKS);
    if (!data) return INITIAL_BOOKS;
    const parsed: (Book & { category?: string })[] = JSON.parse(data);
    // Migración: category string → categories array, y copyIds correctos
    return parsed.map(b => {
      const migrated: Book = {
        ...b,
        categories: b.categories?.length
          ? b.categories
          : b.category
            ? [b.category]
            : [],
      };
      return ensureCopyIds(migrated);
    });
  } catch (e) {
    return INITIAL_BOOKS;
  }
}


function loadPurchases(): Purchase[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PURCHASES);
    if (!data) return INITIAL_PURCHASES;
    const parsed = JSON.parse(data);
    // Re-parse dates
    return parsed.map((p: Purchase) => ({
      ...p,
      date: new Date(p.date),
      deliveredAt: p.deliveredAt ? new Date(p.deliveredAt) : undefined,
    }));
  } catch (e) {
    return INITIAL_PURCHASES;
  }
}

function loadReservations(): Reservation[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_RESERVATIONS);
    if (!data) return [
      {
        id: "R-001", bookId: 4, book: INITIAL_BOOKS[3],
        createdAt: new Date(Date.now() - 18 * 3600000), status: "active",
        expiresAt: new Date(Date.now() + 6 * 3600000),
      },
      {
        id: "R-002", bookId: 7, book: INITIAL_BOOKS[6],
        createdAt: new Date(Date.now() - 2 * 3600000), status: "active",
        expiresAt: new Date(Date.now() + 22 * 3600000),
      },
    ];
    const parsed = JSON.parse(data);
    return parsed.map((r: Reservation) => ({
      ...r,
      createdAt: new Date(r.createdAt),
      expiresAt: new Date(r.expiresAt),
    }));
  } catch (e) {
    return [];
  }
}

function loadResHistory(): ReservationHistory[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_RES_HISTORY);
    if (!data) return [
      { id: "RH-001", book: INITIAL_BOOKS[1], date: new Date("2024-11-20"), status: "expired" },
      { id: "RH-002", book: INITIAL_BOOKS[5], date: new Date("2024-12-01"), status: "cancelled" },
    ];
    const parsed = JSON.parse(data);
    return parsed.map((rh: ReservationHistory) => ({
      ...rh,
      date: new Date(rh.date),
    }));
  } catch (e) {
    return [];
  }
}

function loadCancellations(): Cancellation[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_CANCELLATIONS);
    if (!data) return [
      { id: "C-001", type: "purchase", orderId: "P-2024-000", book: INITIAL_BOOKS[5], date: new Date("2024-10-28"), reason: "Precio incorrecto", refund: 24500 },
    ];
    const parsed = JSON.parse(data);
    return parsed.map((c: Cancellation) => ({
      ...c,
      date: new Date(c.date),
    }));
  } catch (e) {
    return [];
  }
}

function loadBotMessages(): BotMessage[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_BOT_MSGS);
    if (!data) return [];
    return JSON.parse(data) as BotMessage[];
  } catch { return []; }
}

function loadReviews(): Review[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_REVIEWS);
    if (!data) return [];
    return JSON.parse(data) as Review[];
  } catch {
    return [];
  }
}

function loadDirectMessages(): DirectMessage[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_DIRECT_MSGS);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    // Descartar entradas con formato antiguo (no tienen campo messages[])
    return parsed.filter((c: any) => Array.isArray(c.messages)) as DirectMessage[];
  } catch {
    return [];
  }
}

function loadChats(): ChatSession[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_CHATS);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return parsed.map((c: ChatSession) => ({
      ...c,
      startedAt: c.startedAt, // Timestamps are numbers, no need for new Date()
      messages: c.messages.map(m => ({ ...m, timestamp: m.timestamp })),
    }));
  } catch {
    return [];
  }
}

function loadWalletTxs(): WalletTransaction[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_WALLET_TXS);
    if (!data) return INITIAL_WALLET_TXS;
    const parsed = JSON.parse(data);
    return parsed.map((tx: WalletTransaction) => ({ ...tx, date: new Date(tx.date) }));
  } catch {
    return INITIAL_WALLET_TXS;
  }
}

// ── M1-HU5: Persistencia de noticias automáticas ──────────────
function loadNews(): News[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_NEWS);
    if (!data) return [];
    const parsed = JSON.parse(data) as News[];
    return parsed.map(n => ({ ...n, publishedAt: new Date(n.publishedAt) }));
  } catch {
    return [];
  }
}

// ── M1-HU7: Persistencia del inventario por tienda física ─────
function loadStoreInventory(): StoreInventory {
  try {
    const data = localStorage.getItem(STORAGE_KEY_STORE_INVENT);
    if (!data) {
      // Inicialización: distribuir el stock global de los libros semilla
      // entre las 3 tiendas (40% / 35% / 25%) para que la app arranque con datos.
      const dist = [0.40, 0.35, 0.25];
      const out: StoreInventory = { 1: {}, 2: {}, 3: {} };
      for (const b of INITIAL_BOOKS) {
        const total = Math.max(0, b.stock);
        out[1][b.id] = Math.max(0, Math.floor(total * dist[0]));
        out[2][b.id] = Math.max(0, Math.floor(total * dist[1]));
        out[3][b.id] = Math.max(0, Math.floor(total * dist[2]));
      }
      return out;
    }
    return JSON.parse(data) as StoreInventory;
  } catch {
    return { 1: {}, 2: {}, 3: {} };
  }
}

const SESSION_KEY = "biblion_session";

function loadSession(): SessionUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

// ── PROVIDER ──────────────────────────────────────────────────
export function ShopProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(loadSession);
  // Lista dinámica de usuarios — persistida en localStorage
  const [registeredUsers, setRegisteredUsers] = useState<(SessionUser & { password: string })[]>(() => loadUsers());
  const [books, setBooks] = useState<Book[]>(loadBooks);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>(loadReservations);
  const [purchases, setPurchases] = useState<Purchase[]>(loadPurchases);
  const [reservationHistory, setReservationHistory] = useState<ReservationHistory[]>(loadResHistory);
  const [cancellations, setCancellations] = useState<Cancellation[]>(loadCancellations);
  const [chats, setChats] = useState<ChatSession[]>(loadChats);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>(loadDirectMessages);
  const [reviews, setReviews] = useState<Review[]>(loadReviews);
  const [botMessages, setBotMessages] = useState<BotMessage[]>(loadBotMessages);
  const [botTyping, setBotTyping] = useState(false);
  const [spotlightBookId, setSpotlightBookId] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(loadWalletTxs);
  // M1-HU5: noticias publicadas + pendientes para reproceso
  const [news, setNews] = useState<News[]>(loadNews);
  // M1-HU7: inventario por tienda física
  const [storeInventory, setStoreInventoryState] = useState<StoreInventory>(loadStoreInventory);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info" | "warning">("success");

  const showToast = useCallback((msg: string, type: "success" | "error" | "info" | "warning" = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 4500);
  }, []);

  const dismissToast = useCallback(() => setToast(""), []);

  const addWalletTransaction = useCallback((tx: WalletTransaction) => {
    setWalletTransactions(prev => [{ ...tx, userId: user?.id }, ...prev]);
  }, [user?.id]);

  // ── PERSISTENCIA (Módulo 6 & Otros) ────────────────────────
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PURCHASES, JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RESERVATIONS, JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RES_HISTORY, JSON.stringify(reservationHistory));
  }, [reservationHistory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CANCELLATIONS, JSON.stringify(cancellations));
  }, [cancellations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DIRECT_MSGS, JSON.stringify(directMessages));
  }, [directMessages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BOT_MSGS, JSON.stringify(botMessages));
  }, [botMessages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WALLET_TXS, JSON.stringify(walletTransactions));
  }, [walletTransactions]);

  // M1-HU5: persistir noticias
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NEWS, JSON.stringify(news));
  }, [news]);

  // M1-HU7: persistir inventario por tienda
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STORE_INVENT, JSON.stringify(storeInventory));
  }, [storeInventory]);

  // Sesión en sessionStorage: sobrevive F5 pero se borra al cerrar el tab
  useEffect(() => {
    if (user) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  // ── SOCKET.IO — mensajes directos en tiempo real ────────────
  useEffect(() => {
    const socket = io('http://localhost:3001', { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (user) {
        socket.emit('identify', { userId: user.id, role: user.role });
      }
    });

    // Nuevo mensaje del usuario recibido por el admin
    socket.on('direct:new_msg', (payload: { convId: string; userId: string; userName: string; dmMsg: DmMessage }) => {
      setDirectMessages(prev => {
        const existing = prev.find(c => c.id === payload.convId);
        const now = payload.dmMsg.timestamp;
        if (existing) {
          if (existing.messages.find(m => m.id === payload.dmMsg.id)) return prev;
          return prev.map(c =>
            c.id === payload.convId
              ? { ...c, status: 'pending_admin' as const, lastUserMsgAt: now, messages: [...c.messages, payload.dmMsg], updatedAt: now }
              : c
          );
        }
        const newConv: DirectMessage = {
          id: payload.convId, userId: payload.userId, userName: payload.userName,
          status: 'pending_admin', lastUserMsgAt: now, messages: [payload.dmMsg], createdAt: now, updatedAt: now,
        };
        return [newConv, ...prev];
      });
    });

    // Mensaje del admin recibido por el usuario
    socket.on('direct:admin_msg', (payload: { convId: string; userId: string; userName: string; dmMsg: DmMessage }) => {
      setDirectMessages(prev => {
        const existing = prev.find(c => c.id === payload.convId);
        const now = payload.dmMsg.timestamp;
        if (existing) {
          if (existing.messages.find(m => m.id === payload.dmMsg.id)) return prev;
          return prev.map(c =>
            c.id === payload.convId
              // lastUserMsgAt = 0 cuando el admin responde (resetea urgencia)
              ? { ...c, status: 'pending_user' as const, lastUserMsgAt: 0, messages: [...c.messages, payload.dmMsg], updatedAt: now }
              : c
          );
        }
        const newConv: DirectMessage = {
          id: payload.convId, userId: payload.userId, userName: payload.userName,
          status: 'pending_user', lastUserMsgAt: 0, messages: [payload.dmMsg], createdAt: now, updatedAt: now,
        };
        return [newConv, ...prev];
      });

      // ── Notificación por correo si el tab está oculto (usuario inactivo) ──
      // Leemos la sesión en ese momento para obtener email del usuario actual.
      if (document.hidden) {
        try {
          const raw = sessionStorage.getItem("biblion_session");
          if (raw) {
            const sessionUser = JSON.parse(raw);
            if (sessionUser?.email && sessionUser?.name) {
              sendAdminReplyEmail(
                payload.convId,
                sessionUser.name,
                sessionUser.email,
                payload.dmMsg.senderName,
                payload.dmMsg.content,
              ).catch(() => {/* silenciar errores de correo */});
            }
          }
        } catch { /* silenciar errores de parseo */ }
      }
    });

    // Confirmación de lectura
    socket.on('direct:read_ack', ({ convId }: { convId: string }) => {
      setDirectMessages(prev =>
        prev.map(c => c.id === convId ? { ...c, status: 'active' as const } : c)
      );
    });

    // Conversación resuelta
    socket.on('direct:resolved', ({ convId, resolvedAt }: { convId: string; resolvedAt: number }) => {
      setDirectMessages(prev =>
        prev.map(c =>
          c.id === convId
            ? { ...c, status: 'resolved' as const, resolvedAt, lastUserMsgAt: 0 }
            : c
        )
      );
    });

    return () => { socket.disconnect(); };
  }, [user?.id, user?.role]);

  // Re-identificarse si el usuario cambia
  useEffect(() => {
    if (user && socketRef.current?.connected) {
      socketRef.current.emit('identify', { userId: user.id, role: user.role });
    }
  }, [user?.id]);

  // ── SESIÓN ─────────────────────────────────────────────────
  const login = useCallback((email: string, password: string) => {
    const identifier = email.trim().toLowerCase();
    const pw = password.trim();
    const found = registeredUsers.find(
      u => (u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier) &&
           u.password === pw
    );
    if (!found) {
      return { success: false, error: "Credenciales incorrectas. Verifica tu correo y contraseña." };
    }
    if ((found as any).active === false) {
      return { success: false, error: "Esta cuenta ha sido desactivada." };
    }
    const { password: _pw, ...sessionUser } = found;
    setUser(sessionUser);
    return { success: true, role: found.role };
  }, [registeredUsers]);

  const logout = useCallback(() => {
    setUser(null);
    setCart([]);
    setCartOpen(false);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  // ── REGISTRO DE NUEVO USUARIO (cliente) ────────────────────
  const register = useCallback((data: {
    nombres: string; apellidos: string; dni: string;
    fechaNacimiento: string; lugarNacimiento: string;
    direccion: string; genero: string;
    correo: string; usuario: string; contrasena: string;
    temasPreferencia: string[];
  }) => {
    // Verificar duplicados de correo o usuario
    const emailTaken = registeredUsers.find(
      u => u.email === data.correo.trim().toLowerCase()
    );
    if (emailTaken) {
      return { success: false, error: "Ya existe una cuenta con ese correo electrónico." };
    }
    const usernameTaken = registeredUsers.find(
      u => u.username === data.usuario.trim().toLowerCase()
    );
    if (usernameTaken) {
      return { success: false, error: "Ese nombre de usuario ya está en uso. Elige otro." };
    }

    const newUser: SessionUser & { password: string } = {
      id: "U-CLI-" + Date.now(),
      name: `${data.nombres.trim()} ${data.apellidos.trim()}`,
      email: data.correo.trim().toLowerCase(),
      username: data.usuario.trim().toLowerCase(),
      password: data.contrasena,
      role: "cliente",
      balance: 0,
      nombres: data.nombres.trim(),
      apellidos: data.apellidos.trim(),
      dni: data.dni,
      fechaNacimiento: data.fechaNacimiento,
      lugarNacimiento: data.lugarNacimiento,
      direccion: data.direccion,
      genero: data.genero,
      suscritoNoticias: false,
      temasPreferencia: data.temasPreferencia,
    };

    setRegisteredUsers(prev => {
      const next = [...prev, newUser];
      saveUsers(next);
      return next;
    });
    return { success: true };
  }, [registeredUsers]);


  // ── REGISTRO DE ADMINISTRADOR (solo root) ──────────────────
  const registerAdmin = useCallback((data: {
    correo: string; usuario: string; contrasena: string;
  }) => {
    const emailTaken = registeredUsers.find(
      u => u.email.toLowerCase() === data.correo.trim().toLowerCase()
    );
    if (emailTaken) {
      return { success: false, error: "Ya existe una cuenta con ese correo electrónico." };
    }
    const usernameTaken = registeredUsers.find(
      u => u.username.toLowerCase() === data.usuario.trim().toLowerCase()
    );
    if (usernameTaken) {
      return { success: false, error: "Ese nombre de usuario ya está en uso." };
    }
    const id = "U-ADM-" + Date.now();
    const newAdmin: SessionUser & { password: string } = {
      id,
      name: `Nuevo Administrador (${data.usuario})`,
      email: data.correo.trim().toLowerCase(),
      username: data.usuario.trim().toLowerCase(),
      password: data.contrasena,
      role: "admin",
      balance: 0,
      isProfileComplete: false,
    };
    setRegisteredUsers(prev => {
      const next = [...prev, newAdmin];
      saveUsers(next);   // ← persiste en localStorage
      return next;
    });
    return { success: true, id };
  }, [registeredUsers]);

  const unreadDirectCount = useMemo(() => {
    if (!user || user.role !== 'cliente') return 0;
    return directMessages.filter(
      c => c.userId === user.id && c.status === 'pending_user'
    ).length;
  }, [directMessages, user?.id, user?.role]);

  // Badge del admin: conversaciones no resueltas con mensajes pendientes del usuario
  const pendingAdminCount = useMemo(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'root')) return 0;
    return directMessages.filter(c => c.status === 'pending_admin').length;
  }, [directMessages, user?.role]);

  const resolveConversation = useCallback((convId: string) => {
    socketRef.current?.emit('direct:resolve', { convId });
  }, []);

  const adminsList = useMemo(() => {
    return registeredUsers
      .filter(u => u.role === "admin")
      .map(u => ({
        id: u.id,
        nombres: u.nombres || "(Pendiente)",
        apellidos: u.apellidos || "",
        correo: u.email,
        usuario: u.username,
        active: (u as any).active ?? true,
        createdAt: new Date()
      }));
  }, [registeredUsers]);

  const usersList = useMemo(() => {
    return registeredUsers
      .filter(u => u.role === "cliente")
      .map(u => ({
        id: u.id,
        nombres: u.nombres || "(Pendiente)",
        apellidos: u.apellidos || "",
        correo: u.email,
        usuario: u.username,
        active: (u as any).active ?? true,
        createdAt: new Date()
      }));
  }, [registeredUsers]);

  const toggleAdminStatus = useCallback((id: string) => {
    setRegisteredUsers(prev => {
      const next = prev.map(u => u.id === id ? { ...u, active: !((u as any).active ?? true) } : u);
      saveUsers(next);
      return next;
    });
  }, []);

  const toggleUserStatus = useCallback((id: string) => {
    setRegisteredUsers(prev => {
      const next = prev.map(u => u.id === id ? { ...u, active: !((u as any).active ?? true) } : u);
      saveUsers(next);
      return next;
    });
  }, []);

  const updateBalance = useCallback((amount: number) => {
    setUser(prev => {
      if (!prev) return prev;
      const newBalance = prev.balance + amount;
      setRegisteredUsers(users => {
        const next = users.map(u => u.id === prev.id ? { ...u, balance: newBalance } : u);
        saveUsers(next);
        return next;
      });
      return { ...prev, balance: newBalance };
    });
  }, []);

  const updateProfile = useCallback((data: Partial<SessionUser & { password?: string }>) => {
    if (!user) return { success: false, error: "No hay sesión activa" };
    const update = { ...data };

    // Fecha de nacimiento: solo modificable una vez después del registro inicial
    if ("fechaNacimiento" in update && update.fechaNacimiento) {
      if (user.fechaNacimientoLocked) {
        delete update.fechaNacimiento; // ya está bloqueada, ignorar
      } else if (user.fechaNacimiento) {
        // Tiene fecha previa → esta es la única modificación permitida, bloquear
        update.fechaNacimientoLocked = true;
      }
    }

    setRegisteredUsers(prev => {
      const next = prev.map(u => u.id === user.id ? { ...u, ...update } : u);
      saveUsers(next);
      return next;
    });
    setUser(prev => prev ? { ...prev, ...update } : prev);
    showToast("Perfil actualizado correctamente", "success");
    return { success: true };
  }, [user, showToast]);

  const verifyPassword = useCallback((password: string): boolean => {
    if (!user) return false;
    const found = registeredUsers.find(u => u.id === user.id);
    return found?.password === password;
  }, [user, registeredUsers]);

  // ── INVENTARIO DINÁMICO (admin / root) ─────────────────────
  const addBook = useCallback((data: Omit<Book, "id" | "isbn" | "copyIds"> & { isbn?: string }): Book => {
    let createdBook!: Book;
    setBooks(prev => {
      // M1-HU6: ID único calculado dentro del functional update (evita stale closure)
      const maxId = prev.reduce((m, b) => Math.max(m, b.id), 0);
      const id = maxId + 1;
      // ISBN: usa el proporcionado o genera uno único
      const existingIsbns = new Set(prev.map(b => b.isbn));
      let isbn = data.isbn?.trim() || "";
      if (!isbn) {
        do {
          const rand = Math.floor(1000000 + Math.random() * 9000000);
          isbn = `978-XX-${rand}`;
        } while (existingIsbns.has(isbn));
      }
      // M1-HU6: generar IDs de ejemplares "bookId.N"
      const copyIds = generateCopyIds(id, 1, data.stock);
      createdBook = { ...data, id, isbn, copyIds, addedDate: new Date().toISOString() };
      return [...prev, createdBook];
    });

    // M1-HU5: Publicar noticia automática tras registrar libro
    // Si la "publicación" falla, queda como pending para reproceso.
    setTimeout(() => {
      try {
        const created = createdBook;
        // Simulación de fallo de publicación: si el título es vacío o el libro
        // no quedó creado, marcamos pending. En producción aquí iría un fetch.
        const failed = !created || !created.title;
        const cat = created?.categories?.[0] ?? "Sin categoría";
        const newsItem: News = {
          id: `N-${Date.now()}-${created.id}`,
          bookId: created.id,
          title: `📚 Nuevo libro disponible: ${created.title}`,
          body: `Disponible desde ${new Date().toLocaleDateString("es-CO")}. ` +
                `Autor: ${created.author}. Categoría: ${cat}. ` +
                `Precio: ${fmt(created.price)}. ¡Encuéntralo en nuestro catálogo!`,
          bookTitle: created.title,
          bookAuthor: created.author,
          bookCategory: cat,
          bookPrice: created.price,
          publishedAt: new Date(),
          status: failed ? "pending" : "published",
          retries: failed ? 1 : 0,
          lastError: failed ? "Datos incompletos del libro" : undefined,
        };
        setNews(prev => [newsItem, ...prev]);
      } catch (e: any) {
        // Si todo falla, dejar una noticia pendiente mínima
        setNews(prev => [{
          id: `N-${Date.now()}-fail`,
          bookId: createdBook?.id ?? -1,
          title: `📚 Nuevo libro registrado (pendiente de publicación)`,
          body: "La publicación automática falló y será reintentada.",
          bookTitle: createdBook?.title ?? "Sin título",
          bookAuthor: createdBook?.author ?? "",
          bookCategory: createdBook?.categories?.[0] ?? "Sin categoría",
          bookPrice: createdBook?.price ?? 0,
          publishedAt: new Date(),
          status: "pending",
          retries: 1,
          lastError: e?.message ?? "Error desconocido",
        }, ...prev]);
      }
    }, 0);

    return createdBook;
  }, []);

  const updateBook = useCallback((id: number, data: Partial<Book>) => {
    setBooks(prev => prev.map(b => {
      if (b.id !== id) return b;
      const newStock = data.stock ?? b.stock;
      let copyIds = b.copyIds ?? [];
      if (data.stock !== undefined && data.stock !== b.stock) {
        if (data.stock > b.stock) {
          // Añadir ejemplares continuando la secuencia (nunca reusar IDs)
          const from = nextCopySeq(copyIds);
          copyIds = [...copyIds, ...generateCopyIds(b.id, from, data.stock - b.stock)];
        } else {
          // Reducir: eliminar los últimos
          copyIds = copyIds.slice(0, data.stock);
        }
      }
      return { ...b, ...data, stock: newStock, available: newStock > 0, copyIds };
    }));
  }, []);

  const deleteBook = useCallback((id: number) => {
    setBooks(prev => prev.filter(b => b.id !== id));
  }, []);

  // ── M1-HU5: Reproceso de noticias pendientes ──────────────
  const retryPendingNews = useCallback((): { recovered: number; stillFailing: number } => {
    let recovered = 0;
    let stillFailing = 0;
    setNews(prev => prev.map(n => {
      if (n.status !== "pending") return n;
      // Reproceso: si tiene título y autor, se considera recuperable
      if (n.bookTitle && n.bookAuthor) {
        recovered++;
        return { ...n, status: "published" as const, lastError: undefined };
      }
      stillFailing++;
      return { ...n, retries: (n.retries ?? 0) + 1 };
    }));
    return { recovered, stillFailing };
  }, []);

  // ── M1-HU7: Inventario por tienda ──────────────────────────
  const setStoreStock = useCallback((storeId: number, bookId: number, qty: number) => {
    setStoreInventoryState(prev => {
      const next: StoreInventory = { ...prev, [storeId]: { ...(prev[storeId] ?? {}) } };
      next[storeId][bookId] = Math.max(0, Math.floor(qty));
      return next;
    });
  }, []);

  const getStoreStock = useCallback((storeId: number, bookId: number): number => {
    return storeInventory?.[storeId]?.[bookId] ?? 0;
  }, [storeInventory]);

  // M1-HU7: Validación de código de tienda contra el localStorage de usuarios
  // (cada tienda actúa como un "usuario" con role: "sucursal")
  const validateStoreCode = useCallback((storeId: number, code: string): boolean => {
    const expectedUsername = STORE_TO_USERNAME[storeId];
    if (!expectedUsername) return false;
    const storeUser = registeredUsers.find(
      u => u.username === expectedUsername && u.role === "sucursal"
    );
    if (!storeUser) return false;
    return storeUser.password === code.trim();
  }, [registeredUsers]);

  // ── M2-HU11: Tienda más cercana con disponibilidad ─────────
  const nearestStoreWithStock = useCallback((
    bookId: number,
    qty: number,
    from: { lat: number; lng: number } = PEREIRA_CENTER
  ): { store: Store; distanceKm: number } | null => {
    const eligible: { store: Store; distanceKm: number }[] = [];
    for (const s of STORES) {
      const stock = storeInventory?.[s.id]?.[bookId] ?? 0;
      if (stock >= qty) {
        eligible.push({ store: s, distanceKm: haversineKm(from, { lat: s.lat, lng: s.lng }) });
      }
    }
    if (eligible.length === 0) return null;
    eligible.sort((a, b) => a.distanceKm - b.distanceKm);
    return eligible[0];
  }, [storeInventory]);

  // ── CARRITO ────────────────────────────────────────────────
  const addToCart = useCallback((bookId: number) => {
    // Módulo 3: Solo clientes pueden comprar
    if (!user || user.role === "admin" || user.role === "root") {
      showToast("Solo los clientes registrados pueden añadir libros al carrito.", "error");
      return;
    }
    if (user.role === "visitante") {
      showToast("Debes iniciar sesión como cliente para comprar libros.", "error");
      return;
    }
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    if (!book.available || book.stock === 0) {
      showToast("⚠️ Este libro no tiene disponibilidad en inventario", "error");
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.book.id === bookId);
      if (existing) {
        if (existing.qty >= MAX_SAME_BOOK_COPIES) {
          showToast(`⚠️ Máximo ${MAX_SAME_BOOK_COPIES} ejemplares del mismo libro (RF-CR-04)`, "error");
          return prev;
        }
        if (existing.qty >= book.stock) {
          showToast("⚠️ Stock máximo alcanzado para este libro", "error");
          return prev;
        }
        return prev.map(i => i.book.id === bookId ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { book, qty: 1 }];
    });
    showToast(`✓ "${book.title}" añadido al carrito`, "success");
  }, [user, books, showToast]);

  const removeFromCart = useCallback((bookId: number) => {
    setCart(prev => prev.filter(i => i.book.id !== bookId));
  }, []);

  const changeQty = useCallback((bookId: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.book.id !== bookId) return i;
      const newQty = i.qty + delta;
      if (newQty < 1) return i;
      if (newQty > MAX_SAME_BOOK_COPIES) {
        showToast(`⚠️ Máximo ${MAX_SAME_BOOK_COPIES} ejemplares del mismo libro (RF-CR-04)`, "error");
        return i;
      }
      if (newQty > i.book.stock) {
        showToast("⚠️ No hay suficiente stock disponible", "error");
        return i;
      }
      return { ...i, qty: newQty };
    }));
  }, [showToast]);

  const clearCart = useCallback(() => setCart([]), []);
  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  // ── COMPRA CON VALIDACIÓN DE SALDO (M8) ───────────────────
  const processPurchase = useCallback((purchase: Purchase): { success: boolean; error?: string; transactionId?: string } => {
    if (!user || user.role !== "cliente") {
      return { success: false, error: "Solo los clientes pueden realizar compras." };
    }
    if (user.balance < purchase.total) {
      return {
        success: false,
        error: `Saldo insuficiente. Tu saldo: ${fmt(user.balance)} — Total del pedido: ${fmt(purchase.total)}`,
      };
    }
    const transactionId = `TXW-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const newBalance = user.balance - purchase.total;
    // Descontar saldo y persistir en registeredUsers
    setUser(prev => prev ? { ...prev, balance: newBalance } : prev);
    setRegisteredUsers(users => {
      const next = users.map(u => u.id === user.id ? { ...u, balance: newBalance } : u);
      saveUsers(next);
      return next;
    });
    // Actualizar inventario (descuenta stock y sincroniza copyIds)
    setBooks(prev => prev.map(book => {
      const item = purchase.items.find(i => i.book.id === book.id);
      if (!item) return book;
      const newStock = Math.max(0, book.stock - item.qty);
      const copyIds = (book.copyIds ?? []).slice(0, newStock);
      return { ...book, stock: newStock, available: newStock > 0, copyIds };
    }));
    // Registrar compra
    setPurchases(prev => [purchase, ...prev]);
    // Registrar transacción en billetera
    setWalletTransactions(prev => [{
      id: transactionId,
      date: new Date(),
      type: "purchase",
      amount: -purchase.total,
      description: `Compra ${purchase.id} — ${purchase.items.map(i => i.book.title).join(", ").slice(0, 60)}`,
    }, ...prev]);
    // Vaciar carrito
    setCart([]);
    return { success: true, transactionId };
  }, [user]);

  // ── RESERVAS ───────────────────────────────────────────────
  const addReservation = useCallback((bookId: number) => {
    // Módulo 3: Solo clientes pueden reservar
    if (!user || user.role === "admin" || user.role === "root") {
      showToast("Solo los clientes registrados pueden reservar libros.", "error");
      return;
    }
    if (user.role === "visitante") {
      showToast("Debes iniciar sesión como cliente para reservar libros.", "error");
      return;
    }
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    if (!book.available || book.stock === 0) {
      showToast("⚠️ Este libro no está disponible para reserva", "error");
      return;
    }
    const active = reservations.filter(r => r.status === "active");
    const differentBooks = new Set(active.map(r => r.bookId));
    if (!differentBooks.has(bookId) && differentBooks.size >= MAX_DIFFERENT_BOOKS) {
      showToast(`⚠️ Límite de ${MAX_DIFFERENT_BOOKS} libros diferentes alcanzado (RF-CR-03)`, "error");
      return;
    }
    const sameBookReservations = active.filter(r => r.bookId === bookId).length;
    if (sameBookReservations >= MAX_SAME_BOOK_COPIES) {
      showToast(`⚠️ Ya tienes ${MAX_SAME_BOOK_COPIES} reservas del mismo libro (RF-CR-04)`, "error");
      return;
    }
    const now = new Date();
    const newRes: Reservation = {
      id: "R-" + Date.now().toString().slice(-6),
      bookId, book, createdAt: now, status: "active",
      expiresAt: new Date(now.getTime() + RESERVATION_HOURS * 3600000),
    };
    setReservations(prev => [...prev, newRes]);
    showToast(`📌 "${book.title}" reservado — válido por ${RESERVATION_HOURS}h`, "success");
  }, [user, books, reservations, showToast]);

  const cancelReservation = useCallback((id: string) => {
    const res = reservations.find(r => r.id === id);
    if (!res) return;
    setReservations(prev => prev.filter(r => r.id !== id));
    setReservationHistory(prev => [
      ...prev, { id: "RH-" + Date.now(), book: res.book, date: new Date(), status: "cancelled" },
    ]);
    setCancellations(prev => [{
      id: "C-" + Date.now(), type: "reservation", orderId: res.id,
      book: res.book, date: new Date(), reason: "Cancelado por el usuario",
    }, ...prev]);
    showToast(`Reserva de "${res.book.title}" cancelada`, "info");
  }, [reservations, showToast]);

  const convertReservationToCart = useCallback((id: string) => {
    const res = reservations.find(r => r.id === id);
    if (!res) return;
    setReservations(prev => prev.filter(r => r.id !== id));
    addToCart(res.bookId);
    setCartOpen(true);
  }, [reservations, addToCart]);

  const expireReservation = useCallback((id: string) => {
    const res = reservations.find(r => r.id === id);
    if (!res) return;
    setReservations(prev => prev.filter(r => r.id !== id));
    setReservationHistory(prev => [
      ...prev, { id: "RH-" + Date.now(), book: res.book, date: new Date(), status: "expired" },
    ]);
    showToast(`⏰ La reserva de "${res.book.title}" expiró tras ${RESERVATION_HOURS}h`, "info");
  }, [reservations, showToast]);

  const addPurchase = useCallback((purchase: Purchase) => {
    setPurchases(prev => [purchase, ...prev]);
  }, []);

  const cancelOrder = useCallback((orderId: string) => {
    const order = purchases.find(p => p.id === orderId);
    if (!order) return;
    if (order.status !== "preparing") {
      showToast("⚠️ Solo se pueden cancelar pedidos en estado 'En preparación'", "error");
      return;
    }
    setPurchases(prev => prev.map(p =>
      p.id === orderId ? { ...p, status: "cancelled" as const } : p
    ));
    setCancellations(prev => [{
      id: "C-" + Date.now(), type: "purchase", orderId,
      book: order.items[0].book, date: new Date(),
      reason: "Cancelado por el usuario", refund: order.total,
    }, ...prev]);
    setWalletTransactions(prev => [{
      id: `TXW-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      date: new Date(),
      type: "refund",
      amount: order.total,
      description: `Reembolso cancelación ${orderId}`,
    }, ...prev]);
    setUser(prev => {
      if (!prev) return prev;
      const newBalance = prev.balance + order.total;
      setRegisteredUsers(users => {
        const next = users.map(u => u.id === prev.id ? { ...u, balance: newBalance } : u);
        saveUsers(next);
        return next;
      });
      return { ...prev, balance: newBalance };
    });
    showToast("✓ Pedido cancelado — reembolso acreditado a tu billetera", "success");
  }, [purchases, showToast]);

  const returnOrder = useCallback((orderId: string, reason: string, description: string, qrCode: string) => {
    const order = purchases.find(p => p.id === orderId);
    if (!order) return;
    setPurchases(prev => prev.map(p =>
      p.id === orderId ? { ...p, status: "returned" as const } : p
    ));
    setCancellations(prev => [{
      id: "C-" + Date.now(), type: "purchase", orderId,
      book: order.items[0].book, date: new Date(),
      reason: description ? `${reason}: ${description}` : reason,
      refund: order.total,
    }, ...prev]);
    setWalletTransactions(prev => [{
      id: `TXW-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      date: new Date(),
      type: "refund",
      amount: order.total,
      description: `Reembolso devolución ${orderId}`,
    }, ...prev]);
    setUser(prev => {
      if (!prev) return prev;
      const newBalance = prev.balance + order.total;
      setRegisteredUsers(users => {
        const next = users.map(u => u.id === prev.id ? { ...u, balance: newBalance } : u);
        saveUsers(next);
        return next;
      });
      return { ...prev, balance: newBalance };
    });
    showToast(`✓ Devolución registrada · Código QR: ${qrCode}`, "success");
  }, [purchases, showToast]);

  // ── MÉTRICAS DE TENDENCIAS (caché 5 min) ─────────────────────
  const trendCacheRef = useRef<TrendMetrics | null>(null);
  const TREND_TTL_MS  = 5 * 60 * 1000; // 5 minutos

  const getTrendMetrics = useCallback((): TrendMetrics => {
    const cache = trendCacheRef.current;
    if (cache && Date.now() - cache.computedAt < TREND_TTL_MS) return cache;

    // Más vendidos: sumar qty de items en pedidos entregados
    const soldMap: Record<number, number> = {};
    purchases
      .filter(p => p.status === 'delivered')
      .flatMap(p => p.items)
      .forEach(item => { soldMap[item.book.id] = (soldMap[item.book.id] ?? 0) + item.qty; });
    const bestsellerIds = Object.entries(soldMap)
      .sort(([, a], [, b]) => b - a)
      .map(([id]) => Number(id));

    // Mejor calificados: avg de reviews aprobadas
    const ratingMap: Record<number, number[]> = {};
    reviews
      .filter(r => r.status === 'approved')
      .forEach(r => { ratingMap[r.bookId] ??= []; ratingMap[r.bookId].push(r.rating); });
    const topRatedIds = Object.entries(ratingMap)
      .map(([id, rs]) => ({ id: Number(id), avg: rs.reduce((s, n) => s + n, 0) / rs.length }))
      .sort((a, b) => b.avg - a.avg)
      .map(x => x.id);

    // Novedades: isNew=true o addedDate en los últimos 30 días
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const newBookIds = books
      .filter(b => b.isNew || (b.addedDate && new Date(b.addedDate).getTime() > cutoff))
      .map(b => b.id);

    const metrics: TrendMetrics = { bestsellerIds, topRatedIds, newBookIds, computedAt: Date.now() };
    trendCacheRef.current = metrics;
    return metrics;
  }, [purchases, reviews, books]);

  // Invalidar caché cuando cambien los datos fuente
  useEffect(() => { trendCacheRef.current = null; }, [purchases.length, reviews.length, books.length]);

  // ── BOT DE RECOMENDACIONES ────────────────────────────────────
  const sendBotMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: BotMessage = {
      id: `bmu-${Date.now()}`,
      sender: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };
    setBotMessages(prev => [...prev, userMsg]);
    setBotTyping(true);

    try {
      const deliveredPurchases  = purchases.filter(p => p.status === 'delivered');
      const purchasedBookIds    = deliveredPurchases.flatMap(p => p.items.map(i => i.book.id));
      const purchasedAuthors    = deliveredPurchases.flatMap(p => p.items.map(i => i.book.author));
      const purchasedCategories = deliveredPurchases.flatMap(p => p.items.flatMap(i => i.book.categories ?? []));

      const candidateBooks = books.map(b => ({
        id: b.id, title: b.title, author: b.author,
        categories: b.categories ?? [], price: b.price,
        rating: b.rating, available: b.available, isNew: b.isNew ?? false,
        cover: b.cover,
      }));

      // Métricas de tendencias (cacheadas)
      const trends = getTrendMetrics();

      const resp = await fetch('http://localhost:3001/api/bot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          userName: user?.name,
          message: text.trim(),
          candidateBooks,
          purchasedBookIds,
          purchasedAuthors,
          purchasedCategories,
          preferences: user?.temasPreferencia ?? [],
          bestsellerIds: trends.bestsellerIds,
          topRatedIds:   trends.topRatedIds,
          newBookIds:    trends.newBookIds,
        }),
      });

      if (!resp.ok) throw new Error('Backend no disponible');

      const data: { text: string; books?: BotMessage['books']; intent: string } = await resp.json();

      const botMsg: BotMessage = {
        id: `bmb-${Date.now()}`,
        sender: 'bot',
        content: data.text,
        books: data.books,
        intent: data.intent,
        timestamp: Date.now(),
      };
      setBotMessages(prev => [...prev, botMsg]);
    } catch {
      const errMsg: BotMessage = {
        id: `bmb-err-${Date.now()}`,
        sender: 'bot',
        content: '⚠️ El servicio de recomendaciones no está disponible en este momento (el servidor de IA no responde). Puedes explorar el catálogo manualmente o intentarlo de nuevo más tarde.',
        timestamp: Date.now(),
      };
      setBotMessages(prev => [...prev, errMsg]);
    } finally {
      setBotTyping(false);
    }
  }, [user, purchases, books]);

  const clearBotHistory = useCallback(() => {
    setBotMessages([]);
    localStorage.removeItem(STORAGE_KEY_BOT_MSGS);
  }, []);

  const spotlightBook  = useCallback((id: number) => setSpotlightBookId(id), []);
  const clearSpotlight = useCallback(() => setSpotlightBookId(null), []);

  // ── RECOMENDACIONES PERSONALIZADAS ───────────────────────────
  const refreshRecommendations = useCallback(async () => {
    if (!user || user.role !== 'cliente') { setRecommendations([]); return; }

    setRecommendationsLoading(true);
    try {
      // Señales desde compras entregadas
      const deliveredPurchases = purchases.filter(p => p.status === 'delivered');
      const purchasedBookIds   = deliveredPurchases.flatMap(p => p.items.map(i => i.book.id));
      const purchasedAuthors   = deliveredPurchases.flatMap(p => p.items.map(i => i.book.author));
      const purchasedCategories= deliveredPurchases.flatMap(p =>
        p.items.flatMap(i => i.book.categories ?? [])
      );

      // Señales desde reseñas con rating ≥ 4
      const highRatedBookIds = reviews
        .filter(r => r.userId === user.id && r.rating >= 4)
        .map(r => r.bookId);
      const highRatedCategories = highRatedBookIds.flatMap(bid => {
        const b = books.find(bk => bk.id === bid);
        return b?.categories ?? [];
      });

      // Búsquedas recientes desde localStorage
      let searchTerms: string[] = [];
      try {
        const raw = localStorage.getItem('biblion_search_history');
        searchTerms = raw ? (JSON.parse(raw) as string[]).slice(0, 10) : [];
      } catch { /* ignorar */ }

      // Catálogo candidato (todos los libros disponibles, excluyendo los ya poseídos)
      const ownedSet = new Set(purchasedBookIds);
      const candidateBooks = books
        .filter(b => !ownedSet.has(b.id))
        .map(b => ({ id: b.id, title: b.title, author: b.author, categories: b.categories ?? [] }));

      const resp = await fetch('http://localhost:3001/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchasedBookIds,
          purchasedAuthors,
          purchasedCategories,
          highRatedCategories,
          preferences: user.temasPreferencia ?? [],
          searchTerms,
          candidateBooks,
        }),
      });

      if (!resp.ok) throw new Error('Backend no disponible');

      const scored: { bookId: number; score: number; reason: string }[] = await resp.json();

      // Enriquecer con el objeto Book completo
      const enriched: Recommendation[] = scored
        .map(item => {
          const book = books.find(b => b.id === item.bookId);
          return book ? { book, reason: item.reason, score: item.score } : null;
        })
        .filter((r): r is Recommendation => r !== null);

      setRecommendations(enriched);
    } catch {
      // Si el backend no está disponible, silencio el error (no es crítico)
      setRecommendations([]);
    } finally {
      setRecommendationsLoading(false);
    }
  }, [user, purchases, reviews, books]);

  // Recalcular cuando cambien las señales clave
  useEffect(() => {
    refreshRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, purchases.length, reviews.length]);

  // ── RESEÑAS Y CALIFICACIONES ─────────────────────────────────
  const hasPurchasedBook = useCallback((bookId: number): boolean => {
    if (!user) return false;
    return purchases.some(
      p => p.userId === user.id && p.status === 'delivered' && p.items.some(i => i.book.id === bookId)
    );
  }, [user, purchases]);

  const hasReviewedBook = useCallback((bookId: number): boolean => {
    if (!user) return false;
    return reviews.some(r => r.bookId === bookId && r.userId === user.id);
  }, [user, reviews]);

  const getBookReviews = useCallback((bookId: number): Review[] => {
    return reviews.filter(r => r.bookId === bookId && r.status === 'approved')
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [reviews]);

  const getBookAvgRating = useCallback((bookId: number): number | null => {
    const approved = reviews.filter(r => r.bookId === bookId && r.status === 'approved');
    if (approved.length === 0) return null;
    const sum = approved.reduce((s, r) => s + r.rating, 0);
    return Math.round((sum / approved.length) * 10) / 10;
  }, [reviews]);

  const submitReview = useCallback(async (
    bookId: number,
    rating: number,
    comment: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Debes iniciar sesión para reseñar.' };
    if (!hasPurchasedBook(bookId))
      return { success: false, error: 'Solo puedes reseñar libros que hayas comprado y recibido.' };
    if (hasReviewedBook(bookId))
      return { success: false, error: 'Ya escribiste una reseña para este libro.' };
    if (rating < 1 || rating > 5)
      return { success: false, error: 'La calificación debe ser entre 1 y 5.' };
    if (!comment.trim())
      return { success: false, error: 'El comentario no puede estar vacío.' };

    const newReview: Review = {
      id: `rv-${user.id}-${bookId}-${Date.now()}`,
      bookId,
      userId: user.id,
      userName: user.name,
      rating,
      comment: comment.trim(),
      status: 'pending',
      createdAt: Date.now(),
    };

    // Persistir en localStorage de forma optimista
    setReviews(prev => [newReview, ...prev]);

    // Sincronizar con el backend (sin bloquear UI)
    try {
      await fetch('http://localhost:3001/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          userId: user.id,
          userName: user.name,
          rating,
          comment: comment.trim(),
        }),
      });
    } catch {
      // Si el backend no está disponible la reseña queda en localStorage
    }

    return { success: true };
  }, [user, hasPurchasedBook, hasReviewedBook]);

  const moderateReview = useCallback((reviewId: string, action: 'approved' | 'rejected') => {
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: action } : r));
  }, []);

  // ── MENSAJES DIRECTOS AL ADMIN ───────────────────────────────
  const sendDirectMessage = useCallback((content: string) => {
    if (!user) return;
    const convId = `conv-${user.id}`;
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = Date.now();
    const dmMsg: DmMessage = { id: msgId, sender: 'user', senderName: user.name, content, timestamp: now };

    setDirectMessages(prev => {
      const existing = prev.find(c => c.id === convId);
      if (existing) {
        return prev.map(c =>
          c.id === convId
            ? { ...c, status: 'pending_admin' as const, lastUserMsgAt: now, messages: [...c.messages, dmMsg], updatedAt: now }
            : c
        );
      }
      const newConv: DirectMessage = {
        id: convId, userId: user.id, userName: user.name,
        status: 'pending_admin', lastUserMsgAt: now, messages: [dmMsg], createdAt: now, updatedAt: now,
      };
      return [...prev, newConv];
    });

    socketRef.current?.emit('direct:send', {
      convId, msgId, userId: user.id, userName: user.name, content, timestamp: now,
    });
  }, [user]);

  const adminSendToUser = useCallback((userId: string, userName: string, content: string) => {
    if (!user) return;
    const convId = `conv-${userId}`;
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = Date.now();
    const dmMsg: DmMessage = { id: msgId, sender: 'admin', senderName: user.name, content, timestamp: now };

    setDirectMessages(prev => {
      const existing = prev.find(c => c.id === convId);
      if (existing) {
        return prev.map(c =>
          c.id === convId
            ? { ...c, status: 'pending_user' as const, lastUserMsgAt: 0, messages: [...c.messages, dmMsg], updatedAt: now }
            : c
        );
      }
      const newConv: DirectMessage = {
        id: convId, userId, userName,
        status: 'pending_user', lastUserMsgAt: 0, messages: [dmMsg], createdAt: now, updatedAt: now,
      };
      return [...prev, newConv];
    });

    socketRef.current?.emit('direct:admin_send', {
      convId, msgId, adminId: user.id, adminName: user.name, userId, userName, content, timestamp: now,
    });
  }, [user]);

  const markDirectMessageRead = useCallback((convId: string) => {
    if (!user) return;
    socketRef.current?.emit('direct:read', { convId, readerId: user.id, readerRole: user.role });
  }, [user]);

  // ── CHAT SYSTEM ──────────────────────────────────────────────
  const sendMessageToAdmin = useCallback((text: string) => {
    if (!user) return;
    setChats(prev => {
      const existingIdx = prev.findIndex(c => c.clientId === user.id && c.status === 'active');
      const now = Date.now();
      const newMsg: ChatMessage = { sender: 'user', text, timestamp: now };

      let nextState = [...prev];
      let targetChatId = "";

      if (existingIdx >= 0) {
        targetChatId = nextState[existingIdx].id;
        nextState[existingIdx] = {
          ...nextState[existingIdx],
          messages: [...nextState[existingIdx].messages, newMsg]
        };
      } else {
        targetChatId = "CHAT-" + now;
        const newChat: ChatSession = {
          id: targetChatId,
          clientId: user.id,
          clientName: user.name,
          status: 'active',
          startedAt: now,
          messages: [
            { sender: 'bot', text: '¡Hola! ¿En qué te podemos ayudar?', timestamp: now - 100 },
            newMsg
          ]
        };
        nextState = [newChat, ...nextState];
      }

      // Auto-reply
      setTimeout(() => {
        setChats(curr => {
          const idx = curr.findIndex(c => c.id === targetChatId);
          if (idx < 0) return curr;
          const updated = [...curr];
          updated[idx] = {
            ...updated[idx],
            messages: [...updated[idx].messages, { sender: 'bot', text: 'En breve un administrador se pondrá en contacto contigo.', timestamp: Date.now() }]
          };
          return updated;
        });
      }, 600);

      return nextState;
    });
  }, [user]);

  const replyToChat = useCallback((chatId: string, text: string) => {
    if (!user) return;
    const adminMsg: ChatMessage = {
      sender: 'admin',
      text,
      timestamp: Date.now(),
    };
    setChats(prev => prev.map(c =>
      c.id === chatId ? { ...c, messages: [...c.messages, adminMsg] } : c
    ));
  }, [user]);

  const resolveChat = useCallback((chatId: string) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, status: 'resolved' } : c));
    showToast("Chat resuelto", "success");
  }, [showToast]);

  return (
    <ShopContext.Provider value={{
      user, login, logout, register, registerAdmin, updateBalance, updateProfile, verifyPassword,
      books, addBook, updateBook, deleteBook,
      news, pendingNews: news.filter(n => n.status === "pending"),
      retryPendingNews,
      storeInventory, setStoreStock, getStoreStock,
      validateStoreCode, nearestStoreWithStock,
      cart, cartOpen, addToCart, removeFromCart, changeQty,
      clearCart, openCart, closeCart,
      processPurchase,
      reservations, addReservation, cancelReservation,
      convertReservationToCart, expireReservation,
      purchases, addPurchase, cancelOrder, returnOrder,
      reservationHistory, cancellations,
      botMessages, botTyping, sendBotMessage, clearBotHistory,
      spotlightBookId, spotlightBook, clearSpotlight,
      recommendations, recommendationsLoading, refreshRecommendations,
      reviews, submitReview, moderateReview, getBookReviews, getBookAvgRating, hasPurchasedBook, hasReviewedBook,
      chats, sendMessageToAdmin, replyToChat, resolveChat,
      directMessages, unreadDirectCount, pendingAdminCount,
      sendDirectMessage, adminSendToUser, markDirectMessageRead, resolveConversation,
      toast, toastType, showToast, dismissToast,
      walletTransactions, addWalletTransaction,
      adminsList, usersList, toggleAdminStatus, toggleUserStatus,
    }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
}
