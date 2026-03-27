import { useState } from "react";
import {
  BookOpen, Search, User, Sparkles, Settings,
  Shield, ShoppingCart, LogOut, Wallet,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useShop, fmt } from "../store/ShopContext";

// Color y etiqueta por rol
const ROLE_META = {
  root:      { label: "Root",           bg: "#4A3728", fg: "#FEFAE0", Icon: Shield },
  admin:     { label: "Administrador",  bg: "#606C38", fg: "#fff",    Icon: Settings },
  cliente:   { label: "Cliente",        bg: "#D4A373", fg: "#4A3728", Icon: User },
  visitante: { label: "Visitante",      bg: "#EDE0C4", fg: "#4A3728", Icon: User },
};

export function Home() {
  const navigate = useNavigate();
  const { user, books, logout } = useShop();

  const [searchQuery, setSearchQuery] = useState("");
  const [logoutModal, setLogoutModal] = useState(false);

  // Datos REALES del contexto global — sin mocks locales
  const newBooks      = books.filter(b => b.isNew).slice(0, 4);
  const recommended   = books.filter(b => b.available && !b.isNew).slice(0, 4);

  const role      = user?.role ?? "visitante";
  const roleMeta  = ROLE_META[role];
  const RoleIcon  = roleMeta.Icon;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FEFAE0" }}>

      {/* Logout modal (M4-HU7) */}
      {logoutModal && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4"
          style={{ background: "rgba(74,55,40,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-8 text-center bg-white"
            style={{ boxShadow: "0 24px 80px rgba(74,55,40,0.3)" }}>
            <LogOut className="w-10 h-10 mx-auto mb-3" style={{ color: "#4A3728" }} />
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
              ¿Cerrar sesión?
            </h3>
            <p className="text-sm mb-6" style={{ color: "#6B5344" }}>
              Tu sesión será terminada y serás redirigido al inicio.
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

      {/* ── HEADER ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-[200]" style={{ background: "#fff", boxShadow: "0 2px 20px rgba(74,55,40,0.10)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#4A3728" }}>
              <BookOpen className="w-5 h-5" style={{ color: "#D4A373" }} />
            </div>
            <span className="font-bold hidden sm:block" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
              Biblioteca Digital
            </span>
          </div>

          {/* Buscador (solo clientes y visitantes) */}
          {(role === "cliente" || role === "visitante") && (
            <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#D4A373" }} />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar libros, autores, ISBN…"
                  className="w-full pl-10 pr-4 py-2 rounded-full text-sm outline-none"
                  style={{ border: "1.5px solid #E8C99A", background: "#FEFAE0", color: "#4A3728" }}
                />
              </div>
            </form>
          )}

          <div className="ml-auto flex items-center gap-3">
            {/* ── Nombre + Badge de rol ── */}
            {user && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: "#4A3728" }}>{user.name}</span>
                <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: roleMeta.bg, color: roleMeta.fg }}>
                  <RoleIcon className="w-3 h-3" />
                  {role === "admin" ? "Modo Administrador" : roleMeta.label}
                </span>
              </div>
            )}

            {/* Saldo (M8-HU3 — solo clientes) */}
            {role === "cliente" && (
              <div className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl"
                style={{ background: "#F5EDD3", color: "#4A3728" }}>
                <Wallet className="w-3.5 h-3.5" />
                {fmt(user?.balance ?? 0)}
              </div>
            )}

            {/* Logout */}
            {user && (
              <button onClick={() => setLogoutModal(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                style={{ background: "#F5EDD3" }} title="Cerrar sesión">
                <LogOut className="w-4 h-4" style={{ color: "#4A3728" }} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-16 px-4"
        style={{ background: "linear-gradient(135deg,#4A3728 0%,#6B5344 60%,#8B6555 100%)" }}>
        <div className="max-w-4xl mx-auto text-center relative z-10">

          {/* Badge de modo para admin/root en hero */}
          {(role === "admin" || role === "root") && (
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full text-sm font-semibold"
              style={{ background: "rgba(255,255,255,0.15)", color: "#FEFAE0", border: "1px solid rgba(255,255,255,0.3)" }}>
              <RoleIcon className="w-4 h-4" />
              {role === "root" ? "Panel de Control — Root" : "Panel de Gestión — Administrador"}
            </div>
          )}

          <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#FEFAE0" }}>
            {role === "cliente" || role === "visitante"
              ? "Tu próxima gran lectura te espera"
              : role === "admin"
                ? "Gestiona el inventario de la biblioteca"
                : "Administración del Sistema Biblion"}
          </h1>
          <p className="text-lg mb-8" style={{ color: "rgba(254,250,224,0.85)" }}>
            {role === "cliente"
              ? `Bienvenido de vuelta, ${user?.name?.split(" ")[0]}. Saldo disponible: ${fmt(user?.balance ?? 0)}`
              : role === "admin"
                ? "Registra, edita y gestiona el catálogo de libros desde este panel."
                : role === "root"
                  ? "Administra cuentas, permisos y configuraciones del sistema."
                  : "Explora más de 10,000 títulos disponibles en nuestra colección."}
          </p>

          {/* ── BOTONES CONDICIONALES POR ROL ── */}
          <div className="flex flex-wrap gap-3 justify-center">

            {/* Solo para clientes — acceso a la tienda */}
            {role === "cliente" && (
              <>
                <Link to="/shop">
                  <button className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-90 hover:shadow-lg"
                    style={{ background: "#D4A373", color: "#4A3728" }}>
                    <ShoppingCart className="w-4 h-4" />
                    Ir a la tienda
                  </button>
                </Link>
                <Link to="/shop">
                  <button className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-80"
                    style={{ background: "rgba(255,255,255,0.15)", color: "#FEFAE0", border: "1px solid rgba(255,255,255,0.3)" }}>
                    <Sparkles className="w-4 h-4" />
                    Ver catálogo completo
                  </button>
                </Link>
              </>
            )}

            {/* Visitantes — no tienen acceso a la tienda, solo catálogo de lectura */}
            {role === "visitante" && (
              <>
                <Link to="/shop">
                  <button className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-90"
                    style={{ background: "#D4A373", color: "#4A3728" }}>
                    <BookOpen className="w-4 h-4" />
                    Explorar catálogo
                  </button>
                </Link>
                <Link to="/register">
                  <button className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-80"
                    style={{ background: "rgba(255,255,255,0.15)", color: "#FEFAE0", border: "1px solid rgba(255,255,255,0.3)" }}>
                    Registrarse
                  </button>
                </Link>
              </>
            )}

            {/* Solo para Admins — Gestión de Inventario */}
            {role === "admin" && (
              <Link to="/admin-catalog">
                <button className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-90 hover:shadow-lg"
                  style={{ background: "#D4A373", color: "#4A3728" }}>
                  <Settings className="w-4 h-4" />
                  Gestión de Inventario
                </button>
              </Link>
            )}

            {/* Solo para Root — Gestión de Usuarios */}
            {role === "root" && (
              <>
                <Link to="/root-dashboard">
                  <button className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-90 hover:shadow-lg"
                    style={{ background: "#D4A373", color: "#4A3728" }}>
                    <Shield className="w-4 h-4" />
                    Gestión de Usuarios
                  </button>
                </Link>
                <Link to="/admin-catalog">
                  <button className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-80"
                    style={{ background: "rgba(255,255,255,0.15)", color: "#FEFAE0", border: "1px solid rgba(255,255,255,0.3)" }}>
                    <Settings className="w-4 h-4" />
                    Gestión de Inventario
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-5 rounded-full"
          style={{ background: "#D4A373", transform: "translate(30%,-30%)" }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 opacity-5 rounded-full"
          style={{ background: "#D4A373", transform: "translate(-30%,30%)" }} />
      </section>

      {/* ── SECCIÓN: RECIÉN AÑADIDOS (datos reales del contexto) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
              Recién Añadidos
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "#6B5344", opacity: 0.75 }}>
              {newBooks.length} títulos nuevos en el catálogo
            </p>
          </div>
          {(role === "cliente" || role === "visitante") && (
            <Link to="/shop" className="text-sm font-medium hover:underline" style={{ color: "#606C38" }}>
              Ver todos →
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {newBooks.map(book => (
            <div key={book.id}
              className="rounded-2xl overflow-hidden transition-all hover:shadow-lg group"
              style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}>
              <div className="relative h-48 overflow-hidden">
                <img src={book.cover} alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=450&fit=crop"; }} />
                <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "#606C38", color: "#fff" }}>Nuevo</span>
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm leading-tight mb-0.5 line-clamp-2"
                  style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>{book.title}</p>
                <p className="text-xs mb-2" style={{ color: "#6B5344", opacity: 0.75 }}>{book.author}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
                    {fmt(book.price)}
                  </span>
                  <span className="text-xs flex items-center gap-0.5" style={{ color: "#6B5344" }}>
                    ⭐ {book.rating}
                  </span>
                </div>
                {role === "cliente" && (
                  <Link to="/shop">
                    <button className="w-full mt-2 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                      style={{ background: "#4A3728", color: "#FEFAE0" }}>
                      Ver en tienda
                    </button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECCIÓN: RECOMENDACIONES (solo clientes) ── */}
      {role === "cliente" && recommended.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2"
                style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
                <Sparkles className="w-5 h-5" style={{ color: "#D4A373" }} />
                Recomendados para Ti
              </h2>
              <p className="text-sm mt-0.5" style={{ color: "#6B5344", opacity: 0.75 }}>
                Basados en tus preferencias
              </p>
            </div>
            <Link to="/shop" className="text-sm font-medium hover:underline" style={{ color: "#606C38" }}>
              Ver más →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {recommended.map(book => (
              <div key={book.id}
                className="rounded-2xl overflow-hidden transition-all hover:shadow-lg group"
                style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}>
                <div className="relative h-48 overflow-hidden">
                  <img src={book.cover} alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=450&fit=crop"; }} />
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm leading-tight mb-0.5 line-clamp-2"
                    style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>{book.title}</p>
                  <p className="text-xs mb-2" style={{ color: "#6B5344", opacity: 0.75 }}>{book.author}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
                      {fmt(book.price)}
                    </span>
                    <span className="text-xs flex items-center gap-0.5" style={{ color: "#6B5344" }}>
                      ⭐ {book.rating}
                    </span>
                  </div>
                  <Link to="/shop">
                    <button className="w-full mt-2 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                      style={{ background: "#F5EDD3", color: "#4A3728", border: "1px solid #D4A373" }}>
                      Ver en tienda
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Stats para admin / root */}
      {(role === "admin" || role === "root") && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
            Resumen del inventario
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {[
              { label: "Total de libros", value: books.length, color: "#4A3728" },
              { label: "Disponibles", value: books.filter(b => b.available).length, color: "#606C38" },
              { label: "Sin stock", value: books.filter(b => !b.available).length, color: "#C0392B" },
              { label: "Títulos nuevos", value: books.filter(b => b.isNew).length, color: "#2980B9" },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl p-5 text-center"
                style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}>
                <p className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: stat.color }}>
                  {stat.value}
                </p>
                <p className="text-xs" style={{ color: "#6B5344" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
