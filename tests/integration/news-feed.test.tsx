/**
 * Tests de integración — NewsFeed (M1-HU5)
 *
 * Verifica el rendering del feed de noticias:
 *  - Estado vacío
 *  - Renderizado de noticias publicadas
 *  - Filtrado por estado
 *  - Botón de reproceso (solo visible para admin/root)
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { useEffect } from "react";
import { ShopProvider, useShop } from "../../src/app/store/ShopContext";
import { NewsFeed } from "../../src/app/components/news/NewsFeed";
import { seedUsersStorage } from "../test-utils";
import { ReactNode } from "react";
import type { News } from "../../src/app/store/shopTypes";

function Wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter><ShopProvider>{children}</ShopProvider></MemoryRouter>;
}

describe("NewsFeed — visitante sin noticias", () => {
  beforeEach(() => seedUsersStorage());

  it("muestra el estado vacío cuando no hay noticias", () => {
    render(<NewsFeed />, { wrapper: Wrapper });
    expect(screen.getByText(/Noticias y Novedades/i)).toBeInTheDocument();
    expect(screen.getByText(/Aún no hay noticias/i)).toBeInTheDocument();
  });
});

describe("NewsFeed — con noticias publicadas (visitante)", () => {
  beforeEach(() => {
    seedUsersStorage();
    const news: News[] = [
      {
        id: "N-1", bookId: 1, title: "📚 Nuevo libro: Cien Años de Soledad",
        body: "Disponible hoy.", bookTitle: "Cien Años de Soledad",
        bookAuthor: "Gabriel García Márquez", bookCategory: "Ficción",
        bookPrice: 28900, publishedAt: new Date(), status: "published",
      },
      {
        id: "N-2", bookId: 2, title: "📚 Nuevo libro: El Principito",
        body: "Ya disponible.", bookTitle: "El Principito",
        bookAuthor: "Antoine de Saint-Exupéry", bookCategory: "Ficción",
        bookPrice: 18500, publishedAt: new Date(), status: "published",
      },
    ];
    localStorage.setItem("biblion_news", JSON.stringify(news));
  });

  it("renderiza las noticias publicadas", () => {
    render(<NewsFeed />, { wrapper: Wrapper });
    // "Cien Años de Soledad" aparece 2 veces (en header h3 y en strip de detalles)
    // así que usamos getAllByText y verificamos que haya al menos 1
    expect(screen.getAllByText(/Cien Años de Soledad/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/El Principito/).length).toBeGreaterThanOrEqual(1);
  });

  it("muestra los detalles del libro (autor, género, precio)", () => {
    render(<NewsFeed />, { wrapper: Wrapper });
    expect(screen.getAllByText(/Gabriel García Márquez/).length).toBeGreaterThanOrEqual(1);
    // El precio aparece formateado COP
    expect(screen.getAllByText(/28\.900/).length).toBeGreaterThanOrEqual(1);
  });

  it("NO muestra el botón de reproceso a usuarios sin sesión", () => {
    render(<NewsFeed />, { wrapper: Wrapper });
    expect(screen.queryByText(/Reprocesar/i)).not.toBeInTheDocument();
  });

  it("muestra el contador de 2 noticias publicadas", () => {
    render(<NewsFeed />, { wrapper: Wrapper });
    // En el componente hay 2 <strong>2</strong> (uno para "total", otro para "publicadas")
    const twos = screen.getAllByText("2");
    expect(twos.length).toBeGreaterThanOrEqual(2);
    // Cada uno está dentro de un <strong>
    twos.forEach(el => expect(el.tagName.toLowerCase()).toBe("strong"));
  });
});

describe("NewsFeed — con noticias pendientes (admin)", () => {
  beforeEach(() => {
    seedUsersStorage();
    const news: News[] = [
      {
        id: "N-pending", bookId: 1, title: "Pendiente",
        body: "Falló la publicación.", bookTitle: "Libro X",
        bookAuthor: "Autor", bookCategory: "Ciencia",
        bookPrice: 10000, publishedAt: new Date(), status: "pending",
        retries: 2, lastError: "Network timeout",
      },
    ];
    localStorage.setItem("biblion_news", JSON.stringify(news));
  });

  function AsAdmin() {
    const { user, login } = useShop();
    useEffect(() => {
      if (!user) login("admin@biblion.co", "admin1234");
    }, [user, login]);
    if (!user) return null;
    return <NewsFeed />;
  }

  it("muestra el botón de reproceso al administrador", async () => {
    render(<AsAdmin />, { wrapper: Wrapper });
    // "Reprocesar" aparece como botón ("🔄 Reprocesar (1)") y en el subtítulo
    // ("Las noticias pendientes pueden reprocesarse"). Buscamos el botón específico.
    const btn = await screen.findByRole("button", { name: /Reprocesar/i });
    expect(btn).toBeInTheDocument();
  });

  it("muestra el badge 'Pendiente de publicación'", async () => {
    render(<AsAdmin />, { wrapper: Wrapper });
    expect(await screen.findByText(/Pendiente de publicación/i)).toBeInTheDocument();
  });

  it("admin ve el último error si la noticia está pendiente", async () => {
    render(<AsAdmin />, { wrapper: Wrapper });
    expect(await screen.findByText(/Network timeout/i)).toBeInTheDocument();
  });

  it("permite filtrar por estado 'Pendientes'", async () => {
    render(<AsAdmin />, { wrapper: Wrapper });
    // "Pendientes" aparece en el badge contador y como botón de filtro.
    // Buscamos específicamente el botón de filtro.
    const pendientesBtn = await screen.findByRole("button", { name: /^Pendientes$/i });
    fireEvent.click(pendientesBtn);
    expect(await screen.findByText(/Libro X/)).toBeInTheDocument();
  });
});
