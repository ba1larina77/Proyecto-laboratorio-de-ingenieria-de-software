import React, { useState, useMemo } from "react";
import { useShop, fmt, STORES } from "../../store/ShopContext";
import type { Purchase, Book } from "../../store/shopTypes";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onGoToWallet?: () => void;
}

type DeliveryType = "shipping" | "pickup";
type PaymentMethod = "wallet" | "card";
type PaymentError = "rejected" | "insufficient" | null;

const STEP_NAMES = ["Envío", "Pago", "Confirmado"];

function validateAddress(addr: string) {
  if (!addr.trim()) return "La dirección de envío es obligatoria (RF-CR-16)";
  if (addr.trim().length < 10) return "Ingresa una dirección completa (calle, número, ciudad)";
  return "";
}

// M2-HU9: Simular stock por tienda a partir del stock global del libro
// Distribución determinista basada en book.id para que sea consistente
function getStoreStock(book: Book, storeId: number): number {
  const total = book.stock;
  if (total <= 0) return 0;
  // Distribución: tienda 1 = 40%, tienda 2 = 35%, tienda 3 = 25%
  // Se usa book.id para variar la distribución de forma determinista
  const seed = book.id % 3;
  const distributions: number[][] = [
    [0.4, 0.35, 0.25],
    [0.35, 0.25, 0.4],
    [0.25, 0.4, 0.35],
  ];
  const dist = distributions[seed];
  return Math.max(0, Math.floor(total * dist[storeId - 1]));
}

// M2-HU9: Verificar si una tienda tiene stock suficiente para todos los ítems del carrito
function checkStoreAvailability(cartItems: { book: Book; qty: number }[], storeId: number): boolean {
  return cartItems.every(item => getStoreStock(item.book, storeId) >= item.qty);
}

// M2-HU9: Encontrar la tienda más cercana (menor distancia) con disponibilidad
function findNearestAvailableStore(
  cartItems: { book: Book; qty: number }[],
  excludeStoreId: number
): typeof STORES[0] | null {
  const available = STORES
    .filter(s => s.id !== excludeStoreId && checkStoreAvailability(cartItems, s.id))
    .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
  return available[0] ?? null;
}

