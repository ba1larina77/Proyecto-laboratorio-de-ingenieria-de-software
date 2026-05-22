/**
 * Suite QA — Reglas de negocio de Reseñas y Calificaciones
 *
 * Testea la validación dentro de ShopContext.submitReview() usando
 * el patrón captureContext() del proyecto (sin renderHook).
 *
 * Orden de validación en submitReview:
 *   1. !user            → "Debes iniciar sesión"
 *   2. !hasPurchasedBook → "Solo puedes reseñar libros que hayas comprado"
 *   3. hasReviewedBook   → "Ya escribiste una reseña"
 *   4. rating < 1 || > 5 → "La calificación debe ser entre 1 y 5."
 *   5. !comment.trim()   → "El comentario no puede estar vacío."
 *
 * Cada test documenta el error esperado y la regla de negocio violada.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ReactNode } from "react";
import { ShopProvider, useShop } from "../../src/app/store/ShopContext";
import { seedUsersStorage } from "../test-utils";

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <ShopProvider>{children}</ShopProvider>
    </MemoryRouter>
  );
}

/** Patrón del proyecto: renderiza una probe y devuelve fn que accede al ctx actual */
function captureContext() {
  let captured: ReturnType<typeof useShop> | null = null;
  function Probe() {
    captured = useShop();
    return null;
  }
  render(<Probe />, { wrapper: Wrapper });
  return () => captured!;
}

const USER_EMAIL = "juan.perez@correo.com";
const USER_PASS  = "12345678";
const USER_ID    = "U-CLI-001";
const BOOK_ID    = 1;

/** Inserta una compra "delivered" del BOOK_ID para el usuario demo */
function seedDeliveredPurchase(bookId = BOOK_ID) {
  const existing = JSON.parse(localStorage.getItem("biblion_purchases") ?? "[]");
  const purchase = {
    id:       `P-QA-${bookId}-${Date.now()}`,
    date:     new Date().toISOString(),
    items:    [{ book: { id: bookId }, qty: 1, price: 29900 }],
    total:    29900,
    status:   "delivered",
    delivery: "shipping",
    userId:   USER_ID,
    tracking: [],
  };
  localStorage.setItem("biblion_purchases", JSON.stringify([...existing, purchase]));
}

/** Inserta una review ya existente para simular duplicado */
function seedExistingReview(bookId = BOOK_ID) {
  const existing = JSON.parse(localStorage.getItem("biblion_reviews") ?? "[]");
  const review = {
    id:        `rv-QA-${bookId}-${Date.now()}`,
    bookId,
    userId:    USER_ID,
    userName:  "Juan Carlos Pérez",
    rating:    5,
    comment:   "Reseña previa",
    status:    "approved",
    createdAt: Date.now(),
  };
  localStorage.setItem("biblion_reviews", JSON.stringify([...existing, review]));
}

beforeEach(() => {
  seedUsersStorage();
});

// ── 1. Usuario no autenticado ─────────────────────────────────

describe("submitReview — usuario no autenticado", () => {
  it("rechaza la reseña si no hay sesión activa", async () => {
    const ctx = captureContext();
    // Sin login: user === null

    let result!: { success: boolean; error?: string };
    await act(async () => {
      result = await ctx().submitReview(BOOK_ID, 5, "Excelente");
    });

    // EXPECT: error porque no hay usuario autenticado
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/sesión|iniciar/i);
  });
});

// ── 2. Usuario sin compra (inyección de reseña) ───────────────

describe("submitReview — usuario sin compra del libro", () => {
  it("[SECURITY] rechaza reseña de libro no comprado", async () => {
    /**
     * ATAQUE: usuario autenticado intenta reseñar el libro 999 que NUNCA compró.
     * La validación ocurre en el frontend (ShopContext).
     * NOTA: el backend NO verifica compras → ver tests/api/reviews.edge.test.ts
     */
    const ctx = captureContext();
    act(() => ctx().login(USER_EMAIL, USER_PASS));

    let result!: { success: boolean; error?: string };
    await act(async () => {
      result = await ctx().submitReview(999, 5, "Quiero hackear esto");
    });

    // EXPECT: rechazado porque el usuario no tiene compra entregada del libro 999
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/compr|adquiri/i);
  });
});

// ── 3. Calificación fuera de rango [1-5] ─────────────────────

describe("submitReview — calificación fuera de rango [1-5]", () => {
  beforeEach(() => seedDeliveredPurchase());

  const invalidRatings = [
    { rating: 0,    label: "cero" },
    { rating: 6,    label: "mayor que 5" },
    { rating: -1,   label: "negativo" },
    { rating: 99,   label: "extremo positivo" },
    { rating: -100, label: "extremo negativo" },
  ];

  for (const { rating, label } of invalidRatings) {
    it(`rechaza calificación ${label} (${rating})`, async () => {
      const ctx = captureContext();
      act(() => ctx().login(USER_EMAIL, USER_PASS));

      let result!: { success: boolean; error?: string };
      await act(async () => {
        result = await ctx().submitReview(BOOK_ID, rating, "Comentario válido");
      });

      // EXPECT: la validación captura el rango inválido DESPUÉS de verificar compra
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/calificaci|entre 1 y 5/i);
    });
  }
});

// ── 4. Comentario vacío ───────────────────────────────────────

