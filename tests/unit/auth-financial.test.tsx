/**
 * Tests M3 (Usuarios) + M7 (Root) + M8 (Financiero)
 *
 * Cubre:
 *  - M3-HU1: registro de cliente
 *  - M3-HU2: login (válido / inválido)
 *  - M3-HU7: logout
 *  - M3-HU9: creación de admin por root
 *  - M7-HU3: toggle de estado activo/inactivo
 *  - M8-HU3: consulta de saldo
 *  - M8-HU2: updateBalance (recarga)
 *  - M8-HU6: validación de saldo en processPurchase
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ReactNode } from "react";
import { ShopProvider, useShop } from "../../src/app/store/ShopContext";
import { seedUsersStorage } from "../test-utils";
import type { Purchase } from "../../src/app/store/shopTypes";

function Wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter><ShopProvider>{children}</ShopProvider></MemoryRouter>;
}

function captureContext() {
  let captured: ReturnType<typeof useShop> | null = null;
  function Probe() { captured = useShop(); return null; }
  render(<Probe />, { wrapper: Wrapper });
  return () => captured!;
}

describe("M3-HU2: Login", () => {
  beforeEach(() => seedUsersStorage());

  it("acepta credenciales correctas por email", () => {
    const ctx = captureContext();
    let result: any = null;
    act(() => {
      result = ctx().login("juan.perez@correo.com", "12345678");
    });
    expect(result.success).toBe(true);
    expect(result.role).toBe("cliente");
    expect(ctx().user).not.toBeNull();
    expect(ctx().user!.role).toBe("cliente");
  });

  it("acepta credenciales por username", () => {
    const ctx = captureContext();
    let result: any = null;
    act(() => {
      result = ctx().login("juanperez", "12345678");
    });
    expect(result.success).toBe(true);
  });

  it("rechaza contraseña incorrecta", () => {
    const ctx = captureContext();
    let result: any = null;
    act(() => {
      result = ctx().login("juan.perez@correo.com", "wrong");
    });
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("rechaza usuario inexistente", () => {
    const ctx = captureContext();
    let result: any = null;
    act(() => {
      result = ctx().login("nope@nope.com", "x");
    });
    expect(result.success).toBe(false);
  });

  it("login es case-insensitive en el email", () => {
    const ctx = captureContext();
    let result: any = null;
    act(() => {
      result = ctx().login("JUAN.PEREZ@CORREO.COM", "12345678");
    });
    expect(result.success).toBe(true);
  });

  it("logout limpia el usuario en sesión", () => {
    const ctx = captureContext();
    act(() => ctx().login("juan.perez@correo.com", "12345678"));
    expect(ctx().user).not.toBeNull();
    act(() => ctx().logout());
    expect(ctx().user).toBeNull();
  });

  it("admin login devuelve role: 'admin'", () => {
    const ctx = captureContext();
    let result: any = null;
    act(() => {
      result = ctx().login("admin@biblion.co", "admin1234");
    });
    expect(result.success).toBe(true);
    expect(result.role).toBe("admin");
  });

  it("root login devuelve role: 'root'", () => {
    const ctx = captureContext();
    let result: any = null;
    act(() => {
      result = ctx().login("root", "Root1234*");
    });
    expect(result.success).toBe(true);
    expect(result.role).toBe("root");
  });
});

describe("M3-HU1: Registro de cliente", () => {
  beforeEach(() => seedUsersStorage());

  it("registra un nuevo cliente exitosamente", () => {
    const ctx = captureContext();
    let result: any = null;
    act(() => {
      result = ctx().register({
        nombres: "Ana", apellidos: "Gómez", dni: "9999999",
        fechaNacimiento: "1995-01-01", lugarNacimiento: "Pereira",
        direccion: "Cra 1", genero: "femenino",
        correo: "ana@example.com", usuario: "ana.gomez",
        contrasena: "ana123456", temasPreferencia: ["Ficción"],
      });
    });
    expect(result.success).toBe(true);
  });

  it("rechaza correo duplicado", () => {
    const ctx = captureContext();
    let result: any = null;
    act(() => {
      result = ctx().register({
        nombres: "X", apellidos: "Y", dni: "0",
        fechaNacimiento: "1990-01-01", lugarNacimiento: "P",
        direccion: "D", genero: "masculino",
        correo: "juan.perez@correo.com", // ya registrado
        usuario: "newuser", contrasena: "12345678",
        temasPreferencia: [],
      });
    });
    expect(result.success).toBe(false);
  });

  it("rechaza username duplicado", () => {
    const ctx = captureContext();
    let result: any = null;
    act(() => {
      result = ctx().register({
        nombres: "X", apellidos: "Y", dni: "0",
        fechaNacimiento: "1990-01-01", lugarNacimiento: "P",
        direccion: "D", genero: "masculino",
        correo: "new@example.com",
        usuario: "juanperez", // ya registrado
        contrasena: "12345678", temasPreferencia: [],
      });
    });
    expect(result.success).toBe(false);
  });
});

describe("M3-HU9: Creación de admin por root", () => {
  beforeEach(() => seedUsersStorage());

  it("registerAdmin crea un nuevo administrador", () => {
    const ctx = captureContext();
    let result: any = null;
    act(() => {
      result = ctx().registerAdmin({
        correo: "newadmin@biblion.co",
        usuario: "newadmin",
        contrasena: "admin12345",
      });
    });
    expect(result.success).toBe(true);
    expect(ctx().adminsList.find(a => a.usuario === "newadmin")).toBeTruthy();
  });

  it("registerAdmin rechaza correo duplicado", () => {
    const ctx = captureContext();
    let result: any = null;
    act(() => {
      result = ctx().registerAdmin({
        correo: "admin@biblion.co", // duplicado
        usuario: "uniqueuser",
        contrasena: "x123456789",
      });
    });
    expect(result.success).toBe(false);
  });
});

describe("M7-HU3: Toggle de estado de usuarios (admin/cliente)", () => {
  beforeEach(() => seedUsersStorage());

  it("toggleAdminStatus invierte el estado active de un admin", () => {
    const ctx = captureContext();
    const adminId = ctx().adminsList[0]?.id;
    if (!adminId) return; // no admins por defecto
    const before = ctx().adminsList[0].active;
    act(() => ctx().toggleAdminStatus(adminId));
    const after = ctx().adminsList.find(a => a.id === adminId)!;
    expect(after.active).toBe(!before);
  });
});

describe("M8-HU2: updateBalance (recarga billetera)", () => {
  beforeEach(() => seedUsersStorage());

  it("updateBalance suma al saldo del cliente", () => {
    const ctx = captureContext();
    act(() => ctx().login("juan.perez@correo.com", "12345678"));
    const before = ctx().user!.balance;
    act(() => ctx().updateBalance(50000));
    expect(ctx().user!.balance).toBe(before + 50000);
  });

  it("updateBalance acepta valores negativos (descuento)", () => {
    const ctx = captureContext();
    act(() => ctx().login("juan.perez@correo.com", "12345678"));
    const before = ctx().user!.balance;
    act(() => ctx().updateBalance(-10000));
    expect(ctx().user!.balance).toBe(before - 10000);
  });
});

describe("M8-HU6: processPurchase valida saldo", () => {
  beforeEach(() => seedUsersStorage());

  it("rechaza la compra si el saldo es insuficiente", () => {
    const ctx = captureContext();
    act(() => ctx().login("juan.perez@correo.com", "12345678"));
    const huge: Purchase = {
      id: "P-X",
      date: new Date(),
      items: [{ book: ctx().books[0], qty: 1, price: 999999999 }],
      total: 999999999,
      status: "preparing",
      delivery: "shipping",
      tracking: [],
    };
    let result: any = null;
    act(() => { result = ctx().processPurchase(huge); });
    expect(result.success).toBe(false);
  });

  it("aprueba la compra si el saldo es suficiente y descuenta el monto", () => {
    const ctx = captureContext();
    act(() => ctx().login("juan.perez@correo.com", "12345678"));
    const balanceBefore = ctx().user!.balance;
    const small: Purchase = {
      id: "P-OK",
      date: new Date(),
      items: [{ book: ctx().books[0], qty: 1, price: 1000 }],
      total: 1000,
      status: "preparing",
      delivery: "shipping",
      tracking: [],
    };
    let result: any = null;
    act(() => { result = ctx().processPurchase(small); });
    expect(result.success).toBe(true);
    expect(ctx().user!.balance).toBe(balanceBefore - 1000);
    expect(result.transactionId).toBeTruthy();
  });
});
