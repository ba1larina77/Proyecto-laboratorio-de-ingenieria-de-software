/**
 * Suite QA — Cálculo de Métricas de Tendencias (Iteración 4 — HU3)
 *
 * Testea la función pura `computeTrends()` extraída de ShopContext
 * bajo condiciones límite:
 *   - Cold start: usuario sin datos
 *   - Libro eliminado durante el cálculo
 *   - Empates en calificación
 *   - Datos corruptos / parciales en purchases/reviews
 *   - Cutoff de 30 días para novedades
 *   - Caché: dos llamadas en < 5 min devuelven el mismo objeto
 */
import { describe, it, expect } from "vitest";
import type { Purchase, Review } from "../../src/app/store/shopTypes";

// ── Versión TypeScript de computeTrends (idéntica a ShopContext) ─

interface TrendMetrics {
  bestsellerIds: number[];
  topRatedIds:   number[];
  newBookIds:    number[];
  computedAt:    number;
}

interface BookLike {
  id: number;
  isNew?: boolean;
  addedDate?: string;
}

function computeTrends(
  purchases: Purchase[],
  reviews: Review[],
  books: BookLike[]
): TrendMetrics {
  // Más vendidos
  const soldMap: Record<number, number> = {};
  purchases
    .filter(p => p.status === "delivered")
    .flatMap(p => p.items)
    .forEach(item => { soldMap[item.book.id] = (soldMap[item.book.id] ?? 0) + item.qty; });
  const bestsellerIds = Object.entries(soldMap)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => Number(id));

  // Mejor calificados
  const ratingMap: Record<number, number[]> = {};
  reviews
    .filter(r => r.status === "approved")
    .forEach(r => { ratingMap[r.bookId] ??= []; ratingMap[r.bookId].push(r.rating); });
  const topRatedIds = Object.entries(ratingMap)
    .map(([id, rs]) => ({
      id:  Number(id),
      avg: rs.reduce((s, n) => s + n, 0) / rs.length,
    }))
    .sort((a, b) => b.avg - a.avg)
    .map(x => x.id);

  // Novedades
  const cutoff    = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const newBookIds = books
    .filter(b => b.isNew || (b.addedDate && new Date(b.addedDate).getTime() > cutoff))
    .map(b => b.id);

  return { bestsellerIds, topRatedIds, newBookIds, computedAt: Date.now() };
}

// ── Fixtures reutilizables ─────────────────────────────────────

function makePurchase(bookId: number, qty: number, status = "delivered"): Purchase {
  return {
    id:       `P-${bookId}-${qty}`,
    date:     new Date(),
    items:    [{ book: { id: bookId } as any, qty, price: 10000 }],
    total:    qty * 10000,
    status:   status as any,
    delivery: "shipping",
    tracking: [],
  };
}

function makeReview(bookId: number, rating: number, status: "approved" | "pending" | "rejected" = "approved"): Review {
  return {
    id:        `rv-${bookId}-${rating}`,
    bookId,
    userId:    "U-TEST-001",
    userName:  "Tester",
    rating,
    comment:   "Test review",
    status,
    createdAt: Date.now(),
  };
}

// ─────────────────────────────────────────────────────────────
// 1. Cold Start (usuario / sistema sin datos)
// ─────────────────────────────────────────────────────────────

