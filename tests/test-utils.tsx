/**
 * Helpers para tests:
 *  - renderWithShop: monta un componente envuelto en ShopProvider + Router
 *  - loginAs: helper para simular login de un rol específico
 *  - resetUsers: limpia y reinicia el storage de usuarios al estado DEMO
 */
import { ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ShopProvider, useShop } from "../src/app/store/ShopContext";

interface WrapperProps {
  children: ReactNode;
  initialEntries?: string[];
}

function AllProviders({ children, initialEntries = ["/"] }: WrapperProps) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <ShopProvider>{children}</ShopProvider>
    </MemoryRouter>
  );
}

export function renderWithShop(
  ui: ReactNode,
  options: RenderOptions & { initialEntries?: string[] } = {}
) {
  const { initialEntries, ...rest } = options;
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialEntries={initialEntries}>{children}</AllProviders>
    ),
    ...rest,
  });
}

// Hook helper exporter para tests directos del context
export function ShopHookProbe<T>({
  selector,
  onResult,
}: {
  selector: (s: ReturnType<typeof useShop>) => T;
  onResult: (value: T) => void;
}) {
  const ctx = useShop();
  onResult(selector(ctx));
  return null;
}

// Pre-seed users in storage with specific overrides
export function seedUsersStorage(extra: any[] = []) {
  const baseUsers = [
    {
      id: "U-ROOT-001", name: "Administrador Root", email: "root@biblion.co",
      username: "root", password: "Root1234*", role: "root", balance: 0,
    },
    {
      id: "U-ADM-001", name: "Carlos Rodríguez", email: "admin@biblion.co",
      username: "carlos.admin", password: "admin1234", role: "admin", balance: 0,
    },
    {
      id: "U-CLI-001", name: "Juan Carlos Pérez", email: "juan.perez@correo.com",
      username: "juanperez", password: "12345678", role: "cliente", balance: 125800,
    },
    {
      id: "U-SUC-001", name: "Sucursal Pereira Plaza", email: "pereiraplaza@biblion.co",
      username: "suc.pereiraplaza", password: "PereiraPlaza2026", role: "sucursal", balance: 0,
    },
    {
      id: "U-SUC-002", name: "Sucursal Unicentro", email: "unicentro@biblion.co",
      username: "suc.unicentro", password: "Unicentro2026", role: "sucursal", balance: 0,
    },
    {
      id: "U-SUC-003", name: "Sucursal Bolívar Plaza", email: "bolivarplaza@biblion.co",
      username: "suc.bolivarplaza", password: "BolivarPlaza2026", role: "sucursal", balance: 0,
    },
    ...extra,
  ];
  localStorage.setItem("biblion_users_v1", JSON.stringify(baseUsers));
}
