/**
 * Tests M1-HU5 — Noticias automáticas por nuevo libro
 *
 * Cubre:
 *  - addBook genera una noticia automáticamente
 *  - Estructura de la noticia (título, autor, género, precio, fecha)
 *  - retryPendingNews recupera publicaciones fallidas
 *  - Persistencia en localStorage
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, act, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ReactNode } from "react";
import { ShopProvider, useShop } from "../../src/app/store/ShopContext";
import type { News } from "../../src/app/store/shopTypes";
import { seedUsersStorage } from "../test-utils";

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter><ShopProvider>{children}</ShopProvider></MemoryRouter>
  );
}

function captureContext() {
  let captured: ReturnType<typeof useShop> | null = null;
  function Probe() {
    captured = useShop();
    return null;
  }
  render(<Probe />, { wrapper: Wrapper });
  return () => captured!;
}

describe("M1-HU5: Publicación automática al registrar libro", () => {
  beforeEach(() => {
    seedUsersStorage();
  });

  it("publica una noticia tras crear un libro", async () => {
    const ctx = captureContext();
    expect(ctx().news.length).toBe(0);

    await act(async () => {
      ctx().addBook({
        title: "Libro de prueba",
        author: "Autor Test",
        categories: ["Ficción"],
        price: 25000,
        rating: 0,
        isNew: true,
        available: true,
        stock: 5,
        cover: "https://example.com/cover.jpg",
      });
      // Permite que el setTimeout(0) del addBook se ejecute
      await new Promise(r => setTimeout(r, 10));
    });

    await waitFor(() => {
      expect(ctx().news.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("la noticia incluye título, autor, género y precio", async () => {
    const ctx = captureContext();

    await act(async () => {
      ctx().addBook({
        title: "Crónica de un evento",
        author: "García",
        categories: ["Historia"],
        price: 37500,
        rating: 0, isNew: true, available: true, stock: 3,
        cover: "https://example.com/c.jpg",
      });
      await new Promise(r => setTimeout(r, 10));
    });

    await waitFor(() => expect(ctx().news.length).toBeGreaterThanOrEqual(1));
    const n = ctx().news[0] as News;
    expect(n.bookTitle).toBe("Crónica de un evento");
    expect(n.bookAuthor).toBe("García");
    expect(n.bookCategory).toBe("Historia");
    expect(n.bookPrice).toBe(37500);
    expect(n.publishedAt).toBeInstanceOf(Date);
    expect(n.title).toContain("Crónica de un evento");
  });

  it("la noticia tiene status 'published' cuando el libro está completo", async () => {
    const ctx = captureContext();
    await act(async () => {
      ctx().addBook({
        title: "Libro válido",
        author: "Autor Válido",
        categories: ["Ciencia"],
        price: 10000, rating: 0, isNew: true, available: true, stock: 1,
        cover: "https://example.com/c.jpg",
      });
      await new Promise(r => setTimeout(r, 10));
    });
    await waitFor(() => expect(ctx().news.length).toBeGreaterThanOrEqual(1));
    expect(ctx().news[0].status).toBe("published");
  });

  it("varias publicaciones se acumulan en el feed (la más reciente primero)", async () => {
    const ctx = captureContext();
    await act(async () => {
      ctx().addBook({
        title: "Primero", author: "A", categories: ["Ficción"],
        price: 1000, rating: 0, isNew: true, available: true, stock: 1,
        cover: "https://e.com/1.jpg",
      });
      await new Promise(r => setTimeout(r, 10));
    });
    await act(async () => {
      ctx().addBook({
        title: "Segundo", author: "B", categories: ["Poesía"],
        price: 2000, rating: 0, isNew: true, available: true, stock: 1,
        cover: "https://e.com/2.jpg",
      });
      await new Promise(r => setTimeout(r, 10));
    });
    await waitFor(() => expect(ctx().news.length).toBeGreaterThanOrEqual(2));
    expect(ctx().news[0].bookTitle).toBe("Segundo");
    expect(ctx().news[1].bookTitle).toBe("Primero");
  });

  it("las noticias se persisten en localStorage", async () => {
    const ctx = captureContext();
    await act(async () => {
      ctx().addBook({
        title: "Persistente", author: "X", categories: ["Arte"],
        price: 5000, rating: 0, isNew: true, available: true, stock: 1,
        cover: "https://e.com/p.jpg",
      });
      await new Promise(r => setTimeout(r, 10));
    });
    await waitFor(() => {
      const raw = localStorage.getItem("biblion_news");
      expect(raw).toBeTruthy();
      const stored = JSON.parse(raw!);
      expect(stored.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe("M1-HU5: Reproceso de noticias pendientes", () => {
  beforeEach(() => {
    seedUsersStorage();
  });

  it("retryPendingNews sin pendientes devuelve 0 recovered / 0 failing", () => {
    const ctx = captureContext();
    const { recovered, stillFailing } = ctx().retryPendingNews();
    expect(recovered).toBe(0);
    expect(stillFailing).toBe(0);
  });

  it("recupera noticias pendientes con datos completos", () => {
    // Pre-sembrar una noticia pendiente directamente en storage
    const pendingNews: News[] = [{
      id: "N-pending-1",
      bookId: 100,
      title: "Noticia pendiente",
      body: "Pendiente de publicación",
      bookTitle: "Libro X",
      bookAuthor: "Autor X",
      bookCategory: "Ficción",
      bookPrice: 15000,
      publishedAt: new Date(),
      status: "pending",
      retries: 1,
    }];
    localStorage.setItem("biblion_news", JSON.stringify(pendingNews));

    const ctx = captureContext();
    let result: { recovered: number; stillFailing: number } | null = null;
    act(() => {
      result = ctx().retryPendingNews();
    });
    expect(result!.recovered).toBe(1);
    expect(result!.stillFailing).toBe(0);
    expect(ctx().news[0].status).toBe("published");
  });

  it("pendingNews solo contiene noticias en estado pending", () => {
    const mix: News[] = [
      {
        id: "N-1", bookId: 1, title: "OK", body: "", bookTitle: "T1",
        bookAuthor: "A1", bookCategory: "F", bookPrice: 100,
        publishedAt: new Date(), status: "published",
      },
      {
        id: "N-2", bookId: 2, title: "Pending", body: "", bookTitle: "T2",
        bookAuthor: "A2", bookCategory: "F", bookPrice: 200,
        publishedAt: new Date(), status: "pending", retries: 0,
      },
    ];
    localStorage.setItem("biblion_news", JSON.stringify(mix));
    const ctx = captureContext();
    expect(ctx().pendingNews.length).toBe(1);
    expect(ctx().pendingNews[0].id).toBe("N-2");
  });
});
