/**
 * Tests M2 — Módulo Compra y Reserva
 *
 * Nota: el contexto arranca con 2 reservas DEMO y 2 entradas en history.
 * Los tests miden el delta sobre ese baseline.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ReactNode } from "react";
import { ShopProvider, useShop } from "../../src/app/store/ShopContext";
import { seedUsersStorage } from "../test-utils";
import type { Purchase } from "../../src/app/store/shopTypes";

function Wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter><ShopProvider>{children}</ShopProvider></MemoryRouter>;
}

function captureContext() {
  let captured: ReturnType<typeof useShop> | null = null;
  function Probe() { captured = useShop(); return null; }
  render(<Probe />, { wrapper: Wrapper });
  return () => captured!;
}

function loginAsClient(ctx: () => ReturnType<typeof useShop>) {
  act(() => {
    ctx().login("juan.perez@correo.com", "12345678");
  });
}

describe("M2-HU3: Carrito de compras", () => {
  beforeEach(() => seedUsersStorage());

  it("addToCart requiere usuario cliente logueado", () => {
    const ctx = captureContext();
    act(() => ctx().addToCart(1));
    expect(ctx().cart.length).toBe(0);
  });

  it("añade un libro al carrito cuando el cliente está logueado", () => {
    const ctx = captureContext();
    loginAsClient(ctx);
    act(() => ctx().addToCart(1));
    expect(ctx().cart.length).toBe(1);
    expect(ctx().cart[0].book.id).toBe(1);
    expect(ctx().cart[0].qty).toBe(1);
  });

  it("incrementa la cantidad si se añade el mismo libro de nuevo", () => {
    const ctx = captureContext();
    loginAsClient(ctx);
    act(() => {
      ctx().addToCart(2);
      ctx().addToCart(2);
    });
    expect(ctx().cart.length).toBe(1);
    expect(ctx().cart[0].qty).toBe(2);
  });

  it("RF-CR-04: no permite más de 3 copias del mismo libro", () => {
    const ctx = captureContext();
    loginAsClient(ctx);
    act(() => {
      ctx().addToCart(2);
      ctx().addToCart(2);
      ctx().addToCart(2);
      ctx().addToCart(2);
    });
    expect(ctx().cart[0].qty).toBe(3);
  });

  it("removeFromCart elimina un libro", () => {
    const ctx = captureContext();
    loginAsClient(ctx);
    act(() => {
      ctx().addToCart(1);
      ctx().addToCart(2);
    });
    expect(ctx().cart.length).toBe(2);
    act(() => ctx().removeFromCart(1));
    expect(ctx().cart.length).toBe(1);
    expect(ctx().cart[0].book.id).toBe(2);
  });

  it("clearCart vacía el carrito", () => {
    const ctx = captureContext();
    loginAsClient(ctx);
    act(() => {
      ctx().addToCart(1);
      ctx().addToCart(2);
    });
    act(() => ctx().clearCart());
    expect(ctx().cart.length).toBe(0);
  });

  it("changeQty modifica la cantidad de un libro", () => {
    const ctx = captureContext();
    loginAsClient(ctx);
    act(() => ctx().addToCart(2));
    act(() => ctx().changeQty(2, 1));
    expect(ctx().cart[0].qty).toBe(2);
    act(() => ctx().changeQty(2, -1));
    expect(ctx().cart[0].qty).toBe(1);
  });
});

describe("M2-HU2: Reservas", () => {
  beforeEach(() => seedUsersStorage());

  it("addReservation crea una reserva activa nueva (delta sobre baseline)", () => {
    const ctx = captureContext();
    loginAsClient(ctx);
    const before = ctx().reservations.length;
    act(() => ctx().addReservation(1));
    const after = ctx().reservations.length;
    expect(after).toBe(before + 1);
    const created = ctx().reservations.find(r => r.bookId === 1);
    expect(created).toBeTruthy();
    expect(created!.status).toBe("active");
  });

  it("la reserva tiene fecha de expiración (24 h después)", () => {
    const ctx = captureContext();
    loginAsClient(ctx);
    act(() => ctx().addReservation(1));
    const created = ctx().reservations.find(r => r.bookId === 1)!;
    const diffMs = created.expiresAt.getTime() - created.createdAt.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    expect(diffHours).toBeCloseTo(24, 0);
  });

  it("RF-CR-03: no permite superar 5 libros diferentes reservados", () => {
    const ctx = captureContext();
    loginAsClient(ctx);
    // Limpia el baseline para tener control determinista
    act(() => {
      const baselineIds = ctx().reservations.map(r => r.id);
      for (const id of baselineIds) ctx().cancelReservation(id);
    });
    // Cada addReservation va en su propio act() para que el estado
    // se actualice entre llamadas (sino se lee del closure stale).
    act(() => ctx().addReservation(1));
    act(() => ctx().addReservation(2));
    act(() => ctx().addReservation(3));
    act(() => ctx().addReservation(5));
    act(() => ctx().addReservation(7));
    act(() => ctx().addReservation(8)); // 6º — debe ser bloqueado por RF-CR-03
    act(() => ctx().addReservation(9)); // 7º — también bloqueado
    expect(ctx().reservations.length).toBe(5);
  });

  it("cancelReservation mueve la reserva al historial como 'cancelled'", () => {
    const ctx = captureContext();
    loginAsClient(ctx);
    act(() => ctx().addReservation(1));
    const newRes = ctx().reservations.find(r => r.bookId === 1)!;
    const resCountBefore = ctx().reservations.length;
    const historyCountBefore = ctx().reservationHistory.length;
    act(() => ctx().cancelReservation(newRes.id));
    expect(ctx().reservations.find(r => r.id === newRes.id)).toBeUndefined();
    expect(ctx().reservations.length).toBe(resCountBefore - 1);
    expect(ctx().reservationHistory.length).toBe(historyCountBefore + 1);
    // La entrada en history tiene un ID nuevo ("RH-...") pero conserva el libro original.
    // Buscamos por bookId del libro reservado.
    const cancelled = ctx().reservationHistory.find(
      r => r.book.id === newRes.bookId && r.status === "cancelled"
    );
    expect(cancelled).toBeTruthy();
    expect(cancelled!.status).toBe("cancelled");
  });
});

describe("M2-HU4: Compra (purchase) y M2-HU6: historial", () => {
  beforeEach(() => seedUsersStorage());

  it("addPurchase añade al historial de compras", () => {
    const ctx = captureContext();
    loginAsClient(ctx);
    const purchase: Purchase = {
      id: "P-TEST-001",
      date: new Date(),
      items: [{ book: ctx().books[0], qty: 1, price: ctx().books[0].price }],
      total: ctx().books[0].price,
      status: "preparing",
      delivery: "shipping",
      address: "Calle 1",
      tracking: [{ status: "Confirmado", done: true, date: new Date().toISOString() }],
    };
    act(() => ctx().addPurchase(purchase));
    expect(ctx().purchases.find(p => p.id === "P-TEST-001")).toBeTruthy();
  });
});

describe("M2-HU7: Devolución con QR — plazo de 8 días", () => {
  beforeEach(() => seedUsersStorage());

  it("returnOrder marca la compra como 'returned'", () => {
    const ctx = captureContext();
    loginAsClient(ctx);
    const purchase: Purchase = {
      id: "P-RET-001",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      items: [{ book: ctx().books[0], qty: 1, price: ctx().books[0].price }],
      total: ctx().books[0].price,
      status: "delivered",
      delivery: "shipping",
      tracking: [],
    };
    act(() => ctx().addPurchase(purchase));
    act(() => ctx().returnOrder("P-RET-001", "Producto defectuoso", "Llegó dañado", "QR-XYZ-123"));
    const after = ctx().purchases.find(p => p.id === "P-RET-001")!;
    expect(after.status).toBe("returned");
  });

  it("cancelOrder mueve la compra a cancelaciones", () => {
    const ctx = captureContext();
    loginAsClient(ctx);
    const purchase: Purchase = {
      id: "P-CANC-001",
      date: new Date(),
      items: [{ book: ctx().books[0], qty: 1, price: ctx().books[0].price }],
      total: ctx().books[0].price,
      status: "preparing",
      delivery: "shipping",
      tracking: [],
    };
    const before = ctx().cancellations.length;
    act(() => ctx().addPurchase(purchase));
    act(() => ctx().cancelOrder("P-CANC-001"));
    expect(ctx().cancellations.length).toBe(before + 1);
  });
});
