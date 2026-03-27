/**
 * WalletPage — Billetera virtual del cliente.
 *
 * Pestañas:
 * - Recargar: seleccionar tarjeta guardada + monto para recargar
 * - Mis Tarjetas: listar, agregar, eliminar, establecer predeterminada
 * - Historial: movimientos de la billetera
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ArrowUpCircle, CreditCard, History, RefreshCw, Wallet } from 'lucide-react';
import { formatCOP } from '../utils/format';
import { AddCardForm } from '../components/features/wallet/AddCardForm';
import { SavedCardsList } from '../components/features/wallet/SavedCardsList';
import { TransactionHistory } from '../components/features/payments/TransactionHistory';
import { useAuthStore } from '../store/authStore';
import { usePaymentStore } from '../store/paymentStore';
import { walletService } from '../services/walletService';
import { cardService, type TarjetaGuardada } from '../services/cardService';

const C = {
  bg: '#FEFAE0',
  white: '#FFFFFF',
  brown: '#4A3728',
  green: '#606C38',
  sand: '#D4A373',
} as const;

type Tab = 'recargar' | 'tarjetas' | 'historial';

function TabButton({
  active, onClick, icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all"
      style={{
        backgroundColor: active ? C.green : 'transparent',
        color: active ? C.bg : C.brown,
        opacity: active ? 1 : 0.7,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Componente de recarga usando tarjeta guardada
// ---------------------------------------------------------------------------

const MONTOS_RAPIDOS = [10000, 25000, 50000, 100000];

function RecargarConTarjeta({
  tarjetas,
  onSuccess,
  onIrATarjetas,
}: {
  tarjetas: TarjetaGuardada[];
  onSuccess: () => void;
  onIrATarjetas: () => void;
}) {
  const predeterminada = tarjetas.find((t) => t.es_predeterminada);
  const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState(predeterminada?.id || '');
  const [monto, setMonto] = useState(25000);
  const [montoInput, setMontoInput] = useState('25000');
  const [cvv, setCvv] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tarjetaSeleccionada && predeterminada) {
      setTarjetaSeleccionada(predeterminada.id);
    }
  }, [predeterminada, tarjetaSeleccionada]);

  const handleMontoRapido = (m: number) => {
    setMonto(m);
    setMontoInput(m.toString());
  };

  const handleMontoChange = (v: string) => {
    setMontoInput(v);
    const n = parseFloat(v);
    if (!isNaN(n) && n > 0) setMonto(n);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!tarjetaSeleccionada) {
      setError('Selecciona una tarjeta');
      return;
    }
    if (monto <= 0 || monto > 500000) {
      setError('Monto inválido (máximo $500.000)');
      return;
    }
    if (cvv.length < 3) {
      setError('Ingresa el CVV de tu tarjeta');
      return;
    }

    setProcesando(true);
    try {
      await cardService.recargarBilletera({
        tarjeta_id: tarjetaSeleccionada,
        monto,
        cvv,
      });
      setCvv('');
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || 'Error al procesar la recarga');
    } finally {
      setProcesando(false);
    }
  };

  if (tarjetas.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 gap-4">
        <CreditCard className="w-12 h-12 opacity-20" style={{ color: C.brown }} />
        <p className="text-sm text-center" style={{ color: C.brown, opacity: 0.7 }}>
          No tienes tarjetas registradas.<br />
          Agrega una para poder recargar tu billetera.
        </p>
        <button
          onClick={onIrATarjetas}
          className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
          style={{ backgroundColor: C.green, color: C.bg }}
        >
          Agregar tarjeta
        </button>
      </div>
    );
  }

  const MARCA_LABELS: Record<string, string> = {
    visa: 'Visa', mastercard: 'MC', amex: 'Amex', diners: 'Diners', discover: 'Disc', jcb: 'JCB',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Seleccionar tarjeta */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: C.brown }}>
          Tarjeta a utilizar
        </label>
        <select
          value={tarjetaSeleccionada}
          onChange={(e) => setTarjetaSeleccionada(e.target.value)}
          disabled={procesando}
          className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none appearance-none disabled:opacity-50"
          style={{ borderColor: C.sand, color: C.brown, backgroundColor: C.bg }}
        >
          <option value="">-- Seleccionar tarjeta --</option>
          {tarjetas.map((t) => (
            <option key={t.id} value={t.id}>
              {MARCA_LABELS[t.marca] || t.marca} •••• {t.ultimos4} — {t.nombre_titular}
              {t.es_predeterminada ? ' (Principal)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Montos rápidos */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: C.brown }}>
          Monto a recargar
        </label>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {MONTOS_RAPIDOS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleMontoRapido(m)}
              className="py-2 rounded-lg text-sm font-medium border-2 transition-all"
              style={{
                borderColor: monto === m ? C.green : C.sand,
                backgroundColor: monto === m ? C.green : 'transparent',
                color: monto === m ? C.bg : C.brown,
              }}
            >
              {formatCOP(m)}
            </button>
          ))}
        </div>
        <input
          type="number"
          min="1000"
          max="500000"
          step="1000"
          value={montoInput}
          onChange={(e) => handleMontoChange(e.target.value)}
          placeholder="Otro monto"
          disabled={procesando}
          className="w-full px-3 py-2 rounded-xl border-2 text-sm outline-none disabled:opacity-50"
          style={{ borderColor: C.sand, color: C.brown }}
        />
      </div>

      {/* CVV */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: C.brown }}>
          CVV de la tarjeta
        </label>
        <input
          type="password"
          inputMode="numeric"
          value={cvv}
          onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="•••"
          maxLength={4}
          disabled={procesando}
          className="w-24 px-3 py-2.5 rounded-xl border-2 text-sm outline-none text-center disabled:opacity-50"
          style={{ borderColor: C.sand, color: C.brown, backgroundColor: C.bg }}
        />
        <p className="text-[11px] mt-1" style={{ color: C.brown, opacity: 0.5 }}>
          Código de seguridad al reverso de tu tarjeta
        </p>
      </div>

      {error && (
        <div className="px-3 py-2.5 rounded-xl text-xs font-medium" style={{ backgroundColor: C.bg, color: C.brown, border: `1px solid ${C.sand}` }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={procesando || monto <= 0}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: C.green, color: C.bg }}
      >
        {procesando ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Procesando...
          </span>
        ) : (
          `Recargar ${formatCOP(monto)}`
        )}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

