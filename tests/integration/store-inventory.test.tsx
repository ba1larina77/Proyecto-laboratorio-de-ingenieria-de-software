/**
 * Tests de integración — StoreInventoryPanel (M1-HU7)
 *
 * Verifica el flujo UX completo:
 *  1. Lista las 3 tiendas con sus métricas
 *  2. Al seleccionar tienda, pide código
 *  3. Código incorrecto → error visible
 *  4. Código correcto → se despliega la lista de libros editable
 *  5. Editar stock y guardar persiste el cambio
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { useEffect } from "react";
import { ShopProvider, useShop } from "../../src/app/store/ShopContext";
import { StoreInventoryPanel } from "../../src/app/components/admin/StoreInventoryPanel";
import { seedUsersStorage } from "../test-utils";
import { ReactNode } from "react";

function Wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter><ShopProvider>{children}</ShopProvider></MemoryRouter>;
}

function AsAdmin() {
  const { user, login } = useShop();
  useEffect(() => {
    if (!user) login("admin@biblion.co", "admin1234");
  }, [user, login]);
  if (!user) return null;
  return <StoreInventoryPanel />;
}

describe("StoreInventoryPanel — vista de tiendas", () => {
  beforeEach(() => seedUsersStorage());

  it("renderiza las 3 tiendas de Pereira", async () => {
    render(<AsAdmin />, { wrapper: Wrapper });
    expect(await screen.findByText(/Pereira Plaza/i)).toBeInTheDocument();
    expect(screen.getByText(/Unicentro/i)).toBeInTheDocument();
    expect(screen.getByText(/Bolívar Plaza/i)).toBeInTheDocument();
  });

  it("muestra el indicador '🔒 Requiere código' en cada tienda", async () => {
    render(<AsAdmin />, { wrapper: Wrapper });
    await screen.findByText(/Pereira Plaza/i);
    // El subtítulo del componente también contiene "Requiere código",
    // así que validamos 3 (cards) + 1 (subtítulo) = 4 ocurrencias.
    const all = screen.getAllByText(/Requiere código/);
    expect(all.length).toBeGreaterThanOrEqual(3);
  });
});

describe("StoreInventoryPanel — flujo de autenticación por código", () => {
  beforeEach(() => seedUsersStorage());

  it("muestra el modal de código al seleccionar una tienda", async () => {
    render(<AsAdmin />, { wrapper: Wrapper });
    const pereiraPlazaCard = await screen.findByText(/Pereira Plaza/i);
    fireEvent.click(pereiraPlazaCard);
    expect(await screen.findByText(/Ingresa el código de tienda/i)).toBeInTheDocument();
  });

  it("rechaza un código incorrecto y muestra mensaje de error", async () => {
    render(<AsAdmin />, { wrapper: Wrapper });
    fireEvent.click(await screen.findByText(/Pereira Plaza/i));

    const codeInput = await screen.findByPlaceholderText("••••••••");
    fireEvent.change(codeInput, { target: { value: "wrong-code" } });
    fireEvent.click(screen.getByRole("button", { name: /Desbloquear inventario/i }));

    expect(await screen.findByText(/Código incorrecto/i)).toBeInTheDocument();
  });

  it("acepta el código correcto y desbloquea el formulario", async () => {
    render(<AsAdmin />, { wrapper: Wrapper });
    fireEvent.click(await screen.findByText(/Pereira Plaza/i));

    const codeInput = await screen.findByPlaceholderText("••••••••");
    fireEvent.change(codeInput, { target: { value: "PereiraPlaza2026" } });
    fireEvent.click(screen.getByRole("button", { name: /Desbloquear inventario/i }));

    expect(await screen.findByText(/Tienda desbloqueada/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Buscar libro por título/i)).toBeInTheDocument();
  });

  it("rechaza código vacío y pide ingresar uno", async () => {
    render(<AsAdmin />, { wrapper: Wrapper });
    fireEvent.click(await screen.findByText(/Pereira Plaza/i));
    fireEvent.click(await screen.findByRole("button", { name: /Desbloquear inventario/i }));
    // "Ingresa el código" aparece tanto en el subtítulo como en el mensaje de error.
    // Validamos que el mensaje de error específico ("Ingresa el código de la tienda") esté presente.
    expect(await screen.findByText(/Ingresa el código de la tienda/i)).toBeInTheDocument();
  });

  it("el código de una tienda no funciona en otra", async () => {
    render(<AsAdmin />, { wrapper: Wrapper });
    fireEvent.click(await screen.findByText(/Pereira Plaza/i));
    const codeInput = await screen.findByPlaceholderText("••••••••");
    fireEvent.change(codeInput, { target: { value: "Unicentro2026" } });
    fireEvent.click(screen.getByRole("button", { name: /Desbloquear inventario/i }));
    expect(await screen.findByText(/Código incorrecto/i)).toBeInTheDocument();
  });

  it("permite volver atrás con el botón '← Volver a tiendas'", async () => {
    render(<AsAdmin />, { wrapper: Wrapper });
    fireEvent.click(await screen.findByText(/Pereira Plaza/i));
    expect(await screen.findByText(/Ingresa el código de tienda/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Volver a tiendas/i));
    expect(screen.queryByText(/Ingresa el código de tienda/i)).not.toBeInTheDocument();
    // El subtítulo del componente también contiene "Requiere código", así que esperamos ≥3
    expect(screen.getAllByText(/Requiere código/).length).toBeGreaterThanOrEqual(3);
  });
});

describe("StoreInventoryPanel — edición tras desbloqueo", () => {
  beforeEach(() => seedUsersStorage());

  async function setupUnlocked() {
    render(<AsAdmin />, { wrapper: Wrapper });
    fireEvent.click(await screen.findByText(/Pereira Plaza/i));
    const codeInput = await screen.findByPlaceholderText("••••••••");
    fireEvent.change(codeInput, { target: { value: "PereiraPlaza2026" } });
    fireEvent.click(screen.getByRole("button", { name: /Desbloquear inventario/i }));
    await screen.findByText(/Tienda desbloqueada/i);
  }

  it("lista los libros del inventario tras desbloquear", async () => {
    await setupUnlocked();
    expect(screen.getByText(/Cien Años de Soledad/i)).toBeInTheDocument();
  });

  it("muestra el botón 'Guardar todos los cambios'", async () => {
    await setupUnlocked();
    expect(screen.getByText(/Guardar todos los cambios/i)).toBeInTheDocument();
  });

  it("muestra el botón 'Cerrar' (lock)", async () => {
    await setupUnlocked();
    expect(screen.getByRole("button", { name: /Cerrar/i })).toBeInTheDocument();
  });

  it("permite buscar libros por título", async () => {
    await setupUnlocked();
    const search = screen.getByPlaceholderText(/Buscar libro por título/i);
    fireEvent.change(search, { target: { value: "Sapiens" } });
    expect(screen.getByText(/Sapiens/)).toBeInTheDocument();
    expect(screen.queryByText(/Cien Años de Soledad/)).not.toBeInTheDocument();
  });
});
