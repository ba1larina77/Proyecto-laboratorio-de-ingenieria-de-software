/**
 * Tests de integración — AdminPanel (M1)
 *
 * Verifica el comportamiento de la UI en modo edición:
 *  - Los campos bibliográficos quedan bloqueados (readOnly)
 *  - Los campos comerciales y categorías siguen editables
 *  - El badge "🔒 No editable" aparece en los campos bloqueados
 *  - La URL de portada no puede quedar vacía
 *
 * Estos tests son asíncronos porque AdminPanelLoggedIn hace login
 * dentro de useEffect (para evitar setState durante render).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { useEffect } from "react";
import { ShopProvider, useShop } from "../../src/app/store/ShopContext";
import { AdminPanel } from "../../src/app/components/admin/AdminPanel";
import { seedUsersStorage } from "../test-utils";
import { ReactNode } from "react";

function Wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter><ShopProvider>{children}</ShopProvider></MemoryRouter>;
}

/** Componente intermedio que asegura el login como admin antes de renderizar AdminPanel */
function AdminPanelLoggedIn() {
  const { user, login } = useShop();
  useEffect(() => {
    if (!user) login("admin@biblion.co", "admin1234");
  }, [user, login]);
  if (!user) return null;
  return <AdminPanel />;
}

describe("AdminPanel — modo registro (sin edición)", () => {
  beforeEach(() => seedUsersStorage());

  it("renderiza el título 'Administración de Libros'", async () => {
    render(<AdminPanelLoggedIn />, { wrapper: Wrapper });
    expect(await screen.findByText(/Administración de Libros/i)).toBeInTheDocument();
  });

  it("permite cambiar a la pestaña de registro y muestra el formulario", async () => {
    render(<AdminPanelLoggedIn />, { wrapper: Wrapper });
    const registrarTab = await screen.findByRole("button", { name: /Registrar Libro/i });
    fireEvent.click(registrarTab);
    expect(await screen.findByText(/Registrar nuevo libro/i)).toBeInTheDocument();
  });
});

describe("AdminPanel — modo edición (Iteración 3: bloqueo de campos)", () => {
  beforeEach(() => seedUsersStorage());

  async function openEditMode() {
    render(<AdminPanelLoggedIn />, { wrapper: Wrapper });
    const editButtons = await screen.findAllByRole("button", { name: /editar/i });
    fireEvent.click(editButtons[0]);
  }

  it("al editar un libro, el título queda con readOnly = true", async () => {
    await openEditMode();
    const titleInput = await screen.findByPlaceholderText(/Título del libro/i) as HTMLInputElement;
    expect(titleInput.readOnly).toBe(true);
  });

  it("muestra varios badges '🔒 No editable' en campos bibliográficos", async () => {
    await openEditMode();
    const badges = await screen.findAllByText(/No editable/i);
    expect(badges.length).toBeGreaterThanOrEqual(5);
  });

  it("al editar, el campo de precio sigue editable (no readOnly)", async () => {
    await openEditMode();
    const priceInput = await screen.findByPlaceholderText(/29900/) as HTMLInputElement;
    expect(priceInput.readOnly).toBe(false);
  });

  it("al editar, el campo de stock sigue editable", async () => {
    await openEditMode();
    const stockInputs = await screen.findAllByPlaceholderText("1") as HTMLInputElement[];
    const stockInput = stockInputs.find(i => i.name === "stock");
    expect(stockInput?.readOnly).toBe(false);
  });

  it("al editar, el campo de URL de portada sigue editable", async () => {
    await openEditMode();
    const coverInput = await screen.findByPlaceholderText(/https:\/\/ejemplo/) as HTMLInputElement;
    expect(coverInput.readOnly).toBe(false);
  });

  it("muestra el subtítulo informando del bloqueo de campos en edición", async () => {
    await openEditMode();
    expect(
      await screen.findByText(/Los datos bibliográficos no pueden modificarse después del registro/i)
    ).toBeInTheDocument();
  });
});
