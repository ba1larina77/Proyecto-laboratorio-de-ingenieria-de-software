import { useState } from 'react';
import { CreditCard, Star, Trash2 } from 'lucide-react';
import { cardService, type TarjetaGuardada } from '../../../services/cardService';

interface SavedCardsListProps {
  tarjetas: TarjetaGuardada[];
  cargando: boolean;
  onRefresh: () => void;
}

const C = {
  bg: '#FEFAE0',
  white: '#FFFFFF',
  brown: '#4A3728',
  green: '#606C38',
  sand: '#D4A373',
} as const;

const MARCA_DISPLAY: Record<string, { nombre: string; color: string; icono: string }> = {
  visa: { nombre: 'Visa', color: '#4A3728', icono: 'V' },
  mastercard: { nombre: 'Mastercard', color: '#D4A373', icono: 'MC' },
  amex: { nombre: 'Amex', color: '#606C38', icono: 'AX' },
  diners: { nombre: 'Diners', color: '#4A3728', icono: 'DC' },
  discover: { nombre: 'Discover', color: '#D4A373', icono: 'DS' },
  jcb: { nombre: 'JCB', color: '#606C38', icono: 'JCB' },
  unknown: { nombre: 'Tarjeta', color: '#4A3728', icono: '?' },
};

export function SavedCardsList({ tarjetas, cargando, onRefresh }: SavedCardsListProps) {
  const [procesando, setProcesando] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSetDefault = async (id: string) => {
    setProcesando(id);
    setError('');
    try {
      await cardService.establecerPredeterminada(id);
      onRefresh();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || 'Error al establecer predeterminada');
    } finally {
      setProcesando(null);
    }
  };

  const handleDelete = async (id: string) => {
    setProcesando(id);
    setError('');
    try {
      await cardService.eliminar(id);
      setConfirmDelete(null);
      onRefresh();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || 'Error al eliminar tarjeta');
    } finally {
      setProcesando(null);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-8">
        <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24" style={{ color: C.green }}>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (tarjetas.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 gap-2">
        <CreditCard className="w-10 h-10 opacity-20" style={{ color: C.brown }} />
        <p className="text-sm" style={{ color: C.brown, opacity: 0.5 }}>
          No tienes tarjetas guardadas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="px-3 py-2 rounded-xl text-xs" style={{ backgroundColor: C.bg, color: C.brown, border: `1px solid ${C.sand}` }}>
          {error}
        </div>
      )}

      {tarjetas.map((t) => {
        const info = MARCA_DISPLAY[t.marca] || MARCA_DISPLAY.unknown;

        return (
          <div key={t.id}>
            <div
              className="flex items-center gap-3 p-3 rounded-xl border-2 transition-all"
              style={{
                borderColor: t.es_predeterminada ? C.green : C.sand,
                backgroundColor: t.es_predeterminada ? `${C.green}14` : C.white,
              }}
            >
              {/* Icono marca */}
              <div
                className="w-10 h-7 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                style={{ backgroundColor: info.color, color: '#fff' }}
              >
                {info.icono}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium" style={{ color: C.brown }}>
                    {info.nombre} •••• {t.ultimos4}
                  </p>
                  {t.es_predeterminada && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: `${C.green}20`, color: C.green }}
                    >
                      Principal
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: C.brown, opacity: 0.5 }}>
                  {t.nombre_titular} · Exp {String(t.mes_expiracion).padStart(2, '0')}/{t.anio_expiracion}
                </p>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {!t.es_predeterminada && (
                  <button
                    onClick={() => handleSetDefault(t.id)}
                    disabled={procesando === t.id}
                    className="p-1.5 rounded-lg transition-all hover:opacity-70 disabled:opacity-30"
                    style={{ color: C.sand }}
                    title="Establecer como principal"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setConfirmDelete(t.id)}
                  disabled={procesando === t.id}
                  className="p-1.5 rounded-lg transition-all hover:opacity-70 disabled:opacity-30"
                  style={{ color: C.brown }}
                  title="Eliminar tarjeta"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Confirmación de eliminación */}
            {confirmDelete === t.id && (
              <div
                className="mt-1 p-3 rounded-xl border text-xs space-y-2"
                style={{ borderColor: C.sand, backgroundColor: C.bg }}
              >
                <p style={{ color: C.brown }}>
                  ¿Eliminar la tarjeta {info.nombre} •••• {t.ultimos4}?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={procesando === t.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                    style={{ backgroundColor: C.brown, color: C.white }}
                  >
                    {procesando === t.id ? 'Eliminando...' : 'Sí, eliminar'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ color: C.brown, border: `1px solid ${C.sand}` }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
