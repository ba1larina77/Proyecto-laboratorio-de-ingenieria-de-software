import { useNavigate } from "react-router";
import { useShop } from "../../store/ShopContext";
import type { Review } from "../../store/shopTypes";
import { AdminPanel } from "../admin/AdminPanel";
import { StoreInventoryPanel } from "../admin/StoreInventoryPanel";
import { NewsFeed } from "../news/NewsFeed";
import { AdminDirectMessages } from "../admin/AdminDirectMessages";
import { Toast } from "../shop/Toast";
import { AddressAutocomplete } from "../ui/AddressAutocomplete";
import { BookOpen, LogOut, Settings, Store, Newspaper, Library, Bell, Save, Star, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";

type AdminTab = "books" | "stores" | "news" | "reviews" | "messages";

export function AdminCatalog() {
  const { user, logout, updateProfile, showToast, news, reviews, pendingAdminCount, moderateReview } = useShop();
  const navigate = useNavigate();
  const [logoutModal, setLogoutModal] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("books");
  const [dmPanelOpen, setDmPanelOpen] = useState(false);
  const pendingNewsCount = news.filter(n => n.status === "pending").length;
  const pendingReviewsCount = reviews.filter(r => r.status === "pending").length;

  // Guarda: solo admin o root pueden acceder
  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "root")) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  const [completeProfileData, setCompleteProfileData] = useState({
    nombres: "", apellidos: "", dni: "", fechaNacimiento: "",
    lugarNacimiento: "", direccion: "", genero: ""
  });

  function handleCompleteProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateProfile({
      ...completeProfileData,
      name: `${completeProfileData.nombres} ${completeProfileData.apellidos}`.trim(),
      isProfileComplete: true
    });
    showToast("Perfil de administrador configurado exitosamente", "success");
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FEFAE0" }}>

      {/* Mandatory Admin Profile Completion Modal */}
      {user?.role === "admin" && user?.isProfileComplete === false && (
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
                  <label className="text-xs font-semibold text-gray-600">DNI * (mínimo 10 dígitos)</label>
                  <input value={completeProfileData.dni} onChange={e => setCompleteProfileData({...completeProfileData, dni: e.target.value.replace(/\D/g, "")})} required autoFocus inputMode="numeric" maxLength={12}
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
                  <label className="text-xs font-semibold text-gray-600">Fecha de Nac. *</label>
                  <input type="date" value={completeProfileData.fechaNacimiento} onChange={e => setCompleteProfileData({...completeProfileData, fechaNacimiento: e.target.value})} required
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#D4A373] outline-none text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Lugar Nacimiento *</label>
                  <AddressAutocomplete
                    value={completeProfileData.lugarNacimiento}
                    onChange={v => setCompleteProfileData({...completeProfileData, lugarNacimiento: v})}
                    placeholder="Ciudad, País"
                    required
                    className="w-full pl-10 px-3 py-2 rounded-xl border border-gray-200 focus:border-[#D4A373] outline-none text-sm"
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-gray-600">Dirección *</label>
                  <AddressAutocomplete
                    value={completeProfileData.direccion}
                    onChange={v => setCompleteProfileData({...completeProfileData, direccion: v})}
                    placeholder="Calle 123 #45-67"
                    required
                    className="w-full pl-10 px-3 py-2 rounded-xl border border-gray-200 focus:border-[#D4A373] outline-none text-sm"
                  />
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
                <button type="button" onClick={handleLogout} className="w-full text-xs text-gray-400 hover:text-gray-600 mb-3 underline">
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

      {/* Logout modal */}
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
              Serás redirigido a la pantalla de inicio de sesión.
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
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#4A3728" }}>
              <BookOpen className="w-5 h-5" style={{ color: "#D4A373" }} />
            </div>
            <span className="font-medium hidden sm:block" style={{ color: "#4A3728" }}>Biblioteca Digital</span>
          </div>

          {/* Role badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{ background: "#606C38", color: "#fff" }}>
            <Settings className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">ADMINISTRADOR</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Campana de mensajes directos */}
            <button
              onClick={() => setDmPanelOpen(true)}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: "#F5EDD3", color: "#4A3728" }}
              title="Mensajes de usuarios"
            >
              <Bell className="w-5 h-5" />
              {pendingAdminCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white animate-pulse"
                  style={{ background: "#C0392B", color: "#fff" }}>
                  {pendingAdminCount}
                </span>
              )}
            </button>
            <span className="text-sm hidden sm:block" style={{ color: "#4A3728" }}>{user?.name}</span>
            <button onClick={() => setLogoutModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
              style={{ background: "#F5EDD3", color: "#4A3728" }}>
              <LogOut className="w-3.5 h-3.5" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* M1-HU7 + M1-HU5: Tabs Admin */}
        <div className="flex gap-2 mb-6 border-b flex-wrap" style={{ borderColor: "#E8C99A" }}>
          <button
            onClick={() => setActiveTab("books")}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all relative"
            style={{
              color: activeTab === "books" ? "#4A3728" : "#6B5344",
              borderBottom: `3px solid ${activeTab === "books" ? "#606C38" : "transparent"}`,
              marginBottom: -1,
            }}
          >
            <Library className="w-4 h-4" />
            Libros
          </button>
          <button
            onClick={() => setActiveTab("stores")}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all relative"
            style={{
              color: activeTab === "stores" ? "#4A3728" : "#6B5344",
              borderBottom: `3px solid ${activeTab === "stores" ? "#606C38" : "transparent"}`,
              marginBottom: -1,
            }}
          >
            <Store className="w-4 h-4" />
            Inventario por Tienda
          </button>
          <button
            onClick={() => setActiveTab("news")}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all relative"
            style={{
              color: activeTab === "news" ? "#4A3728" : "#6B5344",
              borderBottom: `3px solid ${activeTab === "news" ? "#606C38" : "transparent"}`,
              marginBottom: -1,
            }}
          >
            <Newspaper className="w-4 h-4" />
            Noticias
            {pendingNewsCount > 0 && (
              <span
                className="text-[10px] px-1.5 rounded-full font-bold"
                style={{ background: "#C0392B", color: "#FEFAE0" }}
              >
                {pendingNewsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all relative"
            style={{
              color: activeTab === "reviews" ? "#4A3728" : "#6B5344",
              borderBottom: `3px solid ${activeTab === "reviews" ? "#606C38" : "transparent"}`,
              marginBottom: -1,
            }}
          >
            <Star className="w-4 h-4" />
            Reseñas
            {pendingReviewsCount > 0 && (
              <span className="text-[10px] px-1.5 rounded-full font-bold"
                style={{ background: "#C0392B", color: "#FEFAE0" }}>
                {pendingReviewsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all relative"
            style={{
              color: activeTab === "messages" ? "#4A3728" : "#6B5344",
              borderBottom: `3px solid ${activeTab === "messages" ? "#606C38" : "transparent"}`,
              marginBottom: -1,
            }}
          >
            <MessageSquare className="w-4 h-4" />
            Mensajes
            {pendingAdminCount > 0 && (
              <span className="text-[10px] px-1.5 rounded-full font-bold"
                style={{ background: "#C0392B", color: "#FEFAE0" }}>
                {pendingAdminCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === "books"    && <AdminPanel />}
        {activeTab === "stores"   && <StoreInventoryPanel />}
        {activeTab === "news"     && <NewsFeed />}
        {activeTab === "reviews"  && <ReviewModerationPanel reviews={reviews} onModerate={moderateReview} />}
        {activeTab === "messages" && <AdminDirectMessages onClose={() => setActiveTab("books")} />}
      </main>

      <Toast />
      {dmPanelOpen && <AdminDirectMessages onClose={() => setDmPanelOpen(false)} />}
    </div>
  );
}

// ── Panel de moderación de reseñas ───────────────────────────
function ReviewModerationPanel({
  reviews,
  onModerate,
}: {
  reviews: Review[];
  onModerate: (id: string, action: 'approved' | 'rejected') => void;
}) {
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const filtered = reviews.filter(r => filter === 'all' || r.status === filter);

  const STATUS_LABELS: Record<string, string> = {
    pending:  '⏳ Pendiente',
    approved: '✅ Aprobada',
    rejected: '❌ Rechazada',
  };
  const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    pending:  { bg: 'rgba(212,163,115,0.15)', color: '#D4A373' },
    approved: { bg: 'rgba(96,108,56,0.12)',   color: '#606C38' },
    rejected: { bg: 'rgba(192,57,43,0.12)',   color: '#C0392B' },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{ color: '#4A3728' }}>Moderación de Reseñas</h2>
        <div className="flex gap-2">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: filter === f ? '#4A3728' : '#F5EDD3',
                color:      filter === f ? '#FEFAE0'  : '#4A3728',
              }}>
              {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : f === 'approved' ? 'Aprobadas' : 'Rechazadas'}
              {f === 'pending' && reviews.filter(r => r.status === 'pending').length > 0 && (
                <span className="ml-1 px-1 rounded-full text-[10px] font-bold"
                  style={{ background: '#C0392B', color: '#fff' }}>
                  {reviews.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-sm" style={{ color: '#6B5344' }}>
          No hay reseñas {filter !== 'all' ? `con estado "${filter}"` : ''}.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(review => (
            <div key={review.id}
              className="rounded-2xl border p-5 bg-white"
              style={{ borderColor: '#E8C99A' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm" style={{ color: '#4A3728' }}>{review.userName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={STATUS_COLORS[review.status]}>
                      {STATUS_LABELS[review.status]}
                    </span>
                    <span className="text-xs" style={{ color: '#D4A373' }}>
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </span>
                  </div>
                  <p className="text-xs mb-1" style={{ color: '#D4A373' }}>
                    Libro ID: {review.bookId} · {new Date(review.createdAt).toLocaleDateString('es-CO')}
                  </p>
                  <p className="text-sm" style={{ color: '#6B5344' }}>{review.comment}</p>
                </div>
                {review.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => onModerate(review.id, 'approved')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                      style={{ background: '#606C38', color: '#fff' }}>
                      Aprobar
                    </button>
                    <button onClick={() => onModerate(review.id, 'rejected')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                      style={{ background: '#C0392B', color: '#fff' }}>
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
