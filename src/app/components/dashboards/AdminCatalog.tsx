import { useNavigate } from "react-router";
import { useShop } from "../../store/ShopContext";
import { AdminPanel } from "../admin/AdminPanel";
import { Toast } from "../shop/Toast";
import { BookOpen, LogOut, Settings } from "lucide-react";
import { useState } from "react";

export function AdminCatalog() {
  const { user, logout } = useShop();
  const navigate = useNavigate();
  const [logoutModal, setLogoutModal] = useState(false);

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FEFAE0" }}>

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
