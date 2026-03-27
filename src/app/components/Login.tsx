import { useState } from "react";
import { BookOpen, Lock, Mail, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useShop } from "../store/ShopContext";
import type { UserRole } from "../store/ShopContext";

/** Ruta de destino según el rol — fuente única de verdad */
export function routeForRole(role: UserRole): string {
  switch (role) {
    case "root":    return "/root-dashboard";
    case "admin":   return "/admin-catalog";
    case "cliente": return "/home";
    default:        return "/home";
  }
}

export function Login() {
  const navigate = useNavigate();
  const { login } = useShop();

  const [identifier, setIdentifier] = useState(""); // email o usuario
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!identifier.trim() || !password) {
      setError("Completa todos los campos.");
      return;
    }
    setLoading(true);
    // Simulamos latencia de red
    setTimeout(() => {
      const result = login(identifier.trim(), password);
      setLoading(false);
      if (!result.success) {
        setError(result.error || "Credenciales incorrectas.");
        return;
      }
      // Redirección inteligente según el rol
      navigate(routeForRole(result.role!));
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#FEFAE0" }}>
      <div className="w-full max-w-md">
        <div className="rounded-2xl shadow-2xl p-8 relative overflow-hidden" style={{ backgroundColor: "#FFFFFF" }}>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: "#4A3728" }}>
              <BookOpen className="w-10 h-10" style={{ color: "#D4A373" }} />
            </div>
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
              Biblioteca Digital
            </h1>
            <p className="text-sm" style={{ color: "#4A3728", opacity: 0.7 }}>
              Ingresa a tu cuenta para explorar nuestra colección
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-5"
              style={{ background: "rgba(192,57,43,0.08)", border: "1.5px solid #C0392B" }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#C0392B" }} />
              <p className="text-sm" style={{ color: "#C0392B" }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Correo o usuario */}
            <div className="space-y-1.5">
              <label htmlFor="identifier" className="block text-sm font-medium" style={{ color: "#4A3728" }}>
                Correo electrónico o usuario
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#D4A373" }} />
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={e => { setIdentifier(e.target.value); setError(""); }}
                  placeholder="tu@correo.com o tu_usuario"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-lg border-2 focus:outline-none transition-all text-sm"
                  style={{ backgroundColor: "#FEFAE0", borderColor: error ? "#C0392B" : "#D4A373", color: "#4A3728" }}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium" style={{ color: "#4A3728" }}>
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#D4A373" }} />
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-11 py-3 rounded-lg border-2 focus:outline-none transition-all text-sm"
                  style={{ backgroundColor: "#FEFAE0", borderColor: error ? "#C0392B" : "#D4A373", color: "#4A3728" }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#D4A373" }}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer" style={{ accentColor: "#606C38" }} />
                <span style={{ color: "#4A3728" }}>Recordarme</span>
              </label>
              <Link to="/forgot-password" className="hover:underline text-sm" style={{ color: "#606C38" }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Login button */}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg font-medium transition-all hover:opacity-90 hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: "#4A3728", color: "#FEFAE0" }}>
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Ingresando…</>
                : "Iniciar Sesión"}
            </button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: "#D4A373" }} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 text-sm" style={{ backgroundColor: "#FFFFFF", color: "#4A3728" }}>o</span>
              </div>
            </div>

            <Link to="/register">
              <button type="button"
                className="w-full py-3 rounded-lg font-medium border-2 transition-all hover:shadow-md"
                style={{ borderColor: "#606C38", color: "#606C38", backgroundColor: "transparent" }}>
                Registrarse como Nuevo Usuario
              </button>
            </Link>
          </form>


          <div className="mt-4 text-center text-xs" style={{ color: "#4A3728", opacity: 0.5 }}>
            Al ingresar, aceptas nuestros términos y condiciones
          </div>
        </div>

        <div className="mt-4 text-center text-sm" style={{ color: "#4A3728", opacity: 0.7 }}>
          📚 Acceso a más de 10,000 títulos disponibles
        </div>
      </div>
    </div>
  );
}
