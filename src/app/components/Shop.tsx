import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { BookOpen, LogOut, Wallet, Shield, Settings, MessageCircle, Send, X, Bell, Mail, User, Save } from "lucide-react";
import { useShop, fmt } from "../store/ShopContext";

function validateDate(v: string) {
  if (!v) return "La fecha de nacimiento es obligatoria";
  const date = new Date(v);
  const today = new Date();
  if (isNaN(date.getTime())) return "Fecha inválida";
  if (date > today) return "La fecha no puede ser futura";
  const age = today.getFullYear() - date.getFullYear() -
    (today < new Date(today.getFullYear(), date.getMonth(), date.getDate()) ? 1 : 0);
  if (age < 13) return "Debes tener al menos 13 años para registrarte";
  if (age > 120) return "Fecha de nacimiento inválida";
  return "";
}

function ChatWidget() {
  const { user, chats, sendMessageToAdmin } = useShop();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const activeChat = chats.find(c => c.clientId === user?.id && c.status === 'active');
  const messages = activeChat ? activeChat.messages : [{ sender: 'admin' as const, text: '¡Hola! ¿En qué te podemos ayudar?' }];

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    
    sendMessageToAdmin(input.trim());
    setInput("");
  };

  if (!user || user.role !== "cliente") return null;

  return (
    <>
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[600] w-14 h-14 bg-[#4A3728] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform animate-in zoom-in">
          <MessageCircle className="w-6 h-6" style={{ color: "#D4A373" }} />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[600] w-80 bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in slide-in-from-bottom-2" style={{ borderColor: "rgba(0,0,0,0.1)", height: "420px" }}>
          <div className="p-4 flex items-center justify-between" style={{ background: "#4A3728" }}>
            <h3 className="font-bold flex items-center gap-2 text-[#FEFAE0]">
              <MessageCircle className="w-5 h-5" style={{ color: "#D4A373" }} /> Asistencia en línea
            </h3>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-80 text-white"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col" style={{ background: "#FEFAE0" }}>
            {messages.map((m, idx) => (
              <div key={idx} className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.sender === 'bot' || m.sender === 'admin' ? 'bg-white border rounded-tl-sm self-start text-gray-800 shadow-sm' : 'rounded-tr-sm self-end shadow-sm'}`} style={m.sender === 'user' ? { background: "#D4A373", color: "#4A3728" } : undefined}>
                <p>{m.text}</p>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-white border-t flex gap-2">
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 px-3 py-2 bg-gray-50 border rounded-xl outline-none text-sm"
              style={{ borderColor: "rgba(0,0,0,0.1)" }}
            />
            <button type="submit" className="w-10 h-10 rounded-xl flex flex-shrink-0 items-center justify-center hover:opacity-90 transition-opacity" style={{ background: "#606C38", color: "#fff" }}>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

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
  const { user, cart, reservations, chats, openCart, logout, updateProfile, showToast } = useShop();
  const navigate = useNavigate();
  const role = user?.role ?? "visitante";

  const [tab, setTab] = useState<ShopTab>("catalog");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [subscribeModal, setSubscribeModal] = useState(false);
  const [adminBellOpen, setAdminBellOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  // ── ESTADO PARA COMPLETAR EL PERFIL DE ADMINISTRADOR (NUEVO) ──
  const [completeProfileData, setCompleteProfileData] = useState({
    nombres: "", apellidos: "", dni: "", fechaNacimiento: "",
    lugarNacimiento: "", direccion: "", genero: ""
  });

  useEffect(() => {
    const inter = setInterval(() => setNow(Date.now()), 10000); // 10s refresh for wait times
    return () => clearInterval(inter);
  }, []);

  const cartCount          = cart.reduce((s, i) => s + i.qty, 0);
  const activeReservations = reservations.filter(r => r.status === "active").length;
  const activeSupportChats = chats.filter(c => c.status === "active").sort((a,b) => a.startedAt - b.startedAt);

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
    setLogoutModal(false);
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
    if (role === "cliente") return null;
    return null;
  };

  function handleSubscribe() {
    updateProfile({ suscritoNoticias: true });
    setSubscribeModal(false);
    showToast("¡Te has suscrito a las novedades exitosamente!", "success");
  }

  function handleCompleteProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errorDate = validateDate(completeProfileData.fechaNacimiento);
    if (errorDate) {
      showToast(errorDate, "error");
      return;
    }
    updateProfile({
      ...completeProfileData,
      name: `${completeProfileData.nombres} ${completeProfileData.apellidos}`.trim(),
      isProfileComplete: true
    });
    showToast("Perfil de administrador configurado exitosamente", "success");
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FEFAE0" }}>

      {/* Mandatory Admin Profile Completion Modal */}
      {role === "admin" && user?.isProfileComplete === false && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border p-8" style={{ borderColor: "#E8C99A" }}>
            <h2 className="text-2xl font-bold mb-2 text-center" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
              Bienvenido, Administrador
            </h2>
            <p className="text-sm text-center mb-6" style={{ color: "#6B5344" }}>
              Antes de acceder al sistema, debes completar tu información personal obligatoria.
            </p>
            <form onSubmit={handleCompleteProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-gray-600">DNI *</label>
                  <input value={completeProfileData.dni} onChange={e => setCompleteProfileData({...completeProfileData, dni: e.target.value})} required autoFocus
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#D4A373] outline-none text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Nombres *</label>
                  <input value={completeProfileData.nombres} onChange={e => setCompleteProfileData({...completeProfileData, nombres: e.target.value})} required
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#D4A373] outline-none text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Apellidos *</label>
                  <input value={completeProfileData.apellidos} onChange={e => setCompleteProfileData({...completeProfileData, apellidos: e.target.value})} required
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#D4A373] outline-none text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Fecha de Nacimiento *</label>
                  <input type="date" value={completeProfileData.fechaNacimiento} max={new Date().toISOString().split("T")[0]} onChange={e => setCompleteProfileData({...completeProfileData, fechaNacimiento: e.target.value})} required
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#D4A373] outline-none text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Lugar Nacimiento *</label>
                  <input value={completeProfileData.lugarNacimiento} onChange={e => setCompleteProfileData({...completeProfileData, lugarNacimiento: e.target.value})} required
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#D4A373] outline-none text-sm" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-gray-600">Dirección *</label>
                  <input value={completeProfileData.direccion} onChange={e => setCompleteProfileData({...completeProfileData, direccion: e.target.value})} required
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#D4A373] outline-none text-sm" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-gray-600">Género *</label>
                  <select value={completeProfileData.genero} onChange={e => setCompleteProfileData({...completeProfileData, genero: e.target.value})} required
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#D4A373] outline-none text-sm bg-white">
                    <option value="">Seleccionar...</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                    <option value="prefiero-no-decir">Prefiero no decir</option>
                  </select>
                </div>
              </div>
              <div className="pt-2">
                <button type="button" onClick={() => logout()} className="w-full text-xs text-gray-400 hover:text-gray-600 mb-3 underline">
                  Cerrar sesión y completar más tarde
                </button>
                <button type="submit" className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-opacity"
                  style={{ background: "#4A3728", color: "#FEFAE0" }}>
                  <Save className="w-4 h-4"/> Guardar Perfil y Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
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

            {/* Admin Notification Bell */}
            {(role === "admin" || role === "root") && (
              <div className="relative">
                <button onClick={() => setAdminBellOpen(!adminBellOpen)}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-colors"
                  style={{ background: "#F5EDD3" }} title="Notificaciones de clientes">
                  <Bell className="w-5 h-5" style={{ color: "#4A3728" }} />
                  {activeSupportChats.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1 animate-pulse"
                      style={{ background: "#C0392B", color: "#FEFAE0" }}>
                      {activeSupportChats.length}
                    </span>
                  )}
                </button>

                {adminBellOpen && (
                  <div className="absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-2xl border overflow-hidden z-[500] animate-in slide-in-from-top-2" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                    <div className="p-4 border-b flex items-center justify-between" style={{ background: "#4A3728", borderColor: "rgba(255,255,255,0.1)" }}>
                      <h3 className="font-bold text-[#FEFAE0] flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-[#D4A373]" /> Mensajes Pendientes
                      </h3>
                      <button onClick={() => setAdminBellOpen(false)} className="text-white hover:opacity-80"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {activeSupportChats.length === 0 ? (
                        <p className="text-sm p-6 text-center text-gray-400">No hay chats pendientes.</p>
                      ) : (
                        <ul className="divide-y divide-gray-100">
                          {activeSupportChats.map(chat => {
                            const waitMins = Math.floor((now - chat.startedAt) / 60000);
                            return (
                              <li key={chat.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-bold text-sm" style={{ color: "#4A3728" }}>{chat.clientName}</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${waitMins > 5 ? 'bg-red-100 text-red-600' : 'bg-[#F5EDD3] text-[#4A3728]'}`}>
                                    {waitMins} min espera
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-1 italic mb-2">"{chat.messages[chat.messages.length - 1]?.text}"</p>
                                <button className="text-[10px] font-semibold flex items-center gap-1 text-[#606C38] opacity-0 group-hover:opacity-100 transition-opacity">
                                  Ver chat →
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Login / Profile */}
            {!user && (
              <Link to="/login" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity whitespace-nowrap" style={{ background: "#D4A373", color: "#4A3728" }}>
                <User className="w-4 h-4" />
                Iniciar sesión
              </Link>
            )}
            {user && role !== "visitante" && (
              <Link to="/profile" className="px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity whitespace-nowrap" style={{ background: "#D4A373", color: "#4A3728" }}>
                Mi perfil
              </Link>
            )}

            {/* Logout */}
            {user && (
              <button onClick={() => setLogoutModal(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
                style={{ background: "#F5EDD3" }} title="Cerrar sesión">
                <LogOut className="w-4 h-4" style={{ color: "#4A3728" }} />
              </button>
            )}
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
      
      {/* ── BOTÓN FLOTANTE SUSCRIBIRSE ── */}
      {user && role === "cliente" && !user.suscritoNoticias && (
        <button
          onClick={() => setSubscribeModal(true)}
          className="fixed bottom-6 left-6 z-[400] flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl transition-all hover:scale-105 hover:bg-opacity-90 animate-pulse"
          style={{ background: "#4A3728", color: "#FEFAE0" }}>
          <Bell className="w-5 h-5" style={{ color: "#D4A373" }} />
          <span className="font-bold text-sm tracking-wide">Suscribirse</span>
        </button>
      )}

      {/* ── MODAL DE SUSCRIPCIÓN ── */}
      {subscribeModal && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl p-8 text-center bg-white shadow-2xl relative">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-5" style={{ background: "#F5EDD3" }}>
              <Mail className="w-8 h-8" style={{ color: "#D4A373" }} />
            </div>
            <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
              ¿Deseas suscribirte?
            </h3>
            <p className="text-sm mb-7 leading-relaxed" style={{ color: "#6B5344" }}>
              Confirma si deseas recibir información a tu correo electrónico y habilitar en la pestaña principal nuestra selección de <strong>libros nuevos</strong> (Recién Añadidos).
            </p>
            <div className="flex gap-3">
              <button onClick={() => setSubscribeModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border transition-all hover:bg-gray-50"
                style={{ borderColor: "#D4A373", color: "#4A3728" }}>
                Más tarde
              </button>
              <button onClick={handleSubscribe}
                className="flex-1 py-3 rounded-xl text-sm font-bold shadow-md transition-all hover:opacity-90"
                style={{ background: "#606C38", color: "#fff" }}>
                ¡Sí, aceptar!
              </button>
            </div>
            <button onClick={() => setSubscribeModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ── BOTÓN DE CHAT (Prototipo) ── */}
      <ChatWidget />
    </div>
  );
}
