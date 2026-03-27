import { useState } from 'react';
import { CreditCard, Eye, EyeOff } from 'lucide-react';
import { cardService } from '../../../services/cardService';

interface AddCardFormProps {
  onCardAdded: () => void;
}

const C = {
  bg: '#FEFAE0',
  white: '#FFFFFF',
  brown: '#4A3728',
  green: '#606C38',
  sand: '#D4A373',
} as const;

function detectarMarca(numero: string): string {
  const limpio = numero.replace(/\s/g, '');
  if (limpio.startsWith('4')) return 'visa';
  if (limpio.startsWith('5')) return 'mastercard';
  if (limpio.startsWith('37')) return 'amex';
  if (limpio.startsWith('36')) return 'diners';
  if (limpio.startsWith('6011') || limpio.startsWith('65')) return 'discover';
  return '';
}

const MARCA_DISPLAY: Record<string, { nombre: string; color: string }> = {
  visa: { nombre: 'VISA', color: '#4A3728' },
  mastercard: { nombre: 'MC', color: '#D4A373' },
  amex: { nombre: 'AMEX', color: '#606C38' },
  diners: { nombre: 'DINERS', color: '#4A3728' },
  discover: { nombre: 'DISC', color: '#D4A373' },
};

function formatearNumero(value: string): string {
  const limpio = value.replace(/\D/g, '').slice(0, 16);
  return limpio.replace(/(.{4})/g, '$1 ').trim();
}

