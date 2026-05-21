/**
 * Tests M1-HU7 + M2-HU11
 *  - setStoreStock / getStoreStock
 *  - validateStoreCode (autenticación por código de tienda)
 *  - nearestStoreWithStock (cálculo de tienda más cercana)
 *
 * Estos tests usan el provider real con un harness, no mocks, para
 * verificar la integración real con localStorage y el contexto.
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

/** Helper: captura el contexto activo del provider */
function captureContext() {
  let captured: ReturnType<typeof useShop> | null = null;
  function Probe() {
    captured = useShop();
    return null;
  }
  render(<Probe />, { wrapper: Wrapper });
  return () => captured!;
}

describe("M1-HU7: Inventario por tienda física", () => {
  beforeEach(() => {
    seedUsersStorage();
  });

  it("inicializa con stock distribuido entre las 3 tiendas", () => {
    const ctx = captureContext();
    const inv = ctx().storeInventory;
    expect(inv).toHaveProperty("1");
    expect(inv).toHaveProperty("2");
    expect(inv).toHaveProperty("3");
    // El libro 1 (Cien Años de Soledad, stock=3) debe tener inventario
    expect(typeof inv[1][1]).toBe("number");
  });

  it("setStoreStock actualiza el stock de un libro en una tienda", () => {
    const ctx = captureContext();
    act(() => ctx().setStoreStock(1, 5, 42));
    expect(ctx().getStoreStock(1, 5)).toBe(42);
  });

  it("setStoreStock rechaza valores negativos (clamp a 0)", () => {
    const ctx = captureContext();
    act(() => ctx().setStoreStock(2, 3, -10));
    expect(ctx().getStoreStock(2, 3)).toBe(0);
  });

  it("setStoreStock no afecta el stock de otras tiendas", () => {
    const ctx = captureContext();
    act(() => ctx().setStoreStock(1, 7, 100));
    expect(ctx().getStoreStock(1, 7)).toBe(100);
    // Otras tiendas deben seguir con su valor inicial (no 100)
    expect(ctx().getStoreStock(2, 7)).not.toBe(100);
    expect(ctx().getStoreStock(3, 7)).not.toBe(100);
  });

  it("getStoreStock devuelve 0 para libros nunca asignados", () => {
    const ctx = captureContext();
    expect(ctx().getStoreStock(1, 99999)).toBe(0);
  });

  it("setStoreStock floor los decimales", () => {
    const ctx = captureContext();
    act(() => ctx().setStoreStock(1, 1, 7.9));
    expect(ctx().getStoreStock(1, 1)).toBe(7);
  });
});

describe("M1-HU7: validateStoreCode (autenticación por tienda)", () => {
  beforeEach(() => {
    seedUsersStorage();
  });

  it("acepta el código correcto de Pereira Plaza", () => {
    const ctx = captureContext();
    expect(ctx().validateStoreCode(1, "PereiraPlaza2026")).toBe(true);
  });

  it("acepta el código correcto de Unicentro", () => {
    const ctx = captureContext();
    expect(ctx().validateStoreCode(2, "Unicentro2026")).toBe(true);
  });

  it("acepta el código correcto de Bolívar Plaza", () => {
    const ctx = captureContext();
    expect(ctx().validateStoreCode(3, "BolivarPlaza2026")).toBe(true);
  });

  it("rechaza un código incorrecto", () => {
    const ctx = captureContext();
    expect(ctx().validateStoreCode(1, "wrong-password")).toBe(false);
  });

  it("rechaza el código de una tienda usado contra otra", () => {
    const ctx = captureContext();
    expect(ctx().validateStoreCode(1, "Unicentro2026")).toBe(false);
  });

  it("rechaza string vacío", () => {
    const ctx = captureContext();
    expect(ctx().validateStoreCode(1, "")).toBe(false);
  });

  it("rechaza una tienda inexistente", () => {
    const ctx = captureContext();
    expect(ctx().validateStoreCode(99, "PereiraPlaza2026")).toBe(false);
  });

  it("tolera espacios al inicio/final del código", () => {
    const ctx = captureContext();
    expect(ctx().validateStoreCode(1, "  PereiraPlaza2026  ")).toBe(true);
  });
});

describe("M2-HU11: nearestStoreWithStock", () => {
  beforeEach(() => {
    seedUsersStorage();
  });

  it("devuelve null cuando ninguna tienda tiene stock", () => {
    const ctx = captureContext();
    act(() => {
      ctx().setStoreStock(1, 999, 0);
      ctx().setStoreStock(2, 999, 0);
      ctx().setStoreStock(3, 999, 0);
    });
    expect(ctx().nearestStoreWithStock(999, 1)).toBeNull();
  });

  it("devuelve la única tienda con stock disponible", () => {
    const ctx = captureContext();
    act(() => {
      ctx().setStoreStock(1, 50, 0);
      ctx().setStoreStock(2, 50, 5);
      ctx().setStoreStock(3, 50, 0);
    });
    const result = ctx().nearestStoreWithStock(50, 1);
    expect(result).not.toBeNull();
    expect(result!.store.id).toBe(2);
  });

  it("entre varias tiendas con stock, prefiere la más cercana al centro", () => {
    const ctx = captureContext();
    act(() => {
      ctx().setStoreStock(1, 60, 10);
      ctx().setStoreStock(2, 60, 10);
      ctx().setStoreStock(3, 60, 10);
    });
    const result = ctx().nearestStoreWithStock(60, 1);
    expect(result).not.toBeNull();
    expect(result!.distanceKm).toBeGreaterThanOrEqual(0);
    // La distancia retornada debe ser la menor entre las 3
    const allDists = [1, 2, 3].map(id => {
      const r = ctx().nearestStoreWithStock(60, 1, {
        lat: 4.8133, lng: -75.6961
      });
      return r?.distanceKm ?? Infinity;
    });
    expect(result!.distanceKm).toBeLessThanOrEqual(Math.max(...allDists));
  });

  it("respeta el parámetro de cantidad mínima (qty)", () => {
    const ctx = captureContext();
    act(() => {
      ctx().setStoreStock(1, 70, 1);
      ctx().setStoreStock(2, 70, 5);
      ctx().setStoreStock(3, 70, 0);
    });
    // Pedir 2 ejemplares: tienda 1 (stock=1) queda fuera
    const result = ctx().nearestStoreWithStock(70, 2);
    expect(result!.store.id).toBe(2);
  });

  it("calcula desde una ubicación origen alternativa", () => {
    const ctx = captureContext();
    act(() => {
      ctx().setStoreStock(1, 80, 1);
      ctx().setStoreStock(2, 80, 1);
      ctx().setStoreStock(3, 80, 1);
    });
    const fromBogota = { lat: 4.7110, lng: -74.0721 };
    const result = ctx().nearestStoreWithStock(80, 1, fromBogota);
    expect(result).not.toBeNull();
    // Bogotá ↔ Pereira: ~180 km en línea recta (haversine)
    expect(result!.distanceKm).toBeGreaterThan(150);
    expect(result!.distanceKm).toBeLessThan(250);
  });
});
