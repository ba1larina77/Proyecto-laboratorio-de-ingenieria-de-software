import { useRouteError, Link } from "react-router";
import { BookOpen, Home } from "lucide-react";

export function ErrorBoundary() {
  const error = useRouteError() as Error;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#FEFAE0' }}>
      <div className="w-full max-w-md">
        <div className="rounded-2xl shadow-2xl p-8 text-center" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: '#4A3728' }}>
            <BookOpen className="w-10 h-10" style={{ color: '#D4A373' }} />
          </div>
          <h1 className="mb-2" style={{ color: '#4A3728' }}>Oops!</h1>
          <p className="text-sm mb-6" style={{ color: '#4A3728', opacity: 0.7 }}>
            Ha ocurrido un error inesperado.
          </p>
          {error && (
            <p className="text-xs mb-6 p-3 rounded" style={{ backgroundColor: '#FEFAE0', color: '#4A3728' }}>
              {error.message || "Error desconocido"}
            </p>
          )}
          <Link to="/">
            <button
              className="w-full py-3 rounded-lg font-medium transition-all hover:opacity-90 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#606C38', color: '#FEFAE0' }}
            >
              <Home className="w-5 h-5" />
              Volver al Inicio
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
