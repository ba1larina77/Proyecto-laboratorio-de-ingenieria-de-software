import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { 
  BookOpen, LogOut, Wallet, Shield, Settings, 
  MessageCircle, Bell, User, X 
} from "lucide-react";
import { useShop, fmt } from "../store/ShopContext";

// – Componentes Extraídos –
import { Catalog }       from "./shop/Catalog";
import { Reservations }  from "./shop/Reservations";
import { History }       from "./shop/History";
import { CartSidebar }   from "./shop/CartSidebar";
import { CheckoutModal } from "./shop/CheckoutModal";
import { Toast }         from "./shop/Toast";
import { AdminPanel }    from "./admin/AdminPanel";
import { RootPanel }     from "./root/RootPanel";
import { Wallet as WalletPanel } from "./financial/Wallet";
import { ChatWidget }    from "./shop/ChatWidget";
import { LogoutModal, SubscribeModal, AdminCompleteProfileModal } from "./shop/ShopModals";

type ShopTab = "catalog" | "reservations" | "history" | "wallet" | "admin" | "root";

export function Shop() {
  const { user, cart, reservations, chats, openCart, logout, updateProfile, showToast } = useShop();
  const navigate = useNavigate();
  const role = user?.role ?? "visitante";

  const [tab, setTab] = useState<ShopTab>("catalog");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);
  const [adminBellOpen, setAdminBellOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  const [completeProfileData, setCompleteProfileData] = useState({
    nombres: "", apellidos: "", dni: "", fechaNacimiento: "",
    lugarNacimiento: "", direccion: "", genero: ""
  });

  useEffect(() => {
    const inter = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(inter);
  }, []);

  const cartCount          = cart.reduce((s, i) => s + i.qty, 0);
  const activeReservations = reservations.filter(r => r.status === "active").length;
  const activeSupportChats = chats.filter(c => c.status === "active").sort((a,b) => a.startedAt - b.startedAt);

  const TABS: { key: ShopTab; label: string; badge?: number; roles: string[] }[] = [
    { key: "catalog",      label: "Catálogo",        roles: ["cliente", "admin", "root", "visitante"] },
    { key: "reservations", label: "Reservas",         badge: activeReservations, roles: ["cliente"] },
    { key: "history",      label: "Historial",        roles: ["cliente"] },
    { key: "wallet",       label: "Mi Billetera",     roles: ["cliente"] },
    { key: "admin",        label: "Gestión Libros",   roles: ["admin", "root"] },
    { key: "root",         label: "Panel Root",       roles: ["root"] },
  ].filter(t => t.roles.includes(role)) as any;

  const handleLogout = () => { logout(); navigate("/"); };

  const handleSubscribe = () => {
    updateProfile({ suscritoNoticias: true });
    setSubscribeModalOpen(false);
    showToast("¡Te has suscrito exitosamente!", "success");
  };

  const handleCompleteProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      ...completeProfileData,
      name: `${completeProfileData.nombres} ${completeProfileData.apellidos}`.trim(),
      isProfileComplete: true
    });
    showToast("Perfil configurado correctamente", "success");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FEFAE0" }}>

      <AdminCompleteProfileModal 
        isOpen={role === "admin" && user?.isProfileComplete === false}
        data={completeProfileData}
        onChange={setCompleteProfileData}
        onSubmit={handleCompleteProfileSubmit}
        onLogout={handleLogout}
        showToast={showToast}
      />

      <LogoutModal 
        isOpen={logoutModalOpen} 
        onConfirm={handleLogout} 
        onCancel={() => setLogoutModalOpen(false)} 
      />

      <header className="sticky top-0 z-[200] bg-white border-b border-[#E8C99A]/40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          <Link to="/" onClick={() => setTab("catalog")} className="flex items-center gap-4 flex-shrink-0 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#4A3728] transition-all group-hover:scale-110 group-hover:rotate-3 shadow-lg">
              <BookOpen className="w-5 h-5 text-[#D4A373]" />
            </div>
            <span className="hidden sm:block font-serif font-bold text-xl text-[#4A3728] tracking-tight">Biblion</span>
          </Link>

          <nav className="flex gap-1 bg-[#F5EDD3]/50 p-1 rounded-2xl overflow-x-auto no-scrollbar">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  tab === t.key ? "bg-white text-[#4A3728] shadow-md" : "text-[#6B5344] hover:bg-white/40"
                }`}>
                {t.label}
                {t.badge ? (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-4.5 rounded-full text-[9px] bg-[#606C38] text-white flex items-center justify-center border-2 border-white">
                    {t.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {role === "cliente" && (
              <button onClick={() => setTab("wallet")} className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5EDD3] text-[#4A3728] text-sm font-bold border border-[#E8C99A]/20">
                <Wallet className="w-4 h-4 text-[#D4A373]" /> {fmt(user?.balance ?? 0)}
              </button>
            )}

            {role === "cliente" && (
              <button onClick={openCart} className="relative w-10 h-10 rounded-xl bg-[#F5EDD3] flex items-center justify-center hover:bg-[#E8C99A]/40 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A3728" strokeWidth="2.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                {cartCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#4A3728] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">{cartCount}</span>}
              </button>
            )}

            {(role === "admin" || role === "root") && (
               <div className="relative">
                  <button onClick={() => setAdminBellOpen(!adminBellOpen)} className="w-10 h-10 rounded-xl bg-[#F5EDD3] flex items-center justify-center relative">
                    <Bell className="w-5 h-5 text-[#4A3728]" />
                    {activeSupportChats.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 animate-pulse border-2 border-white" />}
                  </button>
                  {adminBellOpen && <AdminNotificationPanel chats={activeSupportChats} now={now} onClose={() => setAdminBellOpen(false)} />}
               </div>
            )}

            <div className="h-8 w-px bg-[#E8C99A]/40 mx-1 hidden sm:block" />

            {user ? (
               <div className="flex items-center gap-2">
                  <Link to="/profile" className="hidden sm:block text-xs font-bold text-[#4A3728] hover:underline underline-offset-4">Mi Perfil</Link>
                  <button onClick={() => setLogoutModalOpen(true)} className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 hover:bg-red-100 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
               </div>
            ) : (
               <Link to="/login" className="px-5 py-2 rounded-xl bg-[#4A3728] text-[#D4A373] text-sm font-bold shadow-lg shadow-[#4A3728]/20">Entrar</Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
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
          <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} onSuccess={() => setTab("history")} onGoToWallet={() => { setCheckoutOpen(false); setTab("wallet"); }} />
          {user && !user.suscritoNoticias && (
             <button onClick={() => setSubscribeModalOpen(true)} className="fixed bottom-6 left-6 z-[400] flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-[#4A3728] text-[#FEFAE0] shadow-2xl animate-bounce hover:animate-none group">
                <Bell className="w-5 h-5 text-[#D4A373]" /> <span className="font-bold text-sm">¿Deseas Novedades?</span>
             </button>
          )}
          <SubscribeModal isOpen={subscribeModalOpen} onConfirm={handleSubscribe} onCancel={() => setSubscribeModalOpen(false)} />
        </>
      )}

      <ChatWidget />
      <Toast />
    </div>
  );
}

function AdminNotificationPanel({ chats, now, onClose }: any) {
  return (
    <div className="absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-[#E8C99A]/40 overflow-hidden z-[500] animate-in slide-in-from-top-2">
      <div className="p-4 bg-[#4A3728] text-[#FEFAE0] flex items-center justify-between">
        <h3 className="font-bold text-sm tracking-wide">Chats de Soporte</h3>
        <button onClick={onClose}><X className="w-4 h-4" /></button>
      </div>
      <div className="max-h-64 overflow-y-auto split-scrollbar">
        {chats.length === 0 ? <p className="p-6 text-center text-xs text-gray-400">Todo al día ✨</p> : (
          <div className="divide-y divide-[#E8C99A]/20">
            {chats.map((c: any) => {
               const wait = Math.floor((now - c.startedAt) / 60000);
               return (
                 <div key={c.id} className="p-4 hover:bg-[#FEFAE0]/50 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-center mb-1">
                       <span className="font-bold text-sm text-[#4A3728]">{c.clientName}</span>
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${wait > 5 ? 'bg-red-100 text-red-600' : 'bg-[#F5EDD3] text-[#4A3728]'}`}>{wait} min</span>
                    </div>
                    <p className="text-[11px] text-[#6B5344] line-clamp-1 italic">"{c.messages[c.messages.length - 1]?.text}"</p>
                 </div>
               );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
