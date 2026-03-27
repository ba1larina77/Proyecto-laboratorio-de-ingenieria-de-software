import {
  createContext, useContext, useState, useCallback, ReactNode
} from "react";
import type {
  Book, CartItem, Purchase, Reservation,
  ReservationHistory, Cancellation
} from "./shopTypes";

// ── TIPOS DE USUARIO Y ROL ────────────────────────────────────
export type UserRole = "root" | "admin" | "cliente" | "visitante";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  balance: number;      // Saldo en billetera digital (solo clientes)
  username: string;
}

// ── USUARIOS DEMO (simula BD) ────────────────────────────────
export const DEMO_USERS: (SessionUser & { password: string })[] = [
  {
    id: "U-ROOT-001", name: "Administrador Root", email: "root@biblion.co",
    username: "root", password: "root1234", role: "root", balance: 0,
  },
  {
    id: "U-ADM-001", name: "Carlos Rodríguez", email: "admin@biblion.co",
    username: "carlos.admin", password: "admin1234", role: "admin", balance: 0,
  },
  {
    // Credenciales principales del cliente demo
    id: "U-CLI-001", name: "Juan Carlos Pérez",
    email: "juan.perez@correo.com",          // ← correo mostrado en el formulario
    username: "juanperez", password: "12345678",  // ← contraseña corta e intuitiva
    role: "cliente", balance: 125800,
  },
  {
    // Alias adicional por si alguien usa el correo antiguo
    id: "U-CLI-001B", name: "Juan Carlos Pérez",
    email: "cliente@biblion.co",
    username: "juan.perez", password: "cliente1234",
    role: "cliente", balance: 125800,
  },
];

