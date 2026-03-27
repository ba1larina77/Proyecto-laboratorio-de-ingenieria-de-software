import { useState } from "react";
import { useShop, fmt, STORES } from "../../store/ShopContext";
import type { Purchase } from "../../store/shopTypes";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type DeliveryType = "shipping" | "pickup";
type PaymentError = "rejected" | "insufficient" | null;

const STEP_NAMES = ["Envío", "Pago", "Confirmado"];

function validateAddress(addr: string) {
  if (!addr.trim()) return "La dirección de envío es obligatoria (RF-CR-16)";
  if (addr.trim().length < 10) return "Ingresa una dirección completa (calle, número, ciudad)";
  return "";
}

export function CheckoutModal({ open, onClose, onSuccess }: CheckoutModalProps) {
  const { cart, clearCart, addPurchase, showToast } = useShop();
  const [step, setStep] = useState(1);
  const [delivery, setDelivery] = useState<DeliveryType>("shipping");
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [address, setAddress] = useState("Calle 100 #15-20, Bogotá");
  const [addressError, setAddressError] = useState("");
  const [city, setCity] = useState("Bogotá");
  const [postalCode, setPostalCode] = useState("110221");
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<PaymentError>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [orderId, setOrderId] = useState("");

  const subtotal = cart.reduce((s, i) => s + i.book.price * i.qty, 0);
  const shippingCost = delivery === "shipping" ? 8000 : 0;
  const total = subtotal + shippingCost;

  function reset() {
    setStep(1); setDelivery("shipping"); setSelectedStore(null);
    setProcessing(false); setPaymentError(null); setCancelConfirm(false);
    setAddressError("");
  }

  function handleClose() {
    if (step === 1 || step === 2) {
      setCancelConfirm(true);
      return;
    }
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
    setPaymentError(null);
    setStep(2);
  }

  function handleStep2Next() {
    setProcessing(true);
    setPaymentError(null);
    // Simulación de respuesta financiera (CU-CR-003 Alterno A y B)
    setTimeout(() => {
      const rand = Math.random();
      if (rand < 0.08) {
        // CU-CR-003 Alterno A: Pago rechazado
        setPaymentError("rejected");
        setProcessing(false);
        return;
      }
      if (rand < 0.12) {
        // CU-CR-003 Alterno B: Saldo insuficiente
        setPaymentError("insufficient");
        setProcessing(false);
        return;
      }
      const id = "P-" + Date.now().toString().slice(-6);
      setOrderId(id);
      const storeName = STORES.find(s => s.id === selectedStore)?.name;
      const now = new Date();
      const newPurchase: Purchase = {
        id, date: now,
        items: cart.map(i => ({ book: i.book, qty: i.qty, price: i.book.price })),
        total, status: "preparing", delivery,
        address: delivery === "shipping" ? `${address}, ${city} ${postalCode}` : undefined,
        store: delivery === "pickup" ? storeName : undefined,
        tracking: [
          { status: "Pedido recibido", done: true, date: now.toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) },
          { status: "En preparación", done: false, date: "" },
          { status: delivery === "shipping" ? "Enviado" : "Listo para recoger", done: false, date: "" },
          { status: delivery === "shipping" ? "Entregado" : "Recogido", done: false, date: "" },
        ],
      };
      addPurchase(newPurchase);
      clearCart();
      setProcessing(false);
      setStep(3);
    }, 1800);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4"
      style={{ background: "rgba(74,55,40,0.5)" }}
      onClick={e => { if (e.target === e.currentTarget && !cancelConfirm) handleClose(); }}>
      <div className="w-full max-w-xl rounded-2xl overflow-y-auto"
        style={{ background: "#fff", maxHeight: "90vh", boxShadow: "0 24px 80px rgba(74,55,40,0.3)" }}>

        {/* Cancel confirmation overlay */}
        {cancelConfirm && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
            style={{ background: "rgba(255,255,255,0.95)" }}>
            <div className="text-center p-8 max-w-xs">
              <p className="text-lg font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
                ¿Cancelar compra?
              </p>
              <p className="text-sm mb-6" style={{ color: "#6B5344" }}>
                Tu carrito se conservará. Podrás retomar el proceso cuando quieras. (CU-CR-003 Alterno D)
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

        <div className="flex items-center justify-between px-8 pt-7 pb-0">
          <h3 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
            {step === 1 ? "Método de entrega" : step === 2 ? "Información de pago" : "¡Pedido confirmado!"}
          </h3>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70"
            style={{ background: "#F5EDD3", color: "#4A3728" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="px-8 py-6">
          {/* Step indicator */}
          {step < 3 && (
            <div className="flex items-center mb-7">
              {STEP_NAMES.map((name, i) => (
                <div key={name} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                      style={i < step - 1 ? { background: "#606C38", color: "#fff" }
                        : i === step - 1 ? { background: "#4A3728", color: "#FEFAE0" }
                        : { background: "#F5EDD3", color: "#6B5344" }}>
                      {i < step - 1 ? "✓" : i + 1}
                    </div>
                    <span className="text-xs mt-1" style={{ color: "#6B5344" }}>{name}</span>
                  </div>
                  {i < 2 && <div className="flex-1 h-0.5 mx-2 mb-4"
                    style={{ background: i < step - 1 ? "#606C38" : "#EDE0C4" }} />}
                </div>
              ))}
            </div>
          )}

          {/* ── STEP 1: Delivery ── */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium mb-3" style={{ color: "#4A3728" }}>¿Cómo quieres recibir tu pedido?</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: "shipping" as DeliveryType, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8zM5.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>, title: "Envío a domicilio", sub: "2-5 días hábiles · +$8.000" },
                  { type: "pickup" as DeliveryType, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>, title: "Recoger en tienda", sub: "Listo en 24h · Gratis" },
                ].map(opt => (
                  <div key={opt.type} onClick={() => { setDelivery(opt.type); setAddressError(""); }}
                    className="border rounded-xl p-4 cursor-pointer transition-all"
                    style={delivery === opt.type ? { borderColor: "#4A3728", background: "rgba(74,55,40,0.04)" } : { borderColor: "#E8C99A" }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                      style={{ background: delivery === opt.type ? "#4A3728" : "#F5EDD3", color: delivery === opt.type ? "#FEFAE0" : "#4A3728" }}>
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
                    <input value={address} onChange={e => { setAddress(e.target.value); setAddressError(""); }}
                      onBlur={() => setAddressError(validateAddress(address))}
                      placeholder="Calle 100 #15-20, Barrio..."
                      className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                      style={{ border: `1.5px solid ${addressError ? "#C0392B" : "#E8C99A"}`, background: "#FEFAE0", color: "#4A3728" }} />
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
                  {/* RF-CR-17: Estados de envío info */}
                  <div className="rounded-lg p-3 text-xs" style={{ background: "#F5EDD3", color: "#6B5344" }}>
                    <strong style={{ color: "#4A3728" }}>Estados de envío (RF-CR-17): </strong>
                    En preparación → Enviado → Entregado
                  </div>
                </div>
              )}

              {/* RF-CR-18: Tiendas en Pereira con disponibilidad */}
              {delivery === "pickup" && (
                <div className="space-y-2 mt-2">
                  <p className="text-sm font-medium mb-2" style={{ color: "#4A3728" }}>
                    Tiendas disponibles en Pereira (RF-CR-18, RF-CR-19)
                  </p>
                  {STORES.map(store => (
                    <div key={store.id} onClick={() => setSelectedStore(store.id)}
                      className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all"
                      style={selectedStore === store.id ? { borderColor: "#4A3728", background: "rgba(74,55,40,0.04)" } : { borderColor: "#E8C99A" }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "#F0EBD8" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16" style={{ color: "#606C38" }}>
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: "#4A3728" }}>{store.name}</p>
                        <p className="text-xs" style={{ color: "#6B5344", opacity: 0.75 }}>{store.address}</p>
                        <p className="text-xs font-medium" style={{ color: "#606C38" }}>📍 {store.distance}</p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                        style={{ background: "rgba(96,108,56,0.1)", color: "#606C38" }}>
                        ✓ Con stock
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Payment ── */}
          {step === 2 && (
            <div>
              {/* CU-CR-003 Alterno A: Pago rechazado */}
              {paymentError === "rejected" && (
                <div className="rounded-xl p-4 mb-4 flex items-start gap-3"
                  style={{ background: "rgba(192,57,43,0.08)", border: "1.5px solid #C0392B" }}>
                  <span className="text-base">❌</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#C0392B" }}>Pago no autorizado</p>
                    <p className="text-xs mt-0.5" style={{ color: "#C0392B" }}>
                      El sistema financiero rechazó el pago. Verifica los datos de tu tarjeta e intenta de nuevo.
                    </p>
                  </div>
                </div>
              )}
              {/* CU-CR-003 Alterno B: Saldo insuficiente */}
              {paymentError === "insufficient" && (
                <div className="rounded-xl p-4 mb-4 flex items-start gap-3"
                  style={{ background: "rgba(192,57,43,0.08)", border: "1.5px solid #C0392B" }}>
                  <span className="text-base">💳</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#C0392B" }}>Saldo insuficiente</p>
                    <p className="text-xs mt-0.5" style={{ color: "#C0392B" }}>
                      No tienes saldo suficiente para completar esta compra. Usa otro medio de pago.
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-xl p-5 mb-5 relative overflow-hidden"
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

              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  ["Número de tarjeta", "•••• •••• •••• 4521", "text"],
                  ["Titular", "Juan Carlos Pérez", "text"],
                  ["Vencimiento (MM/AA)", "12/27", "text"],
                  ["CVV", "", "password"],
                ].map(([label, val, type]) => (
                  <div key={label}>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#4A3728" }}>{label}</label>
                    <input defaultValue={val} type={type as string}
                      maxLength={label === "CVV" ? 3 : undefined}
                      placeholder={label === "CVV" ? "•••" : ""}
                      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                      style={{ border: `1.5px solid ${paymentError ? "#C0392B" : "#E8C99A"}`, background: "#FEFAE0", color: "#4A3728" }} />
                  </div>
                ))}
              </div>

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

          {/* ── STEP 3: Success ── */}
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
                Pedido registrado con estado <strong>EN PREPARACIÓN</strong> (RF-CR-17)
              </p>
              <div className="rounded-xl p-5 text-left mb-5" style={{ background: "#F5EDD3" }}>
                {[
                  ["N° de pedido", orderId],
                  ["Método", delivery === "shipping" ? "Envío a domicilio" : "Recogida en tienda"],
                  [delivery === "shipping" ? "Dirección" : "Tienda",
                    delivery === "shipping" ? `${address}, ${city}` : STORES.find(s => s.id === selectedStore)?.name || "—"],
                  ["Total pagado", fmt(total)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm mb-2 last:mb-0 last:pt-3 last:border-t last:font-bold"
                    style={{ borderColor: "#E8C99A", color: "#4A3728" }}>
                    <span style={{ color: "#6B5344" }}>{k}</span>
                    <span style={{ fontFamily: k === "Total pagado" ? "'Playfair Display', serif" : undefined,
                      fontSize: k === "Total pagado" ? 16 : undefined, maxWidth: 200, textAlign: "right" }}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs" style={{ color: "#6B5344" }}>
                Confirmación enviada a <strong>juan.perez@correo.com</strong>
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
              <button onClick={handleStep2Next} disabled={processing}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: "#4A3728", color: "#FEFAE0" }}>
                {processing
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Procesando…</>
                  : paymentError ? "Reintentar pago" : "Confirmar pedido →"}
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