// ══════════════════════════════════════════════════════════════════════════
export function CheckoutModal({ open, onClose, onSuccess, onGoToWallet }: CheckoutModalProps) {
  const { cart, clearCart, addPurchase, processPurchase, showToast, user } = useShop();
  const [step, setStep]                     = useState(1);
  const [delivery, setDelivery]             = useState<DeliveryType>("shipping");
  const [paymentMethod, setPaymentMethod]   = useState<PaymentMethod>("wallet");
  const [selectedStore, setSelectedStore]   = useState<number | null>(null);
  const [address, setAddress]               = useState("Calle 100 #15-20, Bogotá");
  const [addressError, setAddressError]     = useState("");
  const [city, setCity]                     = useState("Bogotá");
  const [postalCode, setPostalCode]         = useState("110221");
  const [processing, setProcessing]         = useState(false);
  const [paymentError, setPaymentError]     = useState<PaymentError>(null);
  const [walletErrorMsg, setWalletErrorMsg] = useState("");
  const [cancelConfirm, setCancelConfirm]   = useState(false);
  const [orderId, setOrderId]               = useState("");
  const [transactionId, setTransactionId]   = useState("");

  const subtotal    = cart.reduce((s, i) => s + i.book.price * i.qty, 0);
  const shippingCost = delivery === "shipping" ? 8000 : 0;
  const total       = subtotal + shippingCost;

  // M2-HU9: Disponibilidad por tienda (memoizado)
  const storeAvailability = useMemo(() => {
    return STORES.reduce((acc, store) => {
      acc[store.id] = checkStoreAvailability(cart, store.id);
      return acc;
    }, {} as Record<number, boolean>);
  }, [cart]);

  // M2-HU9: ¿La tienda seleccionada tiene stock?
  const selectedStoreHasStock = selectedStore !== null
    ? storeAvailability[selectedStore]
    : true;

  // M2-HU9: Tienda más cercana con disponibilidad (alternativa)
  const nearestAlternativeStore = useMemo(() => {
    if (!selectedStore || selectedStoreHasStock) return null;
    return findNearestAvailableStore(cart, selectedStore);
  }, [cart, selectedStore, selectedStoreHasStock]);

  // M2-HU8: Fecha estimada de entrega
  const estimatedDelivery = useMemo(() => {
    const d = new Date();
    if (delivery === "shipping") {
      d.setDate(d.getDate() + 3);
    } else {
      d.setDate(d.getDate() + 1);
    }
    return d.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
  }, [delivery]);

  function reset() {
    setStep(1); setDelivery("shipping"); setSelectedStore(null);
    setProcessing(false); setPaymentError(null); setWalletErrorMsg("");
    setCancelConfirm(false); setAddressError(""); setTransactionId("");
  }

  function handleClose() {
    if (step === 1 || step === 2) { setCancelConfirm(true); return; }
    reset(); onClose();
  }

  function confirmCancel() {
    reset(); onClose(); setCancelConfirm(false);
    showToast("Compra cancelada — tu carrito se conserva", "info");
  }

  function handleStep1Next() {
    if (delivery === "shipping") {
      const err = validateAddress(address);
      if (err) { setAddressError(err); return; }
    }
    if (delivery === "pickup" && !selectedStore) {
      showToast("Selecciona una tienda para recoger tu pedido (RF-CR-18)", "error");
      return;
    }
    // M2-HU9: si la tienda no tiene stock, bloquear avance
    if (delivery === "pickup" && selectedStore && !selectedStoreHasStock) {
      showToast(
        nearestAlternativeStore
          ? `Esa tienda no tiene stock. Prueba con ${nearestAlternativeStore.name}`
          : "Esa tienda no tiene stock disponible para tu pedido",
        "error"
      );
      return;
    }
    setPaymentError(null);
    setStep(2);
  }

  function buildNewPurchase(id: string): Purchase {
    const storeName = STORES.find(s => s.id === selectedStore)?.name;
    const now = new Date();
    return {
      id, date: now,
      items: cart.map(i => ({ book: i.book, qty: i.qty, price: i.book.price })),
      total, status: "preparing", delivery,
      address: delivery === "shipping" ? `${address}, ${city} ${postalCode}` : undefined,
      store:   delivery === "pickup"   ? storeName                           : undefined,
      tracking: [
        { status: "Pedido recibido", done: true,
          date: now.toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) },
        { status: "En preparación", done: false, date: "" },
        { status: delivery === "shipping" ? "Enviado" : "Listo para recoger", done: false, date: "" },
        { status: delivery === "shipping" ? "Entregado" : "Recogido",         done: false, date: "" },
      ],
    };
  }

  function handleStep2Next() {
    setProcessing(true);
    setPaymentError(null);
    setWalletErrorMsg("");

    const id = "P-" + Date.now().toString().slice(-6);
    const newPurchase = buildNewPurchase(id);

    if (paymentMethod === "wallet") {
      const result = processPurchase(newPurchase);
      if (result.success) {
        setOrderId(id);
        setTransactionId(result.transactionId ?? "");
        setProcessing(false);
        setStep(3);
      } else {
        setWalletErrorMsg(result.error ?? "No se pudo procesar el pago.");
        setProcessing(false);
      }
      return;
    }

    // Pago con tarjeta (mock con simulación)
    setTimeout(() => {
      const rand = Math.random();
      if (rand < 0.08) { setPaymentError("rejected");    setProcessing(false); return; }
      if (rand < 0.12) { setPaymentError("insufficient"); setProcessing(false); return; }
      setOrderId(id);
      addPurchase(newPurchase);
      clearCart();
      setProcessing(false);
      setStep(3);
    }, 1800);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center p-4"
      style={{ background: "rgba(74,55,40,0.5)" }}
      onClick={e => { if (e.target === e.currentTarget && !cancelConfirm) handleClose(); }}
    >
      <div
        className="w-full max-w-xl rounded-2xl overflow-y-auto relative"
        style={{ background: "#fff", maxHeight: "90vh", boxShadow: "0 24px 80px rgba(74,55,40,0.3)" }}
      >
        {/* Overlay de cancelación */}
        {cancelConfirm && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
            style={{ background: "rgba(255,255,255,0.95)" }}>
            <div className="text-center p-8 max-w-xs">
              <p className="text-lg font-bold mb-2"
                style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
                ¿Cancelar compra?
              </p>
              <p className="text-sm mb-6" style={{ color: "#6B5344" }}>
                Tu carrito se conservará. Podrás retomar el proceso cuando quieras.
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setCancelConfirm(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium border"
                  style={{ borderColor: "#D4A373", color: "#4A3728" }}>
                  Continuar comprando
                </button>
                <button onClick={confirmCancel}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "#C0392B", color: "#fff" }}>
                  Sí, cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-0">
          <h3 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
            {step === 1 ? "Método de entrega" : step === 2 ? "Información de pago" : "¡Pedido confirmado!"}
          </h3>
          <button onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70"
            style={{ background: "#F5EDD3", color: "#4A3728" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="px-8 py-6">
          {/* Indicador de pasos */}
          {step < 3 && (
            <div className="flex items-center mb-7">
              {STEP_NAMES.map((name, i) => (
                <div key={name} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                      style={i < step - 1
                        ? { background: "#606C38", color: "#fff" }
                        : i === step - 1
                          ? { background: "#4A3728", color: "#FEFAE0" }
                          : { background: "#F5EDD3", color: "#6B5344" }}>
                      {i < step - 1 ? "✓" : i + 1}
                    </div>
                    <span className="text-xs mt-1" style={{ color: "#6B5344" }}>{name}</span>
                  </div>
                  {i < 2 && (
                    <div className="flex-1 h-0.5 mx-2 mb-4"
                      style={{ background: i < step - 1 ? "#606C38" : "#EDE0C4" }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── PASO 1: Método de entrega ── */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium mb-3" style={{ color: "#4A3728" }}>
                ¿Cómo quieres recibir tu pedido?
              </p>

              {/* Opciones de entrega */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    type: "shipping" as DeliveryType,
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                        <rect x="1" y="3" width="15" height="13"/>
                        <path d="M16 8h4l3 3v5h-7V8zM5.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
                      </svg>
                    ),
                    title: "Envío a domicilio",
                    sub: "2-5 días hábiles · +$8.000",
                  },
                  {
                    type: "pickup" as DeliveryType,
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <path d="M9 22V12h6v10"/>
                      </svg>
                    ),
                    title: "Recoger en tienda",
                    sub: "Listo en 24h · Gratis",
                  },
                ].map(opt => (
                  <div
                    key={opt.type}
                    onClick={() => { setDelivery(opt.type); setAddressError(""); setSelectedStore(null); }}
                    className="border rounded-xl p-4 cursor-pointer transition-all"
                    style={delivery === opt.type
                      ? { borderColor: "#4A3728", background: "rgba(74,55,40,0.04)" }
                      : { borderColor: "#E8C99A" }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                      style={{
                        background: delivery === opt.type ? "#4A3728" : "#F5EDD3",
                        color: delivery === opt.type ? "#FEFAE0" : "#4A3728",
                      }}>
                      {opt.icon}
                    </div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: "#4A3728" }}>{opt.title}</p>
                    <p className="text-xs" style={{ color: "#6B5344" }}>{opt.sub}</p>
                  </div>
                ))}
              </div>

              {/* RF-CR-16: Dirección de envío */}
              {delivery === "shipping" && (
                <div className="space-y-3 mt-2">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "#4A3728" }}>
                      Dirección de envío <span style={{ color: "#C0392B" }}>*</span>
                    </label>
                    <input
                      value={address}
                      onChange={e => { setAddress(e.target.value); setAddressError(""); }}
                      onBlur={() => setAddressError(validateAddress(address))}
                      placeholder="Calle 100 #15-20, Barrio..."
                      className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                      style={{
                        border: `1.5px solid ${addressError ? "#C0392B" : "#E8C99A"}`,
                        background: "#FEFAE0", color: "#4A3728",
                      }}
                    />
                    {addressError && <p className="text-xs mt-1" style={{ color: "#C0392B" }}>{addressError}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "#4A3728" }}>Ciudad</label>
                      <input value={city} onChange={e => setCity(e.target.value)} placeholder="Bogotá"
                        className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                        style={{ border: "1.5px solid #E8C99A", background: "#FEFAE0", color: "#4A3728" }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "#4A3728" }}>Código postal</label>
                      <input value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="110221"
                        className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                        style={{ border: "1.5px solid #E8C99A", background: "#FEFAE0", color: "#4A3728" }} />
                    </div>
                  </div>
                  {/* RF-CR-17: Info de estados */}
                  <div className="rounded-lg p-3 text-xs" style={{ background: "#F5EDD3", color: "#6B5344" }}>
                    <strong style={{ color: "#4A3728" }}>Estados de envío (RF-CR-17): </strong>
                    En preparación → Enviado → Entregado
                  </div>
                </div>
              )}

              {/* RF-CR-18 / RF-CR-19: Tiendas con disponibilidad por libro */}
              {delivery === "pickup" && (
                <div className="space-y-2 mt-2">
                  <p className="text-sm font-medium mb-2" style={{ color: "#4A3728" }}>
                    Tiendas en Pereira (RF-CR-18)
                  </p>

                  {STORES.map(store => {
                    const hasStock = storeAvailability[store.id];
                    const isSelected = selectedStore === store.id;
                    return (
                      <div
                        key={store.id}
                        onClick={() => hasStock && setSelectedStore(store.id)}
                        className={`flex items-center gap-3 p-3 border rounded-xl transition-all ${hasStock ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                        style={
                          isSelected
                            ? { borderColor: "#4A3728", background: "rgba(74,55,40,0.04)" }
                            : { borderColor: hasStock ? "#E8C99A" : "#f0c8c8" }
                        }
                      >
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: isSelected ? "#4A3728" : "#F0EBD8" }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                            width="16" height="16"
                            style={{ color: isSelected ? "#D4A373" : "#606C38" }}>
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold" style={{ color: "#4A3728" }}>{store.name}</p>
                          <p className="text-xs" style={{ color: "#6B5344", opacity: 0.75 }}>{store.address}</p>
                          <p className="text-xs font-medium" style={{ color: "#606C38" }}>📍 {store.distance}</p>
                        </div>
                        {/* M2-HU9: badge de disponibilidad real */}
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                          style={{
                            background: hasStock ? "rgba(96,108,56,0.1)" : "rgba(192,57,43,0.08)",
                            color: hasStock ? "#606C38" : "#C0392B",
                          }}
                        >
                          {hasStock ? "✓ Con stock" : "✗ Sin stock"}
                        </span>
                      </div>
                    );
                  })}

                  {/* M2-HU9: Alerta tienda sin stock con sugerencia */}
                  {selectedStore && !selectedStoreHasStock && (
                    <div
                      className="rounded-xl p-4 flex items-start gap-3"
                      style={{ background: "rgba(192,57,43,0.08)", border: "1.5px solid #C0392B" }}
                    >
                      <span className="text-base mt-0.5">⚠️</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold mb-1" style={{ color: "#C0392B" }}>
                          Esta tienda no tiene stock suficiente para tu pedido
                        </p>
                        {nearestAlternativeStore ? (
                          <>
                            <p className="text-xs mb-2" style={{ color: "#C0392B" }}>
                              Tienda más cercana disponible:
                            </p>
                            <button
                              onClick={() => setSelectedStore(nearestAlternativeStore.id)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all hover:opacity-80"
                              style={{ borderColor: "#606C38", color: "#606C38", background: "rgba(96,108,56,0.08)" }}
                            >
                              📍 {nearestAlternativeStore.name} ({nearestAlternativeStore.distance})
                            </button>
                          </>
                        ) : (
                          <p className="text-xs" style={{ color: "#C0392B" }}>
                            Ninguna tienda tiene stock. Considera el envío a domicilio.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── PASO 2: Pago ── */}
          {step === 2 && (
            <div>
              {/* Selector de método de pago */}
              <p className="text-sm font-medium mb-3" style={{ color: "#4A3728" }}>Método de pago</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {([
                  { key: "wallet" as PaymentMethod, icon: "👛", title: "Billetera digital", sub: `Saldo: ${fmt(user?.balance ?? 0)}` },
                  { key: "card"   as PaymentMethod, icon: "💳", title: "Tarjeta",           sub: "Visa •4521" },
                ] as const).map(opt => (
                  <div key={opt.key}
                    onClick={() => { setPaymentMethod(opt.key); setWalletErrorMsg(""); setPaymentError(null); }}
                    className="border rounded-xl p-4 cursor-pointer transition-all"
                    style={paymentMethod === opt.key
                      ? { borderColor: "#4A3728", background: "rgba(74,55,40,0.04)" }
                      : { borderColor: "#E8C99A" }}>
                    <span className="text-2xl">{opt.icon}</span>
                    <p className="text-sm font-semibold mt-2" style={{ color: "#4A3728" }}>{opt.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#6B5344" }}>{opt.sub}</p>
                  </div>
                ))}
              </div>

              {/* ── Panel billetera ── */}
              {paymentMethod === "wallet" && (
                <div className="mb-5 space-y-3">
                  {/* Grid saldo disponible / a descontar / saldo resultante */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Saldo disponible", value: fmt(user?.balance ?? 0),                 color: "#606C38" },
                      { label: "A descontar",       value: `− ${fmt(total)}`,                      color: "#C0392B" },
                      { label: "Saldo resultante",  value: fmt((user?.balance ?? 0) - total),      color: (user?.balance ?? 0) >= total ? "#4A3728" : "#C0392B" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="rounded-xl p-3 text-center"
                        style={{ background: "#F5EDD3" }}>
                        <p className="text-xs mb-1" style={{ color: "#6B5344" }}>{label}</p>
                        <p className="text-sm font-bold" style={{ fontFamily: "'Playfair Display', serif", color }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Error saldo insuficiente */}
                  {walletErrorMsg && (
                    <div className="rounded-xl p-4 flex items-start gap-3"
                      style={{ background: "rgba(192,57,43,0.07)", border: "1.5px solid #C0392B" }}>
                      <span className="text-lg flex-shrink-0">💳</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold mb-1" style={{ color: "#C0392B" }}>
                          Saldo insuficiente
                        </p>
                        <p className="text-xs mb-3" style={{ color: "#C0392B" }}>{walletErrorMsg}</p>
                        {onGoToWallet && (
                          <button
                            onClick={() => { reset(); onClose(); onGoToWallet(); }}
                            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                            style={{ background: "#4A3728", color: "#FEFAE0" }}>
                            Recargar saldo →
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Indicador saldo suficiente */}
                  {!walletErrorMsg && (user?.balance ?? 0) >= total && (
                    <div className="rounded-xl p-3 flex items-center gap-2"
                      style={{ background: "rgba(96,108,56,0.08)", border: "1px solid rgba(96,108,56,0.3)" }}>
                      <span style={{ color: "#606C38" }}>✓</span>
                      <p className="text-xs font-medium" style={{ color: "#606C38" }}>
                        Saldo suficiente para completar la compra
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Panel tarjeta (mock) ── */}
              {paymentMethod === "card" && (
                <div className="mb-5">
                  {paymentError === "rejected" && (
                    <div className="rounded-xl p-4 mb-4 flex items-start gap-3"
                      style={{ background: "rgba(192,57,43,0.08)", border: "1.5px solid #C0392B" }}>
                      <span className="text-base">❌</span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#C0392B" }}>Pago no autorizado</p>
                        <p className="text-xs mt-0.5" style={{ color: "#C0392B" }}>
                          El sistema financiero rechazó el pago. Verifica los datos e intenta de nuevo.
                        </p>
                      </div>
                    </div>
                  )}
                  {paymentError === "insufficient" && (
                    <div className="rounded-xl p-4 mb-4 flex items-start gap-3"
                      style={{ background: "rgba(192,57,43,0.08)", border: "1.5px solid #C0392B" }}>
                      <span className="text-base">💳</span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#C0392B" }}>Fondos insuficientes</p>
                        <p className="text-xs mt-0.5" style={{ color: "#C0392B" }}>
                          La tarjeta no tiene fondos disponibles. Usa otro medio de pago.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl p-5 mb-4 relative overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #4A3728 0%, #6B5344 100%)", color: "#FEFAE0" }}>
                    <div className="w-8 h-6 rounded mb-5" style={{ background: "#D4A373" }} />
                    <p className="text-lg font-bold mb-4"
                      style={{ fontFamily: "'Playfair Display', serif", letterSpacing: 3 }}>
                      •••• •••• •••• 4521
                    </p>
                    <div className="flex justify-between text-xs">
                      <div><p style={{ opacity: 0.6 }}>TITULAR</p><p className="font-medium mt-0.5">JUAN C PÉREZ</p></div>
                      <div><p style={{ opacity: 0.6 }}>VENCE</p><p className="font-medium mt-0.5">12/27</p></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {([
                      ["Número de tarjeta",  "•••• •••• •••• 4521", "text"],
                      ["Titular",            "Juan Carlos Pérez",   "text"],
                      ["Vencimiento (MM/AA)", "12/27",              "text"],
                      ["CVV",                "",                    "password"],
                    ] as const).map(([label, val, type]) => (
                      <div key={label}>
                        <label className="block text-xs font-medium mb-1" style={{ color: "#4A3728" }}>{label}</label>
                        <input defaultValue={val} type={type}
                          maxLength={label === "CVV" ? 3 : undefined}
                          placeholder={label === "CVV" ? "•••" : ""}
                          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                          style={{
                            border: `1.5px solid ${paymentError ? "#C0392B" : "#E8C99A"}`,
                            background: "#FEFAE0", color: "#4A3728",
                          }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumen del pedido (siempre visible) */}
              <div className="rounded-xl p-4" style={{ background: "#F5EDD3" }}>
                <p className="text-sm font-semibold mb-3" style={{ color: "#4A3728" }}>Resumen del pedido</p>
                {cart.map(i => (
                  <div key={i.book.id} className="flex justify-between text-xs mb-1.5" style={{ color: "#6B5344" }}>
                    <span className="truncate mr-2">{i.book.title} ×{i.qty}</span>
                    <span className="flex-shrink-0">{fmt(i.book.price * i.qty)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs mb-1.5" style={{ color: "#6B5344" }}>
                  <span>{delivery === "shipping" ? "Envío a domicilio" : "Recogida en tienda"}</span>
                  <span>{shippingCost > 0 ? fmt(shippingCost) : "Gratis"}</span>
                </div>
                <div className="flex justify-between pt-3 mt-1 border-t font-bold"
                  style={{ borderColor: "#E8C99A", color: "#4A3728" }}>
                  <span>Total</span>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 17 }}>{fmt(total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── PASO 3: Confirmación ── */}
          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "#606C38" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="40" height="40">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              </div>
              <h4 className="text-2xl font-bold mb-2"
                style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
                ¡Gracias por tu compra!
              </h4>
              <p className="text-sm mb-6" style={{ color: "#6B5344" }}>
                Pedido registrado con estado <strong>EN PREPARACIÓN</strong>
              </p>

              {/* Resumen con fecha estimada de entrega */}
              <div className="rounded-xl p-5 text-left mb-5" style={{ background: "#F5EDD3" }}>
                {([
                  ["N° de pedido",    orderId],
                  ["Pago",            paymentMethod === "wallet" ? "👛 Billetera digital" : "💳 Tarjeta •4521"],
                  ["Método",          delivery === "shipping" ? "🚚 Envío a domicilio" : "🏪 Recogida en tienda"],
                  [delivery === "shipping" ? "Dirección" : "Tienda",
                    delivery === "shipping"
                      ? `${address}, ${city}`
                      : STORES.find(s => s.id === selectedStore)?.name ?? "—"],
                  ["Total pagado",    fmt(total)],
                  ...(transactionId ? [["ID transacción", transactionId]] : []),
                  [delivery === "shipping" ? "Entrega estimada" : "Listo para recoger", estimatedDelivery],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k}
                    className="flex justify-between text-sm mb-2 last:mb-0 last:pt-3 last:border-t last:font-bold"
                    style={{ borderColor: "#E8C99A", color: "#4A3728" }}>
                    <span style={{ color: "#6B5344" }}>{k}</span>
                    <span style={{
                      fontFamily: k === "Total pagado" ? "'Playfair Display', serif" : undefined,
                      fontSize: k === "Total pagado" ? 16 : undefined,
                      fontFamily2: k === "ID transacción" ? "monospace" : undefined,
                      maxWidth: 200, textAlign: "right",
                      color: (k === "Entrega estimada" || k === "Listo para recoger") ? "#606C38" : undefined,
                      fontWeight: (k === "Entrega estimada" || k === "Listo para recoger") ? 600 : undefined,
                    } as React.CSSProperties}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs" style={{ color: "#6B5344" }}>
                Confirmación enviada a <strong>{user?.email ?? "tu correo"}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-8 pb-7">
          {step === 1 && (
            <>
              <button onClick={handleClose}
                className="px-6 py-2.5 rounded-xl text-sm font-medium border transition-all hover:opacity-80"
                style={{ borderColor: "#D4A373", color: "#4A3728" }}>
                Cancelar
              </button>
              <button onClick={handleStep1Next}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: "#4A3728", color: "#FEFAE0" }}>
                Continuar →
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <button onClick={() => { setStep(1); setPaymentError(null); }}
                className="px-6 py-2.5 rounded-xl text-sm font-medium border transition-all hover:opacity-80"
                style={{ borderColor: "#D4A373", color: "#4A3728" }}>
                ← Atrás
              </button>
              <button
                onClick={handleStep2Next}
                disabled={processing || (paymentMethod === "wallet" && (user?.balance ?? 0) < total)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: "#4A3728", color: "#FEFAE0" }}>
                {processing
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Procesando…</>
                  : walletErrorMsg || paymentError ? "Reintentar pago" : "Confirmar pedido →"}
              </button>
            </>
          )}
          {step === 3 && (
            <button onClick={() => { reset(); onSuccess(); onClose(); }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "#4A3728", color: "#FEFAE0" }}>
              Ver mis pedidos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