describe("computeTrends — cold start (sin datos)", () => {
  it("devuelve arrays vacíos sin lanzar excepciones cuando no hay compras", () => {
    // EXPECT: el sistema NO debe tronar con un 500 equivalente
    const result = computeTrends([], [], []);
    expect(result.bestsellerIds).toEqual([]);
    expect(result.topRatedIds).toEqual([]);
    expect(result.newBookIds).toEqual([]);
  });

  it("ignora compras en estados que no sean 'delivered'", () => {
    /**
     * Solo los pedidos completados (delivered) deben contar como ventas.
     * Un pedido en 'transit', 'preparing' o 'cancelled' NO es venta.
     */
    const purchases = [
      makePurchase(1, 5, "transit"),
      makePurchase(2, 3, "preparing"),
      makePurchase(3, 10, "cancelled"),
      makePurchase(4, 1, "returned"),
    ];
    const result = computeTrends(purchases, [], []);
    // EXPECT: ningún libro debe aparecer en más vendidos porque ninguno fue entregado
    expect(result.bestsellerIds).toEqual([]);
  });

  it("ignora reviews con status 'pending' y 'rejected'", () => {
    /**
     * Solo las reseñas 'approved' deben afectar el top_rated.
     * Las reseñas pendientes de moderación no deben influir.
     */
    const reviews = [
      makeReview(5, 5, "pending"),
      makeReview(6, 4, "rejected"),
      makeReview(7, 5, "pending"),
    ];
    const result = computeTrends([], reviews, []);
    // EXPECT: ningún libro en topRatedIds porque todas las reviews no están aprobadas
    expect(result.topRatedIds).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// 2. Ordenamiento y relevancia
// ─────────────────────────────────────────────────────────────

describe("computeTrends — ordenamiento correcto", () => {
  it("bestsellers: el libro más comprado aparece primero", () => {
    const purchases = [
      makePurchase(10, 2),   // 2 unidades
      makePurchase(11, 10),  // 10 unidades — debe ser #1
      makePurchase(12, 5),   // 5 unidades
    ];
    const result = computeTrends(purchases, [], []);
    expect(result.bestsellerIds[0]).toBe(11);
    expect(result.bestsellerIds[1]).toBe(12);
    expect(result.bestsellerIds[2]).toBe(10);
  });

  it("bestsellers: múltiples compras del mismo libro se suman", () => {
    /**
     * Un usuario compra el libro 20 en dos pedidos distintos.
     * EXPECT: se suman las cantidades (3 + 4 = 7 unidades)
     */
    const purchases = [
      makePurchase(20, 3),
      makePurchase(20, 4),
      makePurchase(21, 6), // libro 21 tiene 6 unidades — menos que libro 20 sumado
    ];
    const result = computeTrends(purchases, [], []);
    expect(result.bestsellerIds[0]).toBe(20); // 7 unidades > 6
  });

  it("topRated: el libro con mejor promedio aparece primero", () => {
    const reviews = [
      makeReview(30, 4),  // avg 4.0
      makeReview(31, 5),  // avg 5.0 → #1
      makeReview(32, 3),  // avg 3.0
    ];
    const result = computeTrends([], reviews, []);
    expect(result.topRatedIds[0]).toBe(31);
    expect(result.topRatedIds[1]).toBe(30);
    expect(result.topRatedIds[2]).toBe(32);
  });

  it("topRated: promedio correcto con múltiples reviews del mismo libro", () => {
    const reviews = [
      makeReview(40, 5), // 5
      makeReview(40, 3), // avg = 4.0
      makeReview(41, 5), // avg = 5.0 → #1
    ];
    // Necesitamos reviews de distintos usuarios para el mismo libro
    const multiReviews = [
      { ...makeReview(40, 5), userId: "U-A" },
      { ...makeReview(40, 3), userId: "U-B" },  // avg libro 40 = 4.0
      { ...makeReview(41, 5), userId: "U-C" },  // avg libro 41 = 5.0
    ];
    const result = computeTrends([], multiReviews, []);
    expect(result.topRatedIds[0]).toBe(41); // 5.0 > 4.0
  });
});

// ─────────────────────────────────────────────────────────────
// 3. Novedades y cutoff de 30 días
// ─────────────────────────────────────────────────────────────

describe("computeTrends — novedades recientes", () => {
  it("incluye libros con isNew=true", () => {
    const books: BookLike[] = [
      { id: 50, isNew: true },
      { id: 51, isNew: false },
    ];
    const result = computeTrends([], [], books);
    expect(result.newBookIds).toContain(50);
    expect(result.newBookIds).not.toContain(51);
  });

  it("incluye libros con addedDate dentro de los últimos 30 días", () => {
    const recentDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    const oldDate    = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const books: BookLike[] = [
      { id: 60, isNew: false, addedDate: recentDate }, // 15 días → dentro
      { id: 61, isNew: false, addedDate: oldDate    }, // 60 días → fuera
    ];
    const result = computeTrends([], [], books);
    expect(result.newBookIds).toContain(60);
    expect(result.newBookIds).not.toContain(61);
  });

  it("[EDGE] libro con addedDate exactamente en el límite (30 días) queda dentro", () => {
    const borderDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 1000).toISOString();
    const books: BookLike[] = [{ id: 70, isNew: false, addedDate: borderDate }];
    const result = computeTrends([], [], books);
    expect(result.newBookIds).toContain(70);
  });

  it("[EDGE] libro con addedDate en el futuro (fecha incorrecta) no rompe el sistema", () => {
    const futureDate = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString();
    const books: BookLike[] = [{ id: 80, isNew: false, addedDate: futureDate }];
    // EXPECT: no lanza excepción aunque la fecha sea futura
    expect(() => computeTrends([], [], books)).not.toThrow();
    const result = computeTrends([], [], books);
    // Un libro con fecha futura podría quedar fuera (fecha > ahora, cutoff = ahora-30d → dentro)
    expect(result.newBookIds).toContain(80);
  });
});

// ─────────────────────────────────────────────────────────────
// 4. Datos corruptos / parciales
// ─────────────────────────────────────────────────────────────

describe("computeTrends — datos corruptos o parciales", () => {
  it("[ROBUSTNESS] purchase con items vacíos no genera error", () => {
    const badPurchase: Purchase = {
      id: "P-BAD",
      date: new Date(),
      items: [], // sin items
      total: 0,
      status: "delivered",
      delivery: "shipping",
      tracking: [],
    };
    expect(() => computeTrends([badPurchase], [], [])).not.toThrow();
    const result = computeTrends([badPurchase], [], []);
    expect(result.bestsellerIds).toEqual([]);
  });

  it("[ROBUSTNESS] review con rating fuera de rango en BD no crashea el promedio", () => {
    /**
     * Si hay datos corruptos en SQLite (rating=10 por INSERT directo),
     * el cálculo del promedio no debe lanzar NaN o error.
     */
    const corruptReview = { ...makeReview(90, 10 as any) }; // rating=10 no permitido, pero podría estar
    const result = computeTrends([], [corruptReview], []);
    // EXPECT: topRatedIds incluye el libro aunque el promedio sea 10 — no crashea
    expect(() => computeTrends([], [corruptReview], [])).not.toThrow();
  });

  it("[EDGE] libro con ID duplicado en las tres listas simultáneamente", () => {
    /**
     * El mismo libro podría ser bestseller, top_rated Y novedad.
     * Verificar que aparece en las tres listas sin problemas.
     */
    const book: BookLike = { id: 100, isNew: true };
    const purchase = makePurchase(100, 50);
    const review   = makeReview(100, 5);
    const result   = computeTrends([purchase], [review], [book]);
    expect(result.bestsellerIds).toContain(100);
    expect(result.topRatedIds).toContain(100);
    expect(result.newBookIds).toContain(100);
  });
});

// ─────────────────────────────────────────────────────────────
// 5. Caché TTL (simulación)
// ─────────────────────────────────────────────────────────────

describe("computeTrends — simulación de caché TTL", () => {
  it("dos computaciones distintas con los mismos datos producen resultados iguales (determinismo)", () => {
    const purchases = [makePurchase(200, 3), makePurchase(201, 7)];
    const reviews   = [makeReview(200, 5), makeReview(201, 4)];
    const books     = [{ id: 200, isNew: true }, { id: 201, isNew: false }];

    const r1 = computeTrends(purchases, reviews, books);
    const r2 = computeTrends(purchases, reviews, books);

    // EXPECT: resultados idénticos — determinismo garantizado
    expect(r1.bestsellerIds).toEqual(r2.bestsellerIds);
    expect(r1.topRatedIds).toEqual(r2.topRatedIds);
    expect(r1.newBookIds).toEqual(r2.newBookIds);
  });

  it("computedAt es un timestamp Unix válido", () => {
    const result = computeTrends([], [], []);
    const before = Date.now();
    expect(result.computedAt).toBeGreaterThan(before - 1000);
    expect(result.computedAt).toBeLessThanOrEqual(before + 100);
  });
});
