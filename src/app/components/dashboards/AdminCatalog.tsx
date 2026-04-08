import { useNavigate } from "react-router";
import { useShop } from "../../store/ShopContext";
import { AdminPanel } from "../admin/AdminPanel";
import { Toast } from "../shop/Toast";
import { BookOpen, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import { Save } from "lucide-react";

export function AdminCatalog() {
  const { user, logout, updateProfile, showToast } = useShop();
  const navigate = useNavigate();
  const [logoutModal, setLogoutModal] = useState(false);

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
    navigate("/");
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
                  <label className="text-xs font-semibold text-gray-600">Fecha de Nac. *</label>
                  <input type="date" value={completeProfileData.fechaNacimiento} onChange={e => setCompleteProfileData({...completeProfileData, fechaNacimiento: e.target.value})} required
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
        <AdminPanel />
      </main>

      <Toast />
    </div>
  );
}
