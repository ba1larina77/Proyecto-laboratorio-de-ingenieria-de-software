import { useState } from "react";
import { BookOpen, Lock, Mail, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useShop } from "../store/ShopContext";
import type { UserRole } from "../store/ShopContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

/** Ruta de destino según el rol — fuente única de verdad */
export function routeForRole(role: UserRole): string {
  switch (role) {
    case "root":    return "/root-dashboard";
    case "admin":   return "/admin-catalog";
    case "cliente": return "/";
    default:        return "/";
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
    setTimeout(() => {
      const result = login(identifier.trim(), password);
      setLoading(false);
      if (!result.success) {
        setError(result.error || "Credenciales incorrectas.");
        return;
      }
      navigate(routeForRole(result.role!));
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#FEFAE0" }}>
      <div className="w-full max-w-md">
        <div className="rounded-3xl shadow-2xl p-8 bg-white border border-[#E8C99A]/20">

          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 transition-transform hover:scale-105" style={{ backgroundColor: "#4A3728" }}>
              <BookOpen className="w-10 h-10 text-[#D4A373]" />
            </Link>
            <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
              Bienvenido a Biblion
            </h1>
            <p className="text-sm text-[#6B5344]/70">
              Ingresa a tu cuenta para continuar
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-6 animate-in fade-in zoom-in"
              style={{ background: "rgba(192,57,43,0.08)", border: "1.5px solid #C0392B" }}>
              <AlertCircle className="w-4 h-4 text-[#C0392B]" />
              <p className="text-xs text-[#C0392B] font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <Label className="text-[#4A3728] font-semibold text-xs ml-1">Correo electrónico o usuario</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4A373] group-focus-within:text-[#4A3728] transition-colors" />
                <Input
                  type="text"
                  value={identifier}
                  onChange={e => { setIdentifier(e.target.value); setError(""); }}
                  placeholder="ejemplo@correo.com"
                  className={`pl-10 h-11 rounded-xl bg-[#FEFAE0]/30 border-[#E8C99A] focus:border-[#4A3728] transition-all ${error ? "border-red-500" : ""}`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#4A3728] font-semibold text-xs ml-1">Contraseña</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4A373] group-focus-within:text-[#4A3728] transition-colors" />
                <Input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  className={`pl-10 pr-10 h-11 rounded-xl bg-[#FEFAE0]/30 border-[#E8C99A] focus:border-[#4A3728] transition-all ${error ? "border-red-500" : ""}`}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D4A373] hover:text-[#4A3728] transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold">
              <label className="flex items-center gap-2 cursor-pointer text-[#4A3728]/70 hover:text-[#4A3728] transition-colors">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded-lg cursor-pointer border-[#D4A373] text-[#606C38] focus:ring-0" />
                <span>Recordarme</span>
              </label>
              <Link to="/forgot-password" style={{ color: "#606C38" }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 bg-[#4A3728] hover:bg-[#32251a] text-[#FEFAE0] rounded-2xl shadow-lg shadow-[#4A3728]/20 transition-all active:scale-[0.98]">
              {loading ? "Ingresando..." : "Iniciar Sesión"}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E8C99A]/40" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                <span className="px-3 bg-white text-[#D4A373]">o también</span>
              </div>
            </div>

            <div className="grid gap-3">
              <Link to="/register">
                <Button variant="outline" type="button" className="w-full h-11 rounded-xl border-[#606C38] text-[#606C38] hover:bg-[#606C38]/5">
                  Crear una nueva cuenta
                </Button>
              </Link>
              <Link to="/" className="text-center">
                <span className="text-xs font-semibold text-[#6B5344]/70 hover:text-[#4A3728] transition-colors cursor-pointer">
                  Entrar como Visitante
                </span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