// ── INVENTARIO INICIAL ────────────────────────────────────────
const INITIAL_BOOKS: Book[] = [
  { id: 1, title: "Cien Años de Soledad", author: "Gabriel García Márquez", category: "Ficción", price: 28900, rating: 4.8, isNew: true, available: true, stock: 3, cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop", isbn: "978-84-376-0494-7" },
  { id: 2, title: "El Principito", author: "Antoine de Saint-Exupéry", category: "Ficción", price: 18500, rating: 4.9, isNew: true, available: true, stock: 8, cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=450&fit=crop", isbn: "978-84-261-1998-5" },
  { id: 3, title: "Breve Historia del Tiempo", author: "Stephen Hawking", category: "Ciencia", price: 35000, rating: 4.7, isNew: true, available: true, stock: 2, cover: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=300&h=450&fit=crop", isbn: "978-0-553-38016-3" },
  { id: 4, title: "Sapiens", author: "Yuval Noah Harari", category: "Historia", price: 42000, rating: 4.6, isNew: false, available: true, stock: 5, cover: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=300&h=450&fit=crop", isbn: "978-84-9992-441-0" },
  { id: 5, title: "Veinte Poemas de Amor", author: "Pablo Neruda", category: "Poesía", price: 15000, rating: 4.9, isNew: false, available: true, stock: 12, cover: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=450&fit=crop", isbn: "978-84-376-2049-7" },
  { id: 6, title: "1984", author: "George Orwell", category: "Ficción", price: 24500, rating: 4.8, isNew: false, available: false, stock: 0, cover: "https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=300&h=450&fit=crop", isbn: "978-0-14-028360-8" },
  { id: 7, title: "El Mundo de Sofía", author: "Jostein Gaarder", category: "Filosofía", price: 32000, rating: 4.7, isNew: false, available: true, stock: 4, cover: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=450&fit=crop", isbn: "978-84-7844-138-4" },
  { id: 8, title: "Historia del Arte", author: "Ernst Gombrich", category: "Arte", price: 68000, rating: 4.6, isNew: true, available: true, stock: 1, cover: "https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=300&h=450&fit=crop", isbn: "978-0-7148-3872-4" },
  { id: 9, title: "Don Quijote de la Mancha", author: "Miguel de Cervantes", category: "Ficción", price: 38000, rating: 4.5, isNew: false, available: true, stock: 6, cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=450&fit=crop", isbn: "978-84-9895-001-5" },
  { id: 10, title: "El Aleph", author: "Jorge Luis Borges", category: "Ficción", price: 22000, rating: 4.8, isNew: false, available: true, stock: 3, cover: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=300&h=450&fit=crop", isbn: "978-950-04-0009-2" },
  { id: 11, title: "Cosmos", author: "Carl Sagan", category: "Ciencia", price: 45000, rating: 4.9, isNew: true, available: true, stock: 7, cover: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=300&h=450&fit=crop", isbn: "978-84-344-2797-0" },
  { id: 12, title: "La Iliada", author: "Homero", category: "Historia", price: 29000, rating: 4.4, isNew: false, available: true, stock: 9, cover: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=300&h=450&fit=crop", isbn: "978-84-249-3521-1" },
];

export const STORES = [
  { id: 1, name: "Biblioteca Digital Centro", address: "Calle 19 #6-48, Centro, Pereira", distance: "0.8 km" },
  { id: 2, name: "Biblioteca Digital Circunvalar", address: "Av. Circunvalar #8-61, Pereira", distance: "2.3 km" },
  { id: 3, name: "Biblioteca Digital Pinares", address: "Cra. 14 #97-35, Pinares, Pereira", distance: "4.1 km" },
];

// ── CONSTANTES DE NEGOCIO ─────────────────────────────────────
export const MAX_DIFFERENT_BOOKS = 5;   // RF-CR-03
export const MAX_SAME_BOOK_COPIES = 3;  // RF-CR-04
export const RESERVATION_HOURS = 24;   // RF-CR-05
export const RETURN_DAYS_LIMIT = 8;    // RF-CR-12

// ── HELPERS ───────────────────────────────────────────────────
export function fmt(price: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", minimumFractionDigits: 0,
  }).format(price);
}

/** Genera un ID numérico único para libros */
function generateBookId(books: Book[]): number {
  const max = books.reduce((m, b) => Math.max(m, b.id), 0);
  return max + 1;
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
  }) => { success: boolean; error?: string };
  registerAdmin: (data: {
    nombres: string; apellidos: string; correo: string;
    usuario: string; contrasena: string;
  }) => { success: boolean; id?: string; error?: string };
  updateBalance: (amount: number) => void;

  // Inventario dinámico (admin/root)
  books: Book[];
  addBook: (data: Omit<Book, "id" | "isbn"> & { isbn?: string }) => Book;
  updateBook: (id: number, data: Partial<Book>) => void;
  deleteBook: (id: number) => void;

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
  processPurchase: (purchase: Purchase) => { success: boolean; error?: string };

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

  // Toast
  toast: string;
  toastType: "success" | "error" | "info";
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

const ShopContext = createContext<ShopContextType | null>(null);

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


// ── PERSISTENCIA EN localStorage ─────────────────────────────
const LS_USERS_KEY = "biblion_users_v1";

function loadUsers(): (SessionUser & { password: string })[] {
  try {
    const raw = localStorage.getItem(LS_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as (SessionUser & { password: string })[];
      // Fusionar: los DEMO_USERS siempre presentes, más los que se guardaron
      const merged = [...DEMO_USERS];
      for (const u of parsed) {
        if (!merged.find(m => m.id === u.id)) merged.push(u);
      }
      return merged;
    }
  } catch (_) { /* ignorar errores de parseo */ }
  return [...DEMO_USERS];
}

function saveUsers(users: (SessionUser & { password: string })[]) {
  try {
    // Solo guardar los usuarios que NO son demo (los nuevos)
    const extra = users.filter(u => !DEMO_USERS.find(d => d.id === u.id));
    localStorage.setItem(LS_USERS_KEY, JSON.stringify(extra));
  } catch (_) { /* ignorar si localStorage no está disponible */ }
}

// ── PROVIDER ──────────────────────────────────────────────────
export function ShopProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  // Lista dinámica de usuarios — persistida en localStorage
  const [registeredUsers, setRegisteredUsers] = useState<(SessionUser & { password: string })[]>(() => loadUsers());
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([
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
  ]);
  const [purchases, setPurchases] = useState<Purchase[]>(INITIAL_PURCHASES);
  const [reservationHistory, setReservationHistory] = useState<ReservationHistory[]>([
    { id: "RH-001", book: INITIAL_BOOKS[1], date: new Date("2024-11-20"), status: "expired" },
    { id: "RH-002", book: INITIAL_BOOKS[5], date: new Date("2024-12-01"), status: "cancelled" },
  ]);
  const [cancellations, setCancellations] = useState<Cancellation[]>([
    { id: "C-001", type: "purchase", orderId: "P-2024-000", book: INITIAL_BOOKS[5], date: new Date("2024-10-28"), reason: "Precio incorrecto", refund: 24500 },
  ]);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  const showToast = useCallback((msg: string, type: "success" | "error" | "info" = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 3500);
  }, []);

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
    const { password: _pw, ...sessionUser } = found;
    setUser(sessionUser);
    return { success: true, role: found.role };
  }, [registeredUsers]);

  const logout = useCallback(() => {
    setUser(null);
    setCart([]);
    setCartOpen(false);
  }, []);

  // ── REGISTRO DE NUEVO USUARIO (cliente) ────────────────────
  const register = useCallback((data: {
    nombres: string; apellidos: string; dni: string;
    fechaNacimiento: string; lugarNacimiento: string;
    direccion: string; genero: string;
    correo: string; usuario: string; contrasena: string;
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
    nombres: string; apellidos: string; correo: string;
    usuario: string; contrasena: string;
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
      name: `${data.nombres.trim()} ${data.apellidos.trim()}`,
      email: data.correo.trim().toLowerCase(),
      username: data.usuario.trim().toLowerCase(),
      password: data.contrasena,
      role: "admin",
      balance: 0,
    };
    setRegisteredUsers(prev => {
      const next = [...prev, newAdmin];
      saveUsers(next);   // ← persiste en localStorage
      return next;
    });
    return { success: true, id };
  }, [registeredUsers]);

  const updateBalance = useCallback((amount: number) => {
    setUser(prev => prev ? { ...prev, balance: prev.balance + amount } : prev);
  }, []);

  // ── INVENTARIO DINÁMICO (admin / root) ─────────────────────
  const addBook = useCallback((data: Omit<Book, "id" | "isbn"> & { isbn?: string }): Book => {
    const newBook: Book = {
      ...data,
      id: generateBookId(books),
      isbn: data.isbn || generateISBN(books),
    };
    setBooks(prev => [...prev, newBook]);
    return newBook;
  }, [books]);

  const updateBook = useCallback((id: number, data: Partial<Book>) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, ...data, available: (data.stock ?? b.stock) > 0 } : b));
  }, []);

  const deleteBook = useCallback((id: number) => {
    setBooks(prev => prev.filter(b => b.id !== id));
  }, []);

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
  const processPurchase = useCallback((purchase: Purchase) => {
    if (!user || user.role !== "cliente") {
      return { success: false, error: "Solo los clientes pueden realizar compras." };
    }
    if (user.balance < purchase.total) {
      return {
        success: false,
        error: `Saldo insuficiente. Tu saldo: ${fmt(user.balance)} — Total del pedido: ${fmt(purchase.total)}`,
      };
    }
    // Descontar saldo
    setUser(prev => prev ? { ...prev, balance: prev.balance - purchase.total } : prev);
    // Actualizar inventario
    setBooks(prev => prev.map(book => {
      const item = purchase.items.find(i => i.book.id === book.id);
      if (!item) return book;
      const newStock = Math.max(0, book.stock - item.qty);
      return { ...book, stock: newStock, available: newStock > 0 };
    }));
    // Registrar compra
    setPurchases(prev => [purchase, ...prev]);
    // Vaciar carrito
    setCart([]);
    return { success: true };
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
    showToast("✓ Pedido cancelado — reembolso en 3-5 días hábiles", "success");
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
    showToast(`✓ Devolución registrada · Código QR: ${qrCode}`, "success");
  }, [purchases, showToast]);

  return (
    <ShopContext.Provider value={{
      user, login, logout, register, registerAdmin, updateBalance,
      books, addBook, updateBook, deleteBook,
      cart, cartOpen, addToCart, removeFromCart, changeQty,
      clearCart, openCart, closeCart,
      processPurchase,
      reservations, addReservation, cancelReservation,
      convertReservationToCart, expireReservation,
      purchases, addPurchase, cancelOrder, returnOrder,
      reservationHistory, cancellations,
      toast, toastType, showToast,
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