export function AddCardForm({ onCardAdded }: AddCardFormProps) {
  const [numero, setNumero] = useState('');
  const [titular, setTitular] = useState('');
  const [mesExp, setMesExp] = useState('');
  const [anioExp, setAnioExp] = useState('');
  const [cvv, setCvv] = useState('');
  const [mostrarCvv, setMostrarCvv] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const marca = detectarMarca(numero);
  const marcaInfo = MARCA_DISPLAY[marca];

  const handleNumeroChange = (val: string) => {
    setNumero(formatearNumero(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const limpio = numero.replace(/\s/g, '');
    if (limpio.length < 13) {
      setError('Número de tarjeta demasiado corto');
      return;
    }
    if (!titular.trim()) {
      setError('Ingresa el nombre del titular');
      return;
    }
    const mes = parseInt(mesExp, 10);
    const anio = parseInt(anioExp, 10);
    if (!mes || mes < 1 || mes > 12) {
      setError('Mes de expiración inválido');
      return;
    }
    const anioCompleto = anio < 100 ? 2000 + anio : anio;
    if (anioCompleto < new Date().getFullYear()) {
      setError('Año de expiración inválido');
      return;
    }
    if (cvv.length < 3) {
      setError('CVV inválido');
      return;
    }

    setGuardando(true);
    try {
      await cardService.registrar({
        numero_tarjeta: limpio,
        nombre_titular: titular,
        mes_expiracion: mes,
        anio_expiracion: anioCompleto,
        cvv,
      });
      setExito(true);
      setNumero('');
      setTitular('');
      setMesExp('');
      setAnioExp('');
      setCvv('');
      onCardAdded();
      setTimeout(() => setExito(false), 2500);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || 'Error al guardar la tarjeta');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Vista previa de tarjeta */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden shadow-md"
        style={{
          background: marca
            ? `linear-gradient(135deg, ${marcaInfo?.color || C.brown}CC 0%, ${C.brown} 100%)`
            : `linear-gradient(135deg, ${C.brown} 0%, ${C.green} 100%)`,
          minHeight: 160,
        }}
      >
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-10" style={{ backgroundColor: C.bg }} />
        <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full opacity-10" style={{ backgroundColor: C.bg }} />

        <div className="relative flex flex-col justify-between h-full" style={{ minHeight: 130 }}>
          <div className="flex justify-between items-start">
            <div className="w-10 h-7 rounded opacity-80" style={{ backgroundColor: C.sand }} />
            {marcaInfo && (
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: C.bg }}>
                {marcaInfo.nombre}
              </span>
            )}
          </div>

          <p className="text-lg font-mono tracking-[0.15em] mt-4" style={{ color: C.bg }}>
            {numero || '•••• •••• •••• ••••'}
          </p>

          <div className="flex justify-between items-end mt-3">
            <div>
              <p className="text-[10px] uppercase opacity-60" style={{ color: C.bg }}>Titular</p>
              <p className="text-xs font-medium truncate max-w-[200px]" style={{ color: C.bg }}>
                {titular.toUpperCase() || 'NOMBRE APELLIDO'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase opacity-60" style={{ color: C.bg }}>Expira</p>
              <p className="text-xs font-medium" style={{ color: C.bg }}>
                {mesExp ? mesExp.padStart(2, '0') : 'MM'}/{anioExp || 'AA'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Campos del formulario */}
      <div className="space-y-3">
        {/* Número */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: C.brown }}>
            Número de tarjeta
          </label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.sand }} />
            <input
              type="text"
              inputMode="numeric"
              value={numero}
              onChange={(e) => handleNumeroChange(e.target.value)}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              disabled={guardando}
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 text-sm outline-none transition-all disabled:opacity-50"
              style={{ borderColor: C.sand, color: C.brown, backgroundColor: C.bg }}
            />
          </div>
        </div>

        {/* Titular */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: C.brown }}>
            Nombre del titular
          </label>
          <input
            type="text"
            value={titular}
            onChange={(e) => setTitular(e.target.value)}
            placeholder="Como aparece en la tarjeta"
            disabled={guardando}
            className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none transition-all disabled:opacity-50"
            style={{ borderColor: C.sand, color: C.brown, backgroundColor: C.bg }}
          />
        </div>

        {/* Expiración + CVV */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: C.brown }}>Mes</label>
            <input
              type="text"
              inputMode="numeric"
              value={mesExp}
              onChange={(e) => setMesExp(e.target.value.replace(/\D/g, '').slice(0, 2))}
              placeholder="MM"
              maxLength={2}
              disabled={guardando}
              className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none text-center transition-all disabled:opacity-50"
              style={{ borderColor: C.sand, color: C.brown, backgroundColor: C.bg }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: C.brown }}>Año</label>
            <input
              type="text"
              inputMode="numeric"
              value={anioExp}
              onChange={(e) => setAnioExp(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="AA"
              maxLength={4}
              disabled={guardando}
              className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none text-center transition-all disabled:opacity-50"
              style={{ borderColor: C.sand, color: C.brown, backgroundColor: C.bg }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: C.brown }}>CVV</label>
            <div className="relative">
              <input
                type={mostrarCvv ? 'text' : 'password'}
                inputMode="numeric"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="•••"
                maxLength={4}
                disabled={guardando}
                className="w-full px-3 pr-9 py-2.5 rounded-xl border-2 text-sm outline-none text-center transition-all disabled:opacity-50"
                style={{ borderColor: C.sand, color: C.brown, backgroundColor: C.bg }}
              />
              <button
                type="button"
                onClick={() => setMostrarCvv((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                style={{ color: C.sand }}
                tabIndex={-1}
              >
                {mostrarCvv ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-3 py-2.5 rounded-xl text-xs font-medium" style={{ backgroundColor: C.bg, color: C.brown, border: `1px solid ${C.sand}` }}>
          {error}
        </div>
      )}

      {exito && (
        <div className="px-3 py-2.5 rounded-xl text-xs font-medium" style={{ backgroundColor: `${C.green}20`, color: C.green, border: `1px solid ${C.green}` }}>
          Tarjeta guardada exitosamente
        </div>
      )}

      <button
        type="submit"
        disabled={guardando}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ backgroundColor: C.green, color: C.bg }}
      >
        {guardando ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Guardando...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Guardar tarjeta
          </>
        )}
      </button>

      <p className="text-[11px] text-center" style={{ color: C.brown, opacity: 0.5 }}>
        Los datos de tu tarjeta se almacenan de forma segura. Nunca guardamos el número completo ni el CVV.
      </p>
    </form>
  );
}
