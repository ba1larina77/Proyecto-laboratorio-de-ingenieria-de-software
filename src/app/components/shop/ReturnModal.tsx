import { useState } from "react";
import { useShop, fmt, RETURN_DAYS_LIMIT } from "../../store/ShopContext";
import type { Purchase } from "../../store/shopTypes";

const RETURN_REASONS = [
  "Producto defectuoso",
  "No era lo esperado",
  "Pedí por error",
  "Llegó dañado",
  "Mejor precio encontrado",
  "Otro motivo",
];

interface ReturnModalProps {
  purchase: Purchase | null;
  onClose: () => void;
}

function generateQRPattern() {
  const size = 13;
  const cells: { x: number; y: number; filled: boolean }[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inCorner = (r < 3 && c < 3) || (r < 3 && c >= size - 3) || (r >= size - 3 && c < 3);
      const center = Math.abs(r - 6) + Math.abs(c - 6) < 4 && (r + c) % 2 === 0;
      cells.push({ x: c * 10, y: r * 10, filled: inCorner || center || Math.random() > 0.52 });
    }
  }
  return cells;
}

export function ReturnModal({ purchase, onClose }: ReturnModalProps) {
  const { returnOrder, showToast } = useShop();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [conditionsAccepted, setConditionsAccepted] = useState(false);
  const [step, setStep] = useState<"conditions" | "form" | "qr">("conditions");
  const [qrCode, setQrCode] = useState("");
  const [qrCells] = useState(generateQRPattern);
  const [processing, setProcessing] = useState(false);

  if (!purchase) return null;

  // RF-CR-12: Verificar plazo de 8 días
  const deliveredDate = purchase.deliveredAt || purchase.date;
  const daysSinceDelivery = Math.floor((Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = RETURN_DAYS_LIMIT - daysSinceDelivery;
  const isEligible = purchase.status === "delivered" && daysRemaining >= 0;

  function handleClose() {
    setReason(""); setDescription(""); setStep("conditions");
    setConditionsAccepted(false); setProcessing(false);
    onClose();
  }

  // CU-CR-005 Alterno B: usuario no acepta condiciones
  function handleAcceptConditions() {
    if (!conditionsAccepted) {
      showToast("Debes aceptar las condiciones para continuar", "error");
      return;
    }
    setStep("form");
  }

  // RF-CR-13, RF-CR-14: Motivo y descripción extendida
  function handleSubmit() {
    if (!reason) { showToast("Selecciona un motivo de devolución (RF-CR-13)", "error"); return; }
    setProcessing(true);
    setTimeout(() => {
      const code = "DEV-" + Math.random().toString(36).substring(2, 10).toUpperCase();
      setQrCode(code);
      returnOrder(purchase!.id, reason, description, code);
      setProcessing(false);
      setStep("qr");
    }, 1000);
  }

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4"
      style={{ background: "rgba(74,55,40,0.5)" }}
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="w-full max-w-md rounded-2xl overflow-y-auto"
        style={{ background: "#fff", maxHeight: "90vh", boxShadow: "0 24px 80px rgba(74,55,40,0.3)" }}>

        <div className="flex items-center justify-between px-7 pt-6 pb-0">
          <h3 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
            {step === "conditions" ? "Condiciones de devolución" : step === "form" ? "Solicitar devolución" : "Devolución aprobada"}
          </h3>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70"
            style={{ background: "#F5EDD3", color: "#4A3728" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="px-7 py-5">

          {/* CU-CR-005: Compra fuera del plazo */}
          {!isEligible && (
            <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(192,57,43,0.08)", border: "1.5px solid #C0392B" }}>
              <p className="text-sm font-semibold mb-1" style={{ color: "#C0392B" }}>
                ⚠️ Fuera del plazo de devolución
              </p>
              <p className="text-xs" style={{ color: "#C0392B" }}>
                El plazo de {RETURN_DAYS_LIMIT} días para solicitar devoluciones ha vencido (RF-CR-12).
                Han pasado {daysSinceDelivery} días desde la entrega.
              </p>
            </div>
          )}

          {/* Book summary */}
          <div className="flex gap-3 items-center rounded-xl p-3 mb-4" style={{ background: "#F5EDD3" }}>
            <img src={purchase.items[0].book.cover} alt={purchase.items[0].book.title}
              className="w-12 h-16 rounded-lg object-cover flex-shrink-0"
              onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=450&fit=crop"; }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "#4A3728" }}>{purchase.items[0].book.title}</p>
              <p className="text-xs mb-1" style={{ color: "#6B5344", opacity: 0.75 }}>{purchase.items[0].book.author}</p>
              <p className="font-bold" style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: "#4A3728" }}>
                {fmt(purchase.total)}
              </p>
            </div>
            {isEligible && (
              <div className="ml-auto text-right flex-shrink-0">
                <p className="text-xs font-semibold" style={{ color: daysRemaining <= 2 ? "#C0392B" : "#606C38" }}>
                  {daysRemaining} días restantes
                </p>
                <p className="text-xs" style={{ color: "#6B5344" }}>para devolver</p>
              </div>
            )}
          </div>

          {/* Step: Conditions (CU-CR-005 paso 6-7) */}
          {step === "conditions" && isEligible && (
            <>
              <p className="text-sm font-semibold mb-3" style={{ color: "#4A3728" }}>Condiciones de devolución</p>
              <div className="rounded-xl p-4 mb-4 space-y-2" style={{ background: "#F5EDD3", border: "1px solid #E8C99A" }}>
                {[
                  `Plazo máximo de ${RETURN_DAYS_LIMIT} días desde la recepción del producto`,
                  "El libro debe estar en las mismas condiciones en que fue recibido",
                  "Se debe incluir el embalaje original cuando sea posible",
                  "El reembolso se procesa en 3-5 días hábiles tras verificación",
                  "Se generará un código QR que debes presentar en tienda o al courier",
                  "Solo se permite una solicitud de devolución por compra",
                ].map((c, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs mt-0.5 flex-shrink-0" style={{ color: "#606C38" }}>✓</span>
                    <p className="text-xs" style={{ color: "#4A3728" }}>{c}</p>
                  </div>
                ))}
              </div>
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border transition-all"
                style={conditionsAccepted ? { borderColor: "#4A3728", background: "rgba(74,55,40,0.04)" } : { borderColor: "#E8C99A" }}>
                <input type="checkbox" checked={conditionsAccepted}
                  onChange={e => setConditionsAccepted(e.target.checked)}
                  className="mt-0.5 flex-shrink-0" style={{ accentColor: "#4A3728" }} />
                <span className="text-sm" style={{ color: "#4A3728" }}>
                  He leído y acepto las condiciones de devolución
                </span>
              </label>
            </>
          )}

          {/* Step: Form (RF-CR-13, RF-CR-14) */}
          {step === "form" && (
            <>
              <p className="text-sm font-semibold mb-3" style={{ color: "#4A3728" }}>Motivo de devolución *</p>
              <div className="space-y-2 mb-4">
                {RETURN_REASONS.map(r => (
                  <div key={r} onClick={() => setReason(r)}
                    className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all"
                    style={reason === r ? { borderColor: "#4A3728", background: "rgba(74,55,40,0.04)" } : { borderColor: "#E8C99A" }}>
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: reason === r ? "#4A3728" : "#D4A373" }}>
                      {reason === r && <div className="w-2 h-2 rounded-full" style={{ background: "#4A3728" }} />}
                    </div>
                    <span className="text-sm" style={{ color: "#4A3728" }}>{r}</span>
                  </div>
                ))}
              </div>
              {/* RF-CR-14: Campo de texto extendido */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#4A3728" }}>
                  Descripción adicional <span style={{ color: "#6B5344", fontWeight: 400 }}>(opcional)</span>
                </label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Describe con más detalle el motivo de tu devolución…"
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{ border: "1.5px solid #E8C99A", background: "#FEFAE0", color: "#4A3728", minHeight: 80 }} />
                <p className="text-xs mt-1 text-right" style={{ color: "#6B5344" }}>{description.length}/500</p>
              </div>
            </>
          )}

          {/* Step: QR (RF-CR-15) */}
          {step === "qr" && (
            <div className="text-center py-2">
              <p className="text-sm font-medium mb-4" style={{ color: "#4A3728" }}>
                Tu código QR ha sido generado — preséntalo en tienda o al courier
              </p>
              <div className="w-44 h-44 mx-auto rounded-xl flex items-center justify-center mb-4 p-3"
                style={{ border: "3px solid #4A3728", background: "#fff" }}>
                <svg width="140" height="140" viewBox="0 0 130 130" xmlns="http://www.w3.org/2000/svg">
                  {qrCells.map((cell, i) => cell.filled && (
                    <rect key={i} x={cell.x} y={cell.y} width="9" height="9" fill="#4A3728" />
                  ))}
                  <rect x="0" y="0" width="30" height="30" fill="none" stroke="#4A3728" strokeWidth="3"/>
                  <rect x="100" y="0" width="30" height="30" fill="none" stroke="#4A3728" strokeWidth="3"/>
                  <rect x="0" y="100" width="30" height="30" fill="none" stroke="#4A3728" strokeWidth="3"/>
                </svg>
              </div>
              <p className="text-xs mb-1" style={{ color: "#6B5344" }}>Código de devolución</p>
              <p className="text-lg font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>{qrCode}</p>
              <p className="text-xs mb-4" style={{ color: "#6B5344" }}>Motivo: <strong style={{ color: "#4A3728" }}>{reason}</strong></p>
              <div className="rounded-xl p-4 text-left" style={{ background: "#F5EDD3" }}>
                <p className="text-xs mb-1" style={{ color: "#6B5344" }}>
                  ✓ Código enviado a <strong>juan.perez@correo.com</strong> (RF-CR-15)
                </p>
                <p className="text-xs" style={{ color: "#6B5344" }}>
                  Válido 7 días · Reembolso de{" "}
                  <strong style={{ fontFamily: "'Playfair Display', serif" }}>{fmt(purchase.total)}</strong>{" "}
                  en 3-5 días hábiles
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-7 pb-6">
          {step === "conditions" && (
            <>
              <button onClick={handleClose}
                className="px-5 py-2.5 rounded-xl text-sm font-medium border transition-all hover:opacity-80"
                style={{ borderColor: "#D4A373", color: "#4A3728" }}>
                Cancelar
              </button>
              {isEligible && (
                <button onClick={handleAcceptConditions}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: "#4A3728", color: "#FEFAE0" }}>
                  Continuar →
                </button>
              )}
              {!isEligible && (
                <button onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: "#4A3728", color: "#FEFAE0" }}>
                  Entendido
                </button>
              )}
            </>
          )}
          {step === "form" && (
            <>
              <button onClick={() => setStep("conditions")}
                className="px-5 py-2.5 rounded-xl text-sm font-medium border transition-all hover:opacity-80"
                style={{ borderColor: "#D4A373", color: "#4A3728" }}>
                ← Atrás
              </button>
              <button onClick={handleSubmit} disabled={processing || !reason}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: "#C0392B", color: "#fff" }}>
                {processing
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Procesando…</>
                  : "Solicitar devolución"}
              </button>
            </>
          )}
          {step === "qr" && (
            <button onClick={handleClose}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "#4A3728", color: "#FEFAE0" }}>
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