export function WalletPage() {
  const navigate = useNavigate();
  const { usuario, refreshUsuario, accessToken } = useAuthStore();
  const { fetchSaldo, saldo: saldoStore } = usePaymentStore();

  const [tab, setTab] = useState<Tab>('recargar');
  const [saldo, setSaldo] = useState<number>(
    typeof usuario?.saldo_billetera === 'string'
      ? parseFloat(usuario.saldo_billetera)
      : (usuario?.saldo_billetera as number | undefined) ?? 0,
  );
  const [cargandoSaldo, setCargandoSaldo] = useState(false);
  const [recargaExitosa, setRecargaExitosa] = useState(false);

  // Tarjetas
  const [tarjetas, setTarjetas] = useState<TarjetaGuardada[]>([]);
  const [cargandoTarjetas, setCargandoTarjetas] = useState(true);

  useEffect(() => {
    cargarSaldo();
    cargarTarjetas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSaldo(saldoStore);
  }, [saldoStore]);

  const cargarSaldo = async () => {
    setCargandoSaldo(true);
    try {
      const resp = await walletService.obtenerSaldo();
      const nuevo = typeof resp.saldo === 'string' ? parseFloat(resp.saldo) : resp.saldo;
      setSaldo(nuevo);
      if (accessToken) fetchSaldo(accessToken);
      await refreshUsuario();
    } catch {
      // Mantiene el valor anterior
    } finally {
      setCargandoSaldo(false);
    }
  };

  const cargarTarjetas = useCallback(async () => {
    setCargandoTarjetas(true);
    try {
      const data = await cardService.listar();
      setTarjetas(data);
    } catch {
      // silencioso
    } finally {
      setCargandoTarjetas(false);
    }
  }, []);

  const handleRecargaExitosa = async () => {
    setRecargaExitosa(true);
    await cargarSaldo();
    setTimeout(() => setRecargaExitosa(false), 2500);
  };

  return (
    <div className="min-h-screen py-6 px-4" style={{ backgroundColor: C.bg }}>
      <div className="max-w-xl mx-auto space-y-6">

        {/* Encabezado */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl transition-all hover:opacity-70"
            style={{ backgroundColor: C.white, color: C.brown }}
            aria-label="Volver"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6" style={{ color: C.green }} />
            <h1 className="text-xl font-bold" style={{ color: C.brown }}>Mi Billetera</h1>
          </div>
        </div>

        {/* Tarjeta de saldo */}
        <div
          className="rounded-2xl p-6 shadow-lg relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${C.green} 0%, ${C.brown} 100%)` }}
        >
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: C.bg }} />
          <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full opacity-10" style={{ backgroundColor: C.bg }} />

          <div className="relative">
            <p className="text-sm font-medium mb-1" style={{ color: C.bg, opacity: 0.85 }}>
              Saldo disponible
            </p>
            <div className="flex items-end gap-3">
              {cargandoSaldo ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" style={{ color: C.bg }} />
                  <span className="text-2xl font-bold" style={{ color: C.bg }}>Cargando...</span>
                </div>
              ) : (
                <span className="text-4xl font-bold tracking-tight" style={{ color: C.bg }}>
                  {formatCOP(saldo)}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-xs" style={{ color: C.bg, opacity: 0.7 }}>
                {usuario?.nombres} {usuario?.apellidos}
              </p>
              <button
                onClick={cargarSaldo}
                disabled={cargandoSaldo}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: 'rgba(254,250,224,0.2)', color: C.bg }}
              >
                <RefreshCw className={`w-3 h-3 ${cargandoSaldo ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ backgroundColor: C.white }}>
          <TabButton
            active={tab === 'recargar'}
            onClick={() => setTab('recargar')}
            icon={<ArrowUpCircle className="w-4 h-4" />}
            label="Recargar"
          />
          <TabButton
            active={tab === 'tarjetas'}
            onClick={() => setTab('tarjetas')}
            icon={<CreditCard className="w-4 h-4" />}
            label="Tarjetas"
          />
          <TabButton
            active={tab === 'historial'}
            onClick={() => setTab('historial')}
            icon={<History className="w-4 h-4" />}
            label="Historial"
          />
        </div>

        {/* Contenido de tabs */}

        {tab === 'recargar' && (
          <div className="space-y-4">
            <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: C.sand, backgroundColor: C.white }}>
              <div className="px-5 py-3 border-b" style={{ borderColor: C.sand, backgroundColor: C.bg }}>
                <h2 className="font-semibold text-sm" style={{ color: C.brown }}>Recargar con tarjeta guardada</h2>
              </div>
              <div className="p-5">
                {recargaExitosa ? (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: C.green }}>
                      <svg className="w-7 h-7" fill="none" stroke={C.bg} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="font-semibold" style={{ color: C.brown }}>¡Recarga exitosa!</p>
                    <p className="text-sm" style={{ color: C.brown, opacity: 0.7 }}>
                      Tu saldo ha sido actualizado.
                    </p>
                  </div>
                ) : (
                  <RecargarConTarjeta
                    tarjetas={tarjetas}
                    onSuccess={handleRecargaExitosa}
                    onIrATarjetas={() => setTab('tarjetas')}
                  />
                )}
              </div>
            </div>

            {/* Beneficios */}
            <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: C.sand, backgroundColor: C.white }}>
              <div className="px-5 py-3 border-b" style={{ borderColor: C.sand, backgroundColor: C.bg }}>
                <h2 className="font-semibold text-sm" style={{ color: C.brown }}>¿Para qué sirve la billetera?</h2>
              </div>
              <div className="p-5 space-y-4">
                {[
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke={C.green} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    ),
                    titulo: 'Pagos más rápidos',
                    desc: 'Compra sin ingresar datos de tarjeta cada vez.',
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke={C.green} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ),
                    titulo: 'Reembolsos automáticos',
                    desc: 'Las devoluciones aprobadas se acreditan aquí.',
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke={C.sand} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    ),
                    titulo: 'Seguro y sin comisiones',
                    desc: 'Tu saldo no tiene fecha de vencimiento.',
                  },
                ].map(({ icon, titulo, desc }) => (
                  <div key={titulo} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: C.bg }}>
                      {icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.brown }}>{titulo}</p>
                      <p className="text-xs mt-0.5" style={{ color: C.brown, opacity: 0.6 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'tarjetas' && (
          <div className="space-y-4">
            {/* Tarjetas existentes */}
            <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: C.sand, backgroundColor: C.white }}>
              <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: C.sand, backgroundColor: C.bg }}>
                <h2 className="font-semibold text-sm" style={{ color: C.brown }}>Mis Tarjetas</h2>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${C.green}20`, color: C.green }}>
                  {tarjetas.length} {tarjetas.length === 1 ? 'tarjeta' : 'tarjetas'}
                </span>
              </div>
              <div className="p-4">
                <SavedCardsList
                  tarjetas={tarjetas}
                  cargando={cargandoTarjetas}
                  onRefresh={cargarTarjetas}
                />
              </div>
            </div>

            {/* Agregar nueva */}
            <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: C.sand, backgroundColor: C.white }}>
              <div className="px-5 py-3 border-b" style={{ borderColor: C.sand, backgroundColor: C.bg }}>
                <h2 className="font-semibold text-sm" style={{ color: C.brown }}>Agregar nueva tarjeta</h2>
              </div>
              <div className="p-5">
                <AddCardForm onCardAdded={cargarTarjetas} />
              </div>
            </div>
          </div>
        )}

        {tab === 'historial' && (
          <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: C.sand, backgroundColor: C.white }}>
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: C.sand, backgroundColor: C.bg }}>
              <h2 className="font-semibold text-sm" style={{ color: C.brown }}>Movimientos</h2>
              <button
                onClick={cargarSaldo}
                className="flex items-center gap-1 text-xs transition-all hover:opacity-70"
                style={{ color: C.green }}
              >
                <RefreshCw className="w-3 h-3" />
                Actualizar
              </button>
            </div>
            <div className="p-4">
              <TransactionHistory />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
