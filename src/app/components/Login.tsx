import { useState } from "react";
import { BookOpen, Lock, Mail } from "lucide-react";
import { Link } from "react-router";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt with:", { email, password });
    // Add your login logic here
    // Simulando login exitoso
    window.location.href = "/home";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#FEFAE0' }}>
      <div className="w-full max-w-md">
        <div className="rounded-2xl shadow-2xl p-8 relative overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
          {/* Header decorativo con libros */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: '#4A3728' }}>
              <BookOpen className="w-10 h-10" style={{ color: '#D4A373' }} />
            </div>
            <h1 className="mb-2" style={{ color: '#4A3728' }}>Biblioteca Digital</h1>
            <p className="text-sm" style={{ color: '#4A3728', opacity: 0.7 }}>
              Ingresa a tu cuenta para explorar nuestra colección
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="block" style={{ color: '#4A3728' }}>
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4A373' }} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none focus:border-opacity-100 transition-all"
                  style={{ 
                    backgroundColor: '#FEFAE0',
                    borderColor: '#D4A373',
                    color: '#4A3728'
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="block" style={{ color: '#4A3728' }}>
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4A373' }} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none focus:border-opacity-100 transition-all"
                  style={{ 
                    backgroundColor: '#FEFAE0',
                    borderColor: '#D4A373',
                    color: '#4A3728'
                  }}
                />
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded cursor-pointer"
                  style={{ accentColor: '#606C38' }}
                />
                <span style={{ color: '#4A3728' }}>Recordarme</span>
              </label>
              <Link to="/forgot-password" className="hover:underline" style={{ color: '#606C38' }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-lg font-medium transition-all hover:opacity-90 hover:shadow-lg"
              style={{ 
                backgroundColor: '#4A3728',
                color: '#FEFAE0'
              }}
            >
              Iniciar Sesión
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: '#D4A373' }}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4" style={{ backgroundColor: '#FFFFFF', color: '#4A3728' }}>o</span>
              </div>
            </div>

            {/* Register Button */}
            <Link to="/register">
              <button
                type="button"
                className="w-full py-3 rounded-lg font-medium border-2 transition-all hover:shadow-md"
                style={{ 
                  borderColor: '#606C38',
                  color: '#606C38',
                  backgroundColor: 'transparent'
                }}
              >
                Registrarse como Nuevo Usuario
              </button>
            </Link>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm" style={{ color: '#4A3728', opacity: 0.6 }}>
            <p>Al ingresar, aceptas nuestros términos y condiciones</p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="mt-4 text-center text-sm" style={{ color: '#4A3728', opacity: 0.7 }}>
          <p>📚 Acceso a más de 10,000 títulos disponibles</p>
        </div>
      </div>
    </div>
  );
}