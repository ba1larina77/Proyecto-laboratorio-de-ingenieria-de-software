import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { BookOpen, LogOut, Wallet, Shield, Settings } from "lucide-react";
import { useShop, fmt } from "../store/ShopContext";
import { Catalog }       from "./shop/Catalog";
import { Reservations }  from "./shop/Reservations";
import { History }       from "./shop/History";
import { CartSidebar }   from "./shop/CartSidebar";
import { CheckoutModal } from "./shop/CheckoutModal";
import { Toast }         from "./shop/Toast";
import { AdminPanel }    from "./admin/AdminPanel";
import { RootPanel }     from "./root/RootPanel";
import { Wallet as WalletPanel } from "./financial/Wallet";

type ShopTab = "catalog" | "reservations" | "history" | "wallet" | "admin" | "root";

export function Shop() {
  const { user, cart, reservations, openCart, logout } = useShop();
  const navigate = useNavigate();
  const role = user?.role ?? "visitante";

  const [tab, setTab] = useState<ShopTab>("catalog");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);

  const cartCount        = cart.reduce((s, i) => s + i.qty, 0);
  const activeReservations = reservations.filter(r => r.status === "active").length;

  // Tabs según el rol
  const ALL_TABS: { key: ShopTab; label: string; badge?: number; roles: string[] }[] = [
    { key: "catalog",      label: "Catálogo",        roles: ["cliente", "admin", "root", "visitante"] },
    { key: "reservations", label: "Reservas",         badge: activeReservations, roles: ["cliente"] },
    { key: "history",      label: "Historial",        roles: ["cliente"] },
    { key: "wallet",       label: "Mi Billetera",     roles: ["cliente"] },
    { key: "admin",        label: "Gestión Libros",   roles: ["admin", "root"] },
    { key: "root",         label: "Panel Root",       roles: ["root"] },
  ];
  const TABS = ALL_TABS.filter(t => t.roles.includes(role));

  function handleLogout() {
    logout();
    navigate("/");
  }

  // Badge por rol
  const RoleBadge = () => {
    if (role === "root")  return (
      <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
        style={{ background: "#4A3728", color: "#FEFAE0" }}>
        <Shield className="w-3 h-3" /> Root
      </span>
    );
    if (role === "admin") return (
      <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
        style={{ background: "#606C38", color: "#fff" }}>
        <Settings className="w-3 h-3" /> Administrador
      </span>
    );
    if (role === "cliente") return (
      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
        style={{ background: "#D4A373", color: "#4A3728" }}>Cliente</span>
    );
    return null;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FEFAE0" }}>

      {/* Logout modal (M4-HU7) */}
      {logoutModal && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4"
          style={{ background: "rgba(74,55,40,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-8 text-center bg-white"
            style={{ boxShadow: "0 24px 80px rgba(74,55,40,0.3)" }}>
            <LogOut className="w-10 h-10 mx-auto mb-3" style={{ color: "#4A3728" }} />
            <h3 className="text-xl font-bold mb-2"
              style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
              ¿Cerrar sesión?
            </h3>
            <p className="text-sm mb-6" style={{ color: "#6B5344" }}>
              Tu sesión y datos locales serán eliminados.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setLogoutModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                style={{ borderColor: "#D4A373", color: "#4A3728" }}>Cancelar</button>
              <button onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "#C0392B", color: "#fff" }}>Cerrar sesión</button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-[200]" style={{ background: "#fff", boxShadow: "0 2px 20px rgba(74,55,40,0.10)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-4">

          <Link to="/home" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#4A3728" }}>
              <BookOpen className="w-5 h-5" style={{ color: "#D4A373" }} />
            </div>
            <span className="hidden sm:block font-medium" style={{ color: "#4A3728" }}>Biblioteca Digital</span>
          </Link>

          {/* Badge del rol actual */}
          <RoleBadge />

          {/* Tabs de navegación */}
          <nav className="flex gap-1 rounded-xl p-1 mx-auto overflow-x-auto" style={{ background: "#F5EDD3" }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="relative px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                style={tab === t.key
                  ? { background: "#fff", color: "#4A3728", boxShadow: "0 2px 8px rgba(74,55,40,0.12)" }
                  : { color: "#6B5344" }}>
                {t.label}
                {t.badge ? (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-0.5"
                    style={{ background: "#606C38", color: "#fff" }}>
                    {t.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Saldo visible en nav (M8-HU3 — solo clientes) */}
            {role === "cliente" && (
              <button onClick={() => setTab("wallet")}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-80"
                style={{ background: "#F5EDD3", color: "#4A3728" }}>
                <Wallet className="w-3.5 h-3.5" />
                {fmt(user?.balance ?? 0)}
              </button>
            )}

            {/* Carrito (solo clientes) */}
            {role === "cliente" && (
              <button onClick={openCart}
                className="relative w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
                style={{ background: "#F5EDD3" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A3728" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1"
                    style={{ background: "#4A3728", color: "#FEFAE0" }}>
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Logout */}
            <button onClick={() => setLogoutModal(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
              style={{ background: "#F5EDD3" }} title="Cerrar sesión">
              <LogOut className="w-4 h-4" style={{ color: "#4A3728" }} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tab === "catalog"      && <Catalog />}
        {tab === "reservations" && <Reservations />}
        {tab === "history"      && <History />}
        {tab === "wallet"       && <WalletPanel />}
        {tab === "admin"        && <AdminPanel />}
        {tab === "root"         && <RootPanel />}
      </main>

      {role === "cliente" && (
        <>
          <CartSidebar onCheckout={() => setCheckoutOpen(true)} />
          <CheckoutModal
            open={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
            onSuccess={() => setTab("history")} />
        </>
      )}
      <Toast />
    </div>
  );
}