describe("submitReview — comentario vacío", () => {
  beforeEach(() => seedDeliveredPurchase());

  it("rechaza comentario con solo espacios en blanco", async () => {
    const ctx = captureContext();
    act(() => ctx().login(USER_EMAIL, USER_PASS));

    let result!: { success: boolean; error?: string };
    await act(async () => {
      result = await ctx().submitReview(BOOK_ID, 5, "     ");
    });

    // EXPECT: comentario vacío tras trim() debe ser rechazado
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/comentario|vacío/i);
  });

  it("rechaza comentario con string vacío literalmente", async () => {
    const ctx = captureContext();
    act(() => ctx().login(USER_EMAIL, USER_PASS));

    let result!: { success: boolean; error?: string };
    await act(async () => {
      result = await ctx().submitReview(BOOK_ID, 5, "");
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/comentario|vacío/i);
  });
});

// ── 5. Spam / envío duplicado ─────────────────────────────────

describe("submitReview — detección de duplicados (spam)", () => {
  beforeEach(() => seedDeliveredPurchase());

  it("rechaza segunda reseña del mismo usuario para el mismo libro", async () => {
    /**
     * El contexto usa hasReviewedBook() que lee localStorage en tiempo real.
     * El primer submit actualiza el estado; el segundo debe detectar el duplicado.
     */
    const ctx = captureContext();
    act(() => ctx().login(USER_EMAIL, USER_PASS));

    let first!:  { success: boolean; error?: string };
    let second!: { success: boolean; error?: string };

    await act(async () => {
      first  = await ctx().submitReview(BOOK_ID, 5, "Primera reseña válida");
    });

    await act(async () => {
      second = await ctx().submitReview(BOOK_ID, 3, "Segunda reseña spam");
    });

    // EXPECT: primera reseña aceptada
    expect(first.success).toBe(true);
    // EXPECT: segunda reseña rechazada por duplicado
    expect(second.success).toBe(false);
    expect(second.error).toMatch(/ya .*(escrib|envi|reseña)/i);
  });

  it("5 envíos rápidos: solo el primero pasa, los siguientes 4 son rechazados", async () => {
    const ctx = captureContext();
    act(() => ctx().login(USER_EMAIL, USER_PASS));

    const results: { success: boolean; error?: string }[] = [];

    for (let i = 0; i < 5; i++) {
      let r!: { success: boolean; error?: string };
      await act(async () => {
        r = await ctx().submitReview(BOOK_ID, 5, `Intento de spam #${i}`);
      });
      results.push(r);
    }

    const successes = results.filter(r => r.success);
    const failures  = results.filter(r => !r.success);

    // EXPECT: exactamente 1 éxito y 4 rechazos
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(4);
  });
});

// ── 6. Inyección XSS en el comentario ────────────────────────

describe("submitReview — inyección XSS en comentario", () => {
  beforeEach(() => seedDeliveredPurchase());

  it("[SECURITY] XSS se almacena como texto literal, no ejecutado", async () => {
    /**
     * React escapa el HTML automáticamente al renderizar props de texto.
     * Verificamos que el string se guarda literalmente en el estado/localStorage.
     */
    const xssPayload = "<script>alert('hack')</script>";
    const ctx = captureContext();
    act(() => ctx().login(USER_EMAIL, USER_PASS));

    let result!: { success: boolean; error?: string };
    await act(async () => {
      result = await ctx().submitReview(BOOK_ID, 4, xssPayload);
    });

    // EXPECT: submitReview acepta el texto (React lo escapará en render)
    expect(result.success).toBe(true);

    // Verificar que en localStorage está el string literal, no decoded HTML
    const stored = JSON.parse(localStorage.getItem("biblion_reviews") ?? "[]");
    const saved  = stored.find((r: any) => r.comment === xssPayload);
    // EXPECT: el XSS está guardado como texto crudo — no ejecutado ni modificado
    expect(saved).toBeDefined();
    expect(saved.comment).toBe(xssPayload);
    // NOTA DE SEGURIDAD: nunca renderizar con dangerouslySetInnerHTML
  });

  it("[SECURITY] SQL Injection en comentario tratado como texto literal", async () => {
    /**
     * Usa BOOK_ID=1 ya sembrado por el beforeEach de este describe.
     * IMPORTANTE: el contexto debe montarse DESPUÉS del seedDeliveredPurchase
     * para que el estado React inicialice con la compra presente.
     */
    const sqlPayload = "'; DROP TABLE reviews; --";
    const ctx = captureContext(); // monta el contexto con la compra ya en localStorage
    act(() => ctx().login(USER_EMAIL, USER_PASS));

    let result!: { success: boolean; error?: string };
    await act(async () => {
      result = await ctx().submitReview(BOOK_ID, 3, sqlPayload);
    });

    // EXPECT: el contexto acepta el texto — es el backend (sql.js parametrizado) quien lo sanitiza
    expect(result.success).toBe(true);
    const stored = JSON.parse(localStorage.getItem("biblion_reviews") ?? "[]");
    const saved  = stored.find((r: any) => r.comment === sqlPayload);
    expect(saved).toBeDefined();
  });
});

// ── 7. Reseña preexistente en storage (estado inicial corrupto) ──

describe("submitReview — review ya en localStorage al montar", () => {
  it("detecta review preexistente en localStorage al arrancar el contexto", async () => {
    // Sembrar ANTES de montar el contexto
    seedDeliveredPurchase();
    seedExistingReview();

    const ctx = captureContext(); // el contexto lee localStorage al montar
    act(() => ctx().login(USER_EMAIL, USER_PASS));

    let result!: { success: boolean; error?: string };
    await act(async () => {
      result = await ctx().submitReview(BOOK_ID, 5, "Intento con review preexistente");
    });

    // EXPECT: detecta la review existente y rechaza el nuevo intento
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/ya .*(escrib|envi|reseña)/i);
  });
});
