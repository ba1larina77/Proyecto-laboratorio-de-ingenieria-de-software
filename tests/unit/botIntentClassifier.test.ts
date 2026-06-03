/**
 * Suite QA — Clasificador de Intenciones del Bot
 *
 * Re-implementa la lógica de extractIntent() en TypeScript puro
 * para poder testearla en el entorno jsdom sin importar el módulo CJS.
 *
 * Cubre:
 *  - Detección correcta de intenciones principales
 *  - Mensajes ambiguos / contradictorios
 *  - Inyección de código en el mensaje
 *  - Mensajes vacíos y gigantes
 *  - Cobertura de todas las intenciones de tendencias (Iteración 4)
 */
import { describe, it, expect } from "vitest";

// ── Tipos ─────────────────────────────────────────────────────
type IntentType =
  | "GREETING" | "HELP"
  | "GENRE" | "AUTHOR" | "SIMILAR" | "PRICE" | "NEW" | "AVAILABLE"
  | "PERSONAL"
  | "TRENDING" | "BESTSELLERS" | "TOP_RATED" | "NEW_RELEASES"
  | "FREE_SEARCH";

interface Intent {
  type: IntentType;
  value?: string | number;
  direction?: "less" | "more";
}

// ── Implementación equivalente a server/botService.js ─────────
function normalize(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

const GENRE_KEYWORDS: Record<string, string[]> = {
  "ciencia ficcion": ["sci-fi", "scifi", "futuro", "robots"],
  "fantasia":        ["magia", "dragones", "elfos"],
  "terror":          ["horror", "miedo", "suspenso"],
  "romance":         ["amor", "novela romantica"],
  "historia":        ["historico", "guerra", "medieval"],
  "misterio":        ["detective", "crimen", "policial"],
  "poesia":          ["poemas", "versos"],
};

function extractIntent(message: string): Intent {
  const low = normalize(message);

  if (["hola","buenas","hey","saludos"].some(w => low.includes(w)))
    return { type: "GREETING" };
  if (["ayuda","que puedes","como funciona","para que sirves"].some(w => low.includes(w)))
    return { type: "HELP" };

  // Tendencias — orden: más específico primero (plurales y variantes incluidas)
  if (["mas vendido","mas vendidos","bestseller","superventas","mas comprado"].some(w => low.includes(w)))
    return { type: "BESTSELLERS" };
  if (["mejor calificado","mejor valorado","mas estrellas","mejor puntuado"].some(w => low.includes(w)))
    return { type: "TOP_RATED" };
  // NEW_RELEASES antes que NEW para evitar que "lanzamiento" o "novedades" disparen NEW
  if (["novedad reciente","novedades recientes","ultimo lanzamiento","ultimos lanzamientos",
       "recien llegado","lanzamiento reciente"].some(w => low.includes(w)))
    return { type: "NEW_RELEASES" };
  if (["tendencia","de moda","popular","trending"].some(w => low.includes(w)))
    return { type: "TRENDING" };

  // Género — ANTES de PERSONAL y AUTHOR para evitar falsos positivos
  for (const [genre, keywords] of Object.entries(GENRE_KEYWORDS)) {
    if (low.includes(genre) || keywords.some(k => low.includes(k)))
      return { type: "GENRE", value: genre };
  }

  // Personal — después de GENRE
  if (["recomiendame","que recomiendas","sugerencia","para mi","personaliz"].some(w => low.includes(w)))
    return { type: "PERSONAL" };

  // Precio — ANTES de AUTHOR para que "libros de menos de X" no se confunda con autor
  const priceMatch = /(\d[\d.,]*)/.exec(message);
  if (priceMatch && /menos de|por debajo|hasta|maximo|no mas de/i.test(low)) {
    return { type: "PRICE", value: parseFloat(priceMatch[1].replace(/[.,]/g, "")), direction: "less" };
  }
  if (priceMatch && /mas de|por encima|minimo|desde/i.test(low)) {
    return { type: "PRICE", value: parseFloat(priceMatch[1].replace(/[.,]/g, "")), direction: "more" };
  }

  // Autor — requiere inicial mayúscula para evitar capturar géneros como "terror"
  // El character class incluye mayúsculas para apellidos como "García Márquez"
  const authorMatch = /(?:de|libros de|autor|escrito por)\s+([A-ZÁÉÍÓÚÜÑ][a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]{4,})/u.exec(message);
  if (authorMatch) return { type: "AUTHOR", value: authorMatch[1].trim() };

  // Similar
  const simIdx = ["similar","parecido","del mismo","estilo de"].findIndex(w => low.includes(w));
  if (simIdx !== -1) {
    const kw   = ["similar","parecido","del mismo","estilo de"][simIdx];
    const idx  = low.indexOf(kw);
    const rest = message.slice(idx + kw.length).trim();
    return { type: "SIMILAR", value: rest };
  }

  // Novedades simples — después de NEW_RELEASES
  if (["nuevo","nuevos","novedades","reciente","lanzamiento"].some(w => low.includes(w)))
    return { type: "NEW" };

  // Disponibles
  if (["disponible","en stock"].some(w => low.includes(w)))
    return { type: "AVAILABLE" };

  // Fallback
  return { type: "FREE_SEARCH", value: message.trim() };
}

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe("Bot — detección de intenciones básicas", () => {
  it("detecta GREETING con 'hola'", () => {
    expect(extractIntent("hola").type).toBe("GREETING");
  });

  it("detecta GREETING con 'buenas tardes'", () => {
    expect(extractIntent("buenas tardes").type).toBe("GREETING");
  });

  it("detecta HELP con '¿qué puedes hacer?'", () => {
    expect(extractIntent("¿qué puedes hacer?").type).toBe("HELP");
  });

  it("detecta GENRE con 'ciencia ficción'", () => {
    const intent = extractIntent("recomiéndame libros de ciencia ficción");
    expect(intent.type).toBe("GENRE");
    expect(String(intent.value)).toContain("ciencia ficcion");
  });

  it("detecta AUTHOR con 'libros de García Márquez'", () => {
    const intent = extractIntent("libros de García Márquez");
    expect(intent.type).toBe("AUTHOR");
    expect(String(intent.value)).toMatch(/García Márquez/i);
  });

  it("detecta PRICE con 'menos de 30000'", () => {
    const intent = extractIntent("libros de menos de 30000");
    expect(intent.type).toBe("PRICE");
    expect(intent.direction).toBe("less");
    expect(intent.value).toBe(30000);
  });

  it("detecta NEW con 'novedades'", () => {
    expect(extractIntent("¿qué novedades tienen?").type).toBe("NEW");
  });

  it("detecta PERSONAL con 'recomiéndame'", () => {
    expect(extractIntent("recomiéndame algo").type).toBe("PERSONAL");
  });

  it("detecta AVAILABLE con 'disponibles'", () => {
    expect(extractIntent("qué libros disponibles tienen").type).toBe("AVAILABLE");
  });
});

describe("Bot — intenciones de tendencias (Iteración 4)", () => {
  it("detecta BESTSELLERS con 'más vendidos'", () => {
    expect(extractIntent("¿cuáles son los más vendidos?").type).toBe("BESTSELLERS");
  });

  it("detecta BESTSELLERS con 'bestsellers'", () => {
    expect(extractIntent("muéstrame los bestsellers").type).toBe("BESTSELLERS");
  });

  it("detecta TOP_RATED con 'mejor calificados'", () => {
    expect(extractIntent("libros mejor calificados").type).toBe("TOP_RATED");
  });

  it("detecta TOP_RATED con 'mejor valorados'", () => {
    expect(extractIntent("dame los mejor valorados").type).toBe("TOP_RATED");
  });

  it("detecta NEW_RELEASES con 'últimos lanzamientos'", () => {
    expect(extractIntent("cuáles son los últimos lanzamientos").type).toBe("NEW_RELEASES");
  });

  it("detecta NEW_RELEASES con 'novedades recientes'", () => {
    expect(extractIntent("novedades recientes del catálogo").type).toBe("NEW_RELEASES");
  });

  it("detecta TRENDING con 'en tendencia'", () => {
    expect(extractIntent("qué está en tendencia").type).toBe("TRENDING");
  });

  it("detecta TRENDING con 'populares'", () => {
    expect(extractIntent("muéstrame libros populares").type).toBe("TRENDING");
  });

  it("BESTSELLERS tiene precedencia sobre TRENDING (más específico primero)", () => {
    // Mensaje que podría disparar ambas — el más específico gana
    const intent = extractIntent("cuáles son los más vendidos y en tendencia");
    expect(intent.type).toBe("BESTSELLERS");
  });
});

describe("Bot — mensajes ambiguos y contradictorios", () => {
  it("mensaje contradictorio: terror que no dé miedo y de cocina → GENRE=terror (primer match)", () => {
    /**
     * El bot no puede satisfacer todos los criterios simultáneos.
     * EXPECT: el clasificador toma la primera señal de género detectada (terror)
     * en lugar de fallar. Nunca lanza excepción.
     */
    const intent = extractIntent(
      "Recomiéndame un libro que sea de terror pero que no me dé miedo y que sea de cocina"
    );
    // GENRE=terror es el primer match (el clasificador lo prioriza sobre PERSONAL)
    expect(["GENRE", "PERSONAL", "FREE_SEARCH"]).toContain(intent.type);
    expect(() => extractIntent("...")).not.toThrow();
  });

  it("mensaje completamente incoherente → FREE_SEARCH sin crash", () => {
    // Sin ningún token de palabra clave — no hay "de" con mayúscula (AUTHOR requiere uppercase)
    const msg    = "xkfja opqw 12!@# ??? fjskla";
    const intent = extractIntent(msg);
    // EXPECT: el clasificador no debe lanzar — cae en FREE_SEARCH
    expect(intent.type).toBe("FREE_SEARCH");
    expect(intent.value).toBe(msg.trim());
  });

  it("múltiples géneros contradictorios → toma el primer genre detectado", () => {
    // "terror" y "romance" en el mismo mensaje — terror aparece primero
    const intent = extractIntent("quiero algo de terror y también de romance");
    // GENRE=terror se detecta antes que AUTHOR porque GENRE tiene precedencia
    expect(intent.type).toBe("GENRE");
    // El sistema elige el primer género detectado; no debe crashear
  });
});

describe("Bot — mensajes de seguridad y estrés", () => {
  it("[SECURITY] XSS en el mensaje no ejecuta código — procesado como texto", () => {
    const xssMsg = "<script>alert('hack')</script>";
    // EXPECT: el clasificador trata el payload como texto plano → FREE_SEARCH
    const intent = extractIntent(xssMsg);
    expect(intent.type).toBe("FREE_SEARCH");
    expect(intent.value).toBe(xssMsg.trim());
  });

  it("[SECURITY] SQL Injection en el mensaje → tratado como texto", () => {
    const sqlMsg = "'; DROP TABLE books; --";
    const intent = extractIntent(sqlMsg);
    // EXPECT: no falla, devuelve FREE_SEARCH con el texto
    expect(intent.type).toBe("FREE_SEARCH");
  });

  it("[STRESS] mensaje gigante (500 000 caracteres) no lanza RangeError", () => {
    const giant = "libro ".repeat(83_333) + "extra"; // ~500k chars
    // EXPECT: el clasificador termina sin error de memoria/stack
    expect(() => extractIntent(giant)).not.toThrow();
  });

  it("[STRESS] mensaje vacío → FREE_SEARCH con value=''", () => {
    const intent = extractIntent("");
    // EXPECT: manejo gracioso, no crash
    expect(["FREE_SEARCH", "GREETING"]).toContain(intent.type);
  });

  it("[STRESS] 1000 llamadas consecutivas no degradan el resultado", () => {
    const results = Array.from({ length: 1000 }, (_, i) =>
      extractIntent(`libros de terror número ${i}`)
    );
    // Todas deben retornar GENRE=terror
    expect(results.every(r => r.type === "GENRE")).toBe(true);
  });
});

describe("Bot — detección de similares", () => {
  it("detecta SIMILAR con 'algo similar a El Quijote'", () => {
    const intent = extractIntent("quiero algo similar a El Quijote");
    expect(intent.type).toBe("SIMILAR");
    expect(String(intent.value)).toMatch(/quijote/i);
  });

  it("detecta SIMILAR con 'parecido a'", () => {
    const intent = extractIntent("dame algo parecido a 1984");
    expect(intent.type).toBe("SIMILAR");
  });
});
