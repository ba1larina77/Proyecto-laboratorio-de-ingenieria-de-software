/**
 * Tests M1 — Módulo Administración de Libros
 *
 * Cubre:
 *  - HU1: addBook (registro)
 *  - HU2: updateBook (edición + bug fix de year/language)
 *  - HU3: eliminar ejemplares (reducción de stock)
 *  - HU4: administrar existencias
 *  - HU6: asignar ID único + copyIds (formato "id.N")
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ReactNode } from "react";
import { ShopProvider, useShop } from "../../src/app/store/ShopContext";
import { seedUsersStorage } from "../test-utils";

function Wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter><ShopProvider>{children}</ShopProvider></MemoryRouter>;
}

function captureContext() {
  let captured: ReturnType<typeof useShop> | null = null;
  function Probe() { captured = useShop(); return null; }
  render(<Probe />, { wrapper: Wrapper });
  return () => captured!;
}

describe("M1-HU1: Registrar libro", () => {
  beforeEach(() => seedUsersStorage());

  it("addBook agrega un libro al inventario", () => {
    const ctx = captureContext();
    const before = ctx().books.length;
    let created: any = null;
    act(() => {
      created = ctx().addBook({
        title: "Libro Nuevo", author: "Autor", categories: ["Ficción"],
        price: 25000, rating: 0, isNew: true, available: true, stock: 5,
        cover: "https://e.com/c.jpg",
      });
    });
    expect(ctx().books.length).toBe(before + 1);
    expect(created.title).toBe("Libro Nuevo");
  });

  it("genera un ID numérico único (mayor al máximo existente)", () => {
    const ctx = captureContext();
    const maxBefore = Math.max(...ctx().books.map(b => b.id));
    let created: any = null;
    act(() => {
      created = ctx().addBook({
        title: "X", author: "Y", categories: ["Arte"],
        price: 100, rating: 0, isNew: true, available: true, stock: 1,
        cover: "https://e.com/c.jpg",
      });
    });
    expect(created.id).toBe(maxBefore + 1);
  });
});

describe("M1-HU6: copyIds y ISBN únicos", () => {
  beforeEach(() => seedUsersStorage());

  it("genera copyIds con formato 'bookId.N' y la longitud coincide con stock", () => {
    const ctx = captureContext();
    let created: any = null;
    act(() => {
      created = ctx().addBook({
        title: "Test copyIds", author: "X", categories: ["Ciencia"],
        price: 100, rating: 0, isNew: true, available: true, stock: 4,
        cover: "https://e.com/c.jpg",
      });
    });
    expect(created.copyIds).toHaveLength(4);
    expect(created.copyIds[0]).toBe(`${created.id}.1`);
    expect(created.copyIds[3]).toBe(`${created.id}.4`);
  });

  it("genera un ISBN automático si no se provee", () => {
    const ctx = captureContext();
    let created: any = null;
    act(() => {
      created = ctx().addBook({
        title: "Sin ISBN", author: "X", categories: ["Filosofía"],
        price: 100, rating: 0, isNew: true, available: true, stock: 1,
        cover: "https://e.com/c.jpg",
      });
    });
    expect(created.isbn).toBeTruthy();
    expect(created.isbn).toMatch(/^978-/);
  });

  it("respeta el ISBN provisto", () => {
    const ctx = captureContext();
    let created: any = null;
    act(() => {
      created = ctx().addBook({
        title: "Con ISBN", author: "X", categories: ["Filosofía"],
        price: 100, rating: 0, isNew: true, available: true, stock: 1,
        cover: "https://e.com/c.jpg",
        isbn: "978-1234567890",
      });
    });
    expect(created.isbn).toBe("978-1234567890");
  });
});

describe("M1-HU2: Editar libro — bug fix Iteración 3 (year + language)", () => {
  beforeEach(() => seedUsersStorage());

  it("conserva year al editar (no se resetea)", () => {
    const ctx = captureContext();
    let created: any = null;
    act(() => {
      created = ctx().addBook({
        title: "Año Test", author: "X", categories: ["Historia"],
        price: 100, rating: 0, isNew: true, available: true, stock: 1,
        cover: "https://e.com/c.jpg", year: 1985,
      });
    });
    expect(created.year).toBe(1985);
    // Editar otro campo no debe afectar year
    act(() => {
      ctx().updateBook(created.id, { price: 200 });
    });
    const after = ctx().books.find(b => b.id === created.id)!;
    expect(after.year).toBe(1985);
    expect(after.price).toBe(200);
  });

  it("conserva language al editar (no se resetea)", () => {
    const ctx = captureContext();
    let created: any = null;
    act(() => {
      created = ctx().addBook({
        title: "Idioma Test", author: "X", categories: ["Poesía"],
        price: 100, rating: 0, isNew: true, available: true, stock: 1,
        cover: "https://e.com/c.jpg", language: "Inglés",
      });
    });
    act(() => {
      ctx().updateBook(created.id, { price: 5000, stock: 10 });
    });
    const after = ctx().books.find(b => b.id === created.id)!;
    expect(after.language).toBe("Inglés");
    expect(after.price).toBe(5000);
    expect(after.stock).toBe(10);
  });

  it("conserva publisher al editar", () => {
    const ctx = captureContext();
    let created: any = null;
    act(() => {
      created = ctx().addBook({
        title: "Editorial Test", author: "X", categories: ["Ficción"],
        price: 100, rating: 0, isNew: true, available: true, stock: 1,
        cover: "https://e.com/c.jpg", publisher: "Penguin",
      });
    });
    act(() => {
      ctx().updateBook(created.id, { stock: 99 });
    });
    expect(ctx().books.find(b => b.id === created.id)!.publisher).toBe("Penguin");
  });
});

describe("M1-HU3/HU4: Administrar existencias", () => {
  beforeEach(() => seedUsersStorage());

  it("aumentar stock añade copyIds sin reusar IDs", () => {
    const ctx = captureContext();
    let created: any = null;
    act(() => {
      created = ctx().addBook({
        title: "Stock Up", author: "X", categories: ["Ciencia"],
        price: 100, rating: 0, isNew: true, available: true, stock: 2,
        cover: "https://e.com/c.jpg",
      });
    });
    expect(created.copyIds).toEqual([`${created.id}.1`, `${created.id}.2`]);

    act(() => ctx().updateBook(created.id, { stock: 5 }));
    const after = ctx().books.find(b => b.id === created.id)!;
    expect(after.stock).toBe(5);
    expect(after.copyIds).toHaveLength(5);
    expect(after.copyIds[4]).toBe(`${created.id}.5`);
  });

  it("reducir stock elimina los últimos copyIds (no los del principio)", () => {
    const ctx = captureContext();
    let created: any = null;
    act(() => {
      created = ctx().addBook({
        title: "Stock Down", author: "X", categories: ["Ciencia"],
        price: 100, rating: 0, isNew: true, available: true, stock: 5,
        cover: "https://e.com/c.jpg",
      });
    });
    act(() => ctx().updateBook(created.id, { stock: 2 }));
    const after = ctx().books.find(b => b.id === created.id)!;
    expect(after.copyIds).toEqual([`${created.id}.1`, `${created.id}.2`]);
  });

  it("stock=0 marca available como false", () => {
    const ctx = captureContext();
    let created: any = null;
    act(() => {
      created = ctx().addBook({
        title: "Zero", author: "X", categories: ["Arte"],
        price: 100, rating: 0, isNew: true, available: true, stock: 3,
        cover: "https://e.com/c.jpg",
      });
    });
    act(() => ctx().updateBook(created.id, { stock: 0 }));
    const after = ctx().books.find(b => b.id === created.id)!;
    expect(after.available).toBe(false);
    expect(after.copyIds).toHaveLength(0);
  });

  it("deleteBook elimina el libro del inventario", () => {
    const ctx = captureContext();
    let created: any = null;
    act(() => {
      created = ctx().addBook({
        title: "Eliminar", author: "X", categories: ["Ficción"],
        price: 100, rating: 0, isNew: true, available: true, stock: 1,
        cover: "https://e.com/c.jpg",
      });
    });
    const before = ctx().books.length;
    act(() => ctx().deleteBook(created.id));
    expect(ctx().books.length).toBe(before - 1);
    expect(ctx().books.find(b => b.id === created.id)).toBeUndefined();
  });
});
