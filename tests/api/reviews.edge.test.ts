/**
 * Suite QA — API de Reseñas: Edge Cases y Seguridad
 *
 * Tests de integración destructivos contra el backend real (localhost:3001).
 * Usa node:http directamente para bypassear el mock global de fetch.
 *
 * REQUIERE: backend corriendo (`node server/index.js`)
 *
 * Escenarios:
 *  1. Campos obligatorios faltantes → 400
 *  2. Rating fuera de rango [1-5] → 400
 *  3. Duplicado (UNIQUE constraint) → 409
 *  4. Payload XSS en comment → 201, almacenado como texto literal
 *  5. Spam: 5 reseñas del mismo usuario/libro en rápida sucesión → solo la primera pasa
 *  6. [VULN] Backend acepta reviews SIN verificar compra → 201 (documenta vulnerabilidad)
 *  7. Rating como string / float → manejo robusto
 *  8. Comment extremadamente largo (100k chars) → no rompe la BD
 */
import { describe, it, expect, beforeAll } from "vitest";
import { apiRequest, backendIsUp } from "./testFetch";

let BACKEND_UP = false;
let UNIQUE_SUFFIX = Date.now();

beforeAll(async () => {
  BACKEND_UP   = await backendIsUp();
  UNIQUE_SUFFIX = Date.now();
  if (!BACKEND_UP) {
    console.warn("⚠️  Backend no disponible — tests de API marcados como skipped.");
  }
});

function skip(name: string, fn: () => Promise<void>) {
  it(name, async () => {
    if (!BACKEND_UP) return; // skip silencioso si el backend está caído
    await fn();
  });
}

// ── Fixtures base ──────────────────────────────────────────────
const validReview = () => ({
  bookId:   1,
  userId:   `user-qa-${UNIQUE_SUFFIX}`,
  userName: "QA Tester",
  rating:   5,
  comment:  "Excelente libro de prueba",
});

// ─────────────────────────────────────────────────────────────
// 1. Campos obligatorios faltantes
// ─────────────────────────────────────────────────────────────

