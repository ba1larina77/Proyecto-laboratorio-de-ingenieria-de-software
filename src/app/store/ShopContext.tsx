import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type {
  Book, CartItem, Purchase, Reservation,
  ReservationHistory, Cancellation
} from "./shopTypes";

// ── STATIC DATA ──────────────────────────────────────────────
export const BOOKS: Book[] = [
  { id:1, title:"Cien Años de Soledad", author:"Gabriel García Márquez", category:"Ficción", price:28900, rating:4.8, isNew:true, available:true, stock:3, cover:"https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop", isbn:"978-84-376-0494-7" },
  { id:2, title:"El Principito", author:"Antoine de Saint-Exupéry", category:"Ficción", price:18500, rating:4.9, isNew:true, available:true, stock:8, cover:"https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=450&fit=crop", isbn:"978-84-261-1998-5" },
  { id:3, title:"Breve Historia del Tiempo", author:"Stephen Hawking", category:"Ciencia", price:35000, rating:4.7, isNew:true, available:true, stock:2, cover:"https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=300&h=450&fit=crop", isbn:"978-0-553-38016-3" },
  { id:4, title:"Sapiens", author:"Yuval Noah Harari", category:"Historia", price:42000, rating:4.6, isNew:false, available:true, stock:5, cover:"https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=300&h=450&fit=crop", isbn:"978-84-9992-441-0" },
  { id:5, title:"Veinte Poemas de Amor", author:"Pablo Neruda", category:"Poesía", price:15000, rating:4.9, isNew:false, available:true, stock:12, cover:"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=450&fit=crop", isbn:"978-84-376-2049-7" },
  { id:6, title:"1984", author:"George Orwell", category:"Ficción", price:24500, rating:4.8, isNew:false, available:false, stock:0, cover:"https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=300&h=450&fit=crop", isbn:"978-0-14-028360-8" },
  { id:7, title:"El Mundo de Sofía", author:"Jostein Gaarder", category:"Filosofía", price:32000, rating:4.7, isNew:false, available:true, stock:4, cover:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=450&fit=crop", isbn:"978-84-7844-138-4" },
  { id:8, title:"Historia del Arte", author:"Ernst Gombrich", category:"Arte", price:68000, rating:4.6, isNew:true, available:true, stock:1, cover:"https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=300&h=450&fit=crop", isbn:"978-0-7148-3872-4" },
  { id:9, title:"Don Quijote de la Mancha", author:"Miguel de Cervantes", category:"Ficción", price:38000, rating:4.5, isNew:false, available:true, stock:6, cover:"https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=450&fit=crop", isbn:"978-84-9895-001-5" },
  { id:10, title:"El Aleph", author:"Jorge Luis Borges", category:"Ficción", price:22000, rating:4.8, isNew:false, available:true, stock:3, cover:"https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=300&h=450&fit=crop", isbn:"978-950-04-0009-2" },
  { id:11, title:"Cosmos", author:"Carl Sagan", category:"Ciencia", price:45000, rating:4.9, isNew:true, available:true, stock:7, cover:"https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=300&h=450&fit=crop", isbn:"978-84-344-2797-0" },
  { id:12, title:"La Iliada", author:"Homero", category:"Historia", price:29000, rating:4.4, isNew:false, available:true, stock:9, cover:"https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=300&h=450&fit=crop", isbn:"978-84-249-3521-1" },
];

export const STORES = [
  { id:1, name:"Biblioteca Digital Centro", address:"Calle 19 #6-48, Centro, Pereira", distance:"0.8 km" },
  { id:2, name:"Biblioteca Digital Circunvalar", address:"Av. Circunvalar #8-61, Pereira", distance:"2.3 km" },
  { id:3, name:"Biblioteca Digital Pinares", address:"Cra. 14 #97-35, Pinares, Pereira", distance:"4.1 km" },
];

// RF-CR-03: Máximo 5 libros diferentes por usuario
export const MAX_DIFFERENT_BOOKS = 5;
// RF-CR-04: Máximo 3 ejemplares del mismo libro
export const MAX_SAME_BOOK_COPIES = 3;
// RF-CR-05: Vigencia de reserva 24 horas
export const RESERVATION_HOURS = 24;
// RF-CR-12: Plazo de devolución 8 días desde recepción
export const RETURN_DAYS_LIMIT = 8;

export function fmt(price: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(price);
}

/** RF-CR-12: Verifica si una compra está dentro del plazo de devolución (8 días) */
export function isReturnEligible(purchase: Purchase): boolean {
  if (purchase.status !== "delivered") return false;
  const deliveredStep = purchase.tracking.find(t => t.status === "Entregado" && t.done && t.date);
  if (!deliveredStep || !deliveredStep.date) return false;
  const deliveredDate = new Date(deliveredStep.deliveredAt || purchase.date);
  const diffDays = (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= RETURN_DAYS_LIMIT;
}

// ── CONTEXT ──────────────────────────────────────────────────
interface ShopContextType {
  cart: CartItem[];
  reservations: Reservation[];
  purchases: Purchase[];
  reservationHistory: ReservationHistory[];
  cancellations: Cancellation[];
  cartOpen: boolean;
  toast: string;
  toastType: "success" | "error" | "info";
  addToCart: (bookId: number) => void;
  removeFromCart: (bookId: number) => void;
  changeQty: (bookId: number, delta: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  addReservation: (bookId: number) => void;
  cancelReservation: (id: string) => void;
  convertReservationToCart: (id: string) => void;
  expireReservation: (id: string) => void;
  addPurchase: (purchase: Purchase) => void;
  cancelOrder: (orderId: string) => void;
  returnOrder: (orderId: string, reason: string, description: string, qrCode: string) => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

const ShopContext = createContext<ShopContextType | null>(null);

const INITIAL_PURCHASES: Purchase[] = [
  {
    id: "P-2024-001", date: new Date("2024-11-15"),
    items: [{ book: BOOKS[0], qty: 1, price: 28900 }, { book: BOOKS[4], qty: 2, price: 15000 }],
    total: 58900, status: "delivered", delivery: "shipping", address: "Calle 100 #15-20, Bogotá",
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
    items: [{ book: BOOKS[2], qty: 1, price: 35000 }],
    total: 35000, status: "transit", delivery: "shipping", address: "Calle 100 #15-20, Bogotá",
    tracking: [
      { status: "Pedido recibido", done: true, date: "2 Dic 10:00" },
      { status: "En preparación", done: true, date: "2 Dic 14:00" },
      { status: "Enviado", done: true, date: "3 Dic 09:00" },
      { status: "Entregado", done: false, date: "" },
    ],
  },
  {
    id: "P-2024-003", date: new Date("2024-12-10"),
    items: [{ book: BOOKS[8], qty: 1, price: 38000 }],
    total: 38000, status: "preparing", delivery: "pickup", store: "Biblioteca Digital Centro",
    tracking: [
      { status: "Pedido recibido", done: true, date: "10 Dic 16:45" },
      { status: "En preparación", done: false, date: "" },
      { status: "Listo para recoger", done: false, date: "" },
      { status: "Recogido", done: false, date: "" },
    ],
  },
];

const INITIAL_RES_HISTORY: ReservationHistory[] = [
  { id: "RH-001", book: BOOKS[1], date: new Date("2024-11-20"), status: "expired" },
  { id: "RH-002", book: BOOKS[5], date: new Date("2024-12-01"), status: "cancelled" },
];

const INITIAL_CANCELLATIONS: Cancellation[] = [
  { id: "C-001", type: "purchase", orderId: "P-2024-000", book: BOOKS[5], date: new Date("2024-10-28"), reason: "Precio incorrecto", refund: 24500 },
  { id: "C-002", type: "reservation", orderId: "RH-002", book: BOOKS[5], date: new Date("2024-12-01"), reason: "Ya no disponible" },
];

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([
    { id: "R-001", bookId: 4, book: BOOKS[3], createdAt: new Date(Date.now() - 18 * 3600000), status: "active", expiresAt: new Date(Date.now() + 6 * 3600000) },
    { id: "R-002", bookId: 7, book: BOOKS[6], createdAt: new Date(Date.now() - 2 * 3600000), status: "active", expiresAt: new Date(Date.now() + 22 * 3600000) },
  ]);
  const [purchases, setPurchases] = useState<Purchase[]>(INITIAL_PURCHASES);
  const [reservationHistory, setReservationHistory] = useState<ReservationHistory[]>(INITIAL_RES_HISTORY);
  const [cancellations, setCancellations] = useState<Cancellation[]>(INITIAL_CANCELLATIONS);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  const showToast = useCallback((msg: string, type: "success" | "error" | "info" = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 3500);
  }, []);

  // RF-CR-10: Agregar al carrito con validaciones
  const addToCart = useCallback((bookId: number) => {
    const book = BOOKS.find(b => b.id === bookId);
    if (!book) return;
    // CU-CR-003 Alterno C: libro sin disponibilidad
    if (!book.available || book.stock === 0) {
      showToast("⚠️ Este libro no tiene disponibilidad en inventario", "error");
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.book.id === bookId);
      if (existing) {
        // RF-CR-04: Máximo 3 ejemplares del mismo libro
        if (existing.qty >= MAX_SAME_BOOK_COPIES) {
          showToast(`⚠️ Máximo ${MAX_SAME_BOOK_COPIES} ejemplares del mismo libro por pedido (RF-CR-04)`, "error");
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
  }, [showToast]);

  const removeFromCart = useCallback((bookId: number) => {
    setCart(prev => prev.filter(i => i.book.id !== bookId));
  }, []);

  // RF-CR-10: Modificar cantidad con validación RF-CR-04
  const changeQty = useCallback((bookId: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.book.id !== bookId) return i;
      const newQty = i.qty + delta;
      if (newQty < 1) return i;
      // RF-CR-04: máximo 3 ejemplares del mismo libro
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

  // RF-CR-02, RF-CR-03, RF-CR-04: Reservar con todas las restricciones
  const addReservation = useCallback((bookId: number) => {
    const book = BOOKS.find(b => b.id === bookId);
    if (!book) return;

    // CU-CR-002 Alterno B: libro no disponible
    if (!book.available || book.stock === 0) {
      showToast("⚠️ Este libro no está disponible para reserva", "error");
      return;
    }

    const active = reservations.filter(r => r.status === "active");

    // RF-CR-03: Máximo 5 libros DIFERENTES
    const differentBooks = new Set(active.map(r => r.bookId));
    if (!differentBooks.has(bookId) && differentBooks.size >= MAX_DIFFERENT_BOOKS) {
      showToast(`⚠️ Límite de ${MAX_DIFFERENT_BOOKS} libros diferentes en reserva alcanzado (RF-CR-03)`, "error");
      return;
    }

    // RF-CR-04: Máximo 3 ejemplares del mismo libro
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
    showToast(`📌 "${book.title}" reservado — válido por ${RESERVATION_HOURS} horas`, "success");
  }, [reservations, showToast]);

  // CU-CR-002 Alterno D: Cancelar reserva por el usuario
  const cancelReservation = useCallback((id: string) => {
    const res = reservations.find(r => r.id === id);
    if (!res) return;
    setReservations(prev => prev.filter(r => r.id !== id));
    setReservationHistory(prev => [...prev, { id: "RH-" + Date.now(), book: res.book, date: new Date(), status: "cancelled" }]);
    setCancellations(prev => [{ id: "C-" + Date.now(), type: "reservation", orderId: res.id, book: res.book, date: new Date(), reason: "Cancelado por el usuario" }, ...prev]);
    showToast(`Reserva de "${res.book.title}" cancelada`, "info");
  }, [reservations, showToast]);

  const convertReservationToCart = useCallback((id: string) => {
    const res = reservations.find(r => r.id === id);
    if (!res) return;
    setReservations(prev => prev.filter(r => r.id !== id));
    addToCart(res.bookId);
    setCartOpen(true);
  }, [reservations, addToCart]);

  // RF-CR-06: Liberar reserva automáticamente al cumplirse 24 horas
  const expireReservation = useCallback((id: string) => {
    const res = reservations.find(r => r.id === id);
    if (!res) return;
    setReservations(prev => prev.filter(r => r.id !== id));
    setReservationHistory(prev => [...prev, { id: "RH-" + Date.now(), book: res.book, date: new Date(), status: "expired" }]);
    showToast(`⏰ La reserva de "${res.book.title}" expiró tras ${RESERVATION_HOURS}h`, "info");
  }, [reservations, showToast]);

  const addPurchase = useCallback((purchase: Purchase) => {
    setPurchases(prev => [purchase, ...prev]);
  }, []);

  // CU-CR-004: Cancelar compra — solo si está en estado "preparing"
  const cancelOrder = useCallback((orderId: string) => {
    const order = purchases.find(p => p.id === orderId);
    if (!order) return;
    // CU-CR-004 Alterno A: Compra no cancelable
    if (order.status !== "preparing") {
      showToast("⚠️ Solo se pueden cancelar pedidos en estado 'En preparación'", "error");
      return;
    }
    setPurchases(prev => prev.map(p => p.id === orderId ? { ...p, status: "cancelled" as const } : p));
    setCancellations(prev => [{
      id: "C-" + Date.now(), type: "purchase", orderId,
      book: order.items[0].book, date: new Date(),
      reason: "Cancelado por el usuario", refund: order.total
    }, ...prev]);
    showToast("✓ Pedido cancelado — el reembolso se procesará en 3-5 días hábiles", "success");
  }, [purchases, showToast]);

  // CU-CR-005: Solicitar devolución con validación RF-CR-12 (8 días)
  const returnOrder = useCallback((orderId: string, reason: string, description: string, qrCode: string) => {
    const order = purchases.find(p => p.id === orderId);
    if (!order) return;
    setPurchases(prev => prev.map(p =>
      p.id === orderId ? { ...p, status: "returned" as const } : p
    ));
    if (order) {
      setCancellations(prev => [{
        id: "C-" + Date.now(), type: "purchase", orderId,
        book: order.items[0].book, date: new Date(),
        reason: description ? `${reason}: ${description}` : reason,
        refund: order.total
      }, ...prev]);
    }
    showToast(`✓ Devolución registrada · Código QR: ${qrCode}`, "success");
  }, [purchases, showToast]);

  return (
    <ShopContext.Provider value={{
      cart, reservations, purchases, reservationHistory, cancellations,
      cartOpen, toast, toastType,
      addToCart, removeFromCart, changeQty, clearCart,
      openCart, closeCart,
      addReservation, cancelReservation, convertReservationToCart, expireReservation,
      addPurchase, cancelOrder, returnOrder,
      showToast,
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
