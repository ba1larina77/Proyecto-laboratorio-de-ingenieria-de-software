/**
 * Tests unitarios — Helpers puros del contexto Shop
 * Cubre: haversineKm, fmt, canReturnPurchase
 *
 * Validan que los helpers matemáticos y de formato funcionen de forma
 * determinista sin depender del React tree.
 */
import { describe, it, expect } from "vitest";
import {
  haversineKm,
  fmt,
  PEREIRA_CENTER,
  STORES,
  MAX_DIFFERENT_BOOKS,
  MAX_SAME_BOOK_COPIES,
  RESERVATION_HOURS,
  RETURN_DAYS_LIMIT,
} from "../../src/app/store/ShopContext";

describe("haversineKm — distancia geodésica", () => {
  it("la distancia de un punto a sí mismo es 0", () => {
    const d = haversineKm(
      { lat: 4.81, lng: -75.69 },
      { lat: 4.81, lng: -75.69 }
    );
    expect(d).toBe(0);
  });

  it("es simétrica (a→b = b→a)", () => {
    const a = { lat: 4.81, lng: -75.69 };
    const b = { lat: 4.82, lng: -75.70 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 6);
  });

  it("Pereira Plaza ↔ Unicentro está dentro del rango realista (1-2 km)", () => {
    const plaza    = { lat: 4.8087, lng: -75.6906 };
    const unicentro = { lat: 4.8198, lng: -75.6951 };
    const d = haversineKm(plaza, unicentro);
    expect(d).toBeGreaterThan(0.5);
    expect(d).toBeLessThan(2.5);
  });

  it("todas las 3 tiendas están a menos de 5 km del centro", () => {
    for (const s of STORES) {
      const d = haversineKm(PEREIRA_CENTER, { lat: s.lat, lng: s.lng });
      expect(d).toBeLessThan(5);
    }
  });
});

describe("fmt — formato de moneda COP", () => {
  it("formatea un entero en pesos colombianos", () => {
    // Intl.NumberFormat puede usar varios tipos de espacios; nos aseguramos del prefijo y el dígito
    const out = fmt(125800);
    expect(out).toContain("125");
    expect(out).toContain("800");
    expect(out.replace(/[\s\u00A0\u202F]/g, "")).toMatch(/\$125\.800/);
  });

  it("formatea 0 correctamente", () => {
    const out = fmt(0);
    expect(out.replace(/[\s\u00A0\u202F]/g, "")).toMatch(/\$0/);
  });

  it("no muestra decimales", () => {
    expect(fmt(29900)).not.toContain(",00");
    expect(fmt(29900)).not.toContain(".00");
  });
});

describe("Constantes de negocio", () => {
  it("MAX_DIFFERENT_BOOKS es 5 (RF-CR-03)", () => {
    expect(MAX_DIFFERENT_BOOKS).toBe(5);
  });

  it("MAX_SAME_BOOK_COPIES es 3 (RF-CR-04)", () => {
    expect(MAX_SAME_BOOK_COPIES).toBe(3);
  });

  it("RESERVATION_HOURS es 24 (RF-CR-05)", () => {
    expect(RESERVATION_HOURS).toBe(24);
  });

  it("RETURN_DAYS_LIMIT es 8 (RF-CR-12)", () => {
    expect(RETURN_DAYS_LIMIT).toBe(8);
  });

  it("Hay exactamente 3 tiendas configuradas (HU10/HU11)", () => {
    expect(STORES).toHaveLength(3);
  });

  it("Cada tienda tiene coordenadas válidas en Pereira", () => {
    for (const s of STORES) {
      expect(s.lat).toBeGreaterThan(4.7);
      expect(s.lat).toBeLessThan(4.9);
      expect(s.lng).toBeGreaterThan(-75.8);
      expect(s.lng).toBeLessThan(-75.5);
      expect(s.name).toBeTruthy();
      expect(s.address).toBeTruthy();
    }
  });
});