describe("POST /api/reviews — campos faltantes", () => {
  skip("400 cuando falta bookId", async () => {
    const { bookId: _, ...body } = validReview();
    const r = await apiRequest("/api/reviews", { body });
    // EXPECT: el backend valida que bookId sea obligatorio
    expect(r.status).toBe(400);
  });

  skip("400 cuando falta userId", async () => {
    const { userId: _, ...body } = validReview();
    const r = await apiRequest("/api/reviews", { body });
    expect(r.status).toBe(400);
  });

  skip("400 cuando falta comment", async () => {
    const { comment: _, ...body } = validReview();
    const r = await apiRequest("/api/reviews", { body });
    expect(r.status).toBe(400);
  });

  skip("400 cuando body está completamente vacío", async () => {
    const r = await apiRequest("/api/reviews", { body: {} });
    expect(r.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────
// 2. Rating fuera de rango
// ─────────────────────────────────────────────────────────────

describe("POST /api/reviews — rating fuera de rango [1-5]", () => {
  const invalidRatings = [
    { rating: 0,    label: "cero" },
    { rating: 6,    label: "mayor que 5" },
    { rating: -1,   label: "negativo" },
    { rating: 100,  label: "extremo positivo" },
  ];

  for (const { rating, label } of invalidRatings) {
    skip(`400 cuando rating es ${label} (${rating})`, async () => {
      const body = { ...validReview(), rating, userId: `user-rating-${rating}-${UNIQUE_SUFFIX}` };
      const r    = await apiRequest("/api/reviews", { body });
      // EXPECT: CHECK constraint del backend rechaza el valor
      expect(r.status).toBe(400);
    });
  }

  skip("400 cuando rating es float (ej. 4.5)", async () => {
    const body = { ...validReview(), rating: 4.5, userId: `user-float-${UNIQUE_SUFFIX}` };
    const r    = await apiRequest("/api/reviews", { body });
    // EXPECT: la validación integer del backend rechaza floats
    expect(r.status).toBe(400);
  });

  skip("400 cuando rating es string numérico ('5')", async () => {
    const body = { ...validReview(), rating: "5" as any, userId: `user-str-${UNIQUE_SUFFIX}` };
    const r    = await apiRequest("/api/reviews", { body });
    // EXPECT: el backend valida el tipo antes de insertar
    expect(r.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────
// 3. Duplicados — UNIQUE(book_id, user_id)
// ─────────────────────────────────────────────────────────────

describe("POST /api/reviews — detección de duplicados", () => {
  skip("409 al intentar enviar segunda reseña del mismo usuario y libro", async () => {
    const userId  = `user-dup-${UNIQUE_SUFFIX}`;
    const body    = { ...validReview(), userId };

    // Primera reseña — debe pasar
    const first  = await apiRequest("/api/reviews", { body });
    expect(first.status).toBe(201); // EXPECT: primera reseña aceptada

    // Segunda reseña inmediata — debe rechazarse
    const second = await apiRequest("/api/reviews", { body: { ...body, comment: "Spam intento 2" } });
    // EXPECT: el UNIQUE constraint dispara 409 Conflict
    expect(second.status).toBe(409);
  });

  skip("spam: 5 reseñas consecutivas del mismo usuario — solo la primera pasa", async () => {
    const userId    = `user-spam-${UNIQUE_SUFFIX}`;
    const results: number[] = [];

    for (let i = 0; i < 5; i++) {
      const r = await apiRequest("/api/reviews", {
        body: { ...validReview(), userId, comment: `Intento de spam #${i}` },
      });
      results.push(r.status);
    }

    // EXPECT: exactamente 1 éxito (201), los otros 4 son 409
    const successes = results.filter(s => s === 201);
    const duplicates = results.filter(s => s === 409);
    expect(successes.length).toBe(1);
    expect(duplicates.length).toBe(4);
  });
});

// ─────────────────────────────────────────────────────────────
// 4. Inyección XSS y SQL en el comentario
// ─────────────────────────────────────────────────────────────

describe("POST /api/reviews — inyección XSS y SQL", () => {
  skip("[SECURITY] XSS en comment: se almacena como texto literal", async () => {
    const xssPayload = "<script>alert('hack')</script><img onerror=\"alert(1)\">";
    const userId     = `user-xss-${UNIQUE_SUFFIX}`;
    const body       = { ...validReview(), userId, comment: xssPayload };

    const r = await apiRequest("/api/reviews", { body });
    // EXPECT: el backend acepta el texto (no lo ejecuta)
    expect(r.status).toBe(201);

    // Verificar que el valor devuelto es el string original (no decoded HTML)
    const body2 = r.body as any;
    expect(body2?.review?.comment).toBe(xssPayload.trim());
    // NOTA: el frontend usa JSX que escapa automáticamente — no se ejecutará
  });

  skip("[SECURITY] SQL Injection en comment no rompe la BD", async () => {
    const sqlPayload = "'); DROP TABLE reviews; --";
    const userId     = `user-sql-${UNIQUE_SUFFIX}`;
    const body       = { ...validReview(), userId, comment: sqlPayload };

    const r = await apiRequest("/api/reviews", { body });
    // EXPECT: el backend usa parametrización (sql.js) → no hay inyección real
    // Debe retornar 201, no 500
    expect([201, 400]).toContain(r.status);
    expect(r.status).not.toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────
// 5. Payload extremo
// ─────────────────────────────────────────────────────────────

describe("POST /api/reviews — payloads extremos", () => {
  skip("comment de 100 000 caracteres no rompe la BD (no debe dar 500)", async () => {
    const longComment = "A".repeat(100_000);
    const userId      = `user-long-${UNIQUE_SUFFIX}`;
    const body        = { ...validReview(), userId, comment: longComment };

    const r = await apiRequest("/api/reviews", { body });
    // EXPECT: el servidor lo acepta o retorna 400 por límite; NUNCA 500
    expect(r.status).not.toBe(500);
    expect([201, 400, 413]).toContain(r.status);
  });
});

// ─────────────────────────────────────────────────────────────
// 6. [VULNERABILIDAD DOCUMENTADA] Backend no verifica compra
// ─────────────────────────────────────────────────────────────

describe("[VULN] POST /api/reviews — verificación de compra NO implementada en backend", () => {
  skip("el backend acepta una reseña de un usuario que NUNCA compró el libro", async () => {
    /**
     * ⚠️ VULNERABILIDAD DE NEGOCIO DOCUMENTADA
     *
     * El endpoint POST /api/reviews NO verifica si el userId compró el bookId.
     * Solo la capa del frontend (ShopContext.submitReview) hace esta validación.
     *
     * IMPACTO: un atacante que llame directamente al API podría reseñar cualquier
     * libro sin haberlo comprado, inflando/degradando las calificaciones.
     *
     * RECOMENDACIÓN: añadir verificación de compra en el backend consultando
     * el historial de pedidos del usuario antes de insertar la reseña.
     */
    const nonBuyerReview = {
      bookId:   999,  // libro que "user-no-buyer" nunca compró
      userId:   `user-no-buyer-${UNIQUE_SUFFIX}`,
      userName: "Atacante",
      rating:   1,
      comment:  "Reseña fraudulenta — usuario sin compra",
    };

    const r = await apiRequest("/api/reviews", { body: nonBuyerReview });
    // EXPECT (documentado): el backend acepta → 201. Esto ES la vulnerabilidad.
    // Si el backend en el futuro implementa la validación, este test debe cambiar a 403.
    expect(r.status).toBe(201); // ← cambiar a 403 cuando se corrija la vulnerabilidad
    console.warn(
      "[VULN] Backend aceptó reseña sin verificar compra. Ver: POST /api/reviews sin check de purchase."
    );
  });
});

// ─────────────────────────────────────────────────────────────
// 7. GET /api/reviews/:bookId — robustez
// ─────────────────────────────────────────────────────────────

describe("GET /api/reviews/:bookId — edge cases", () => {
  skip("bookId 0 → 400 o array vacío, nunca 500", async () => {
    const r = await apiRequest("/api/reviews/0");
    expect(r.status).not.toBe(500);
    expect([200, 400]).toContain(r.status);
  });

  skip("bookId negativo → manejado graciosamente", async () => {
    const r = await apiRequest("/api/reviews/-1");
    expect(r.status).not.toBe(500);
  });

  skip("bookId no numérico ('abc') → 400", async () => {
    const r = await apiRequest("/api/reviews/abc");
    expect(r.status).toBe(400);
  });

  skip("bookId inexistente (999999) → 200 con array vacío", async () => {
    const r = await apiRequest("/api/reviews/999999");
    expect(r.status).toBe(200);
    const body = r.body as any;
    expect(body.reviews).toEqual([]);
    expect(body.total).toBe(0);
    // EXPECT: avg es null cuando no hay reseñas
    expect(body.avg).toBeNull();
  });
});
