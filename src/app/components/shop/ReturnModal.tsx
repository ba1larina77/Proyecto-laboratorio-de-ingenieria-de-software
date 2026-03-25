import { useState } from "react";
import { useShop, fmt } from "../../store/ShopContext";
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
  const { returnOrder } = useShop();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [step, setStep] = useState<"form" | "qr">("form");
  const [qrCode, setQrCode] = useState("");
  const [qrCells] = useState(generateQRPattern);
  const [processing, setProcessing] = useState(false);

  if (!purchase) return null;

  function handleSubmit() {
    if (!reason) { alert("Selecciona un motivo de devolución"); return; }
    setProcessing(true);
    setTimeout(() => {
      const code = "DEV-" + Math.random().toString(36).substring(2, 10).toUpperCase();
      setQrCode(code);
      returnOrder(purchase!.id, reason, code);
      setProcessing(false);
      setStep("qr");
    }, 1000);
  }

  function handleClose() {
    setReason(""); setDescription(""); setStep("form"); setProcessing(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4" style={{ background: "rgba(74,55,40,0.5)" }}
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="w-full max-w-md rounded-2xl overflow-y-auto" style={{ background: "#fff", maxHeight: "90vh", boxShadow: "0 24px 80px rgba(74,55,40,0.3)" }}>

        <div className="flex items-center justify-between px-7 pt-6 pb-0">
          <h3 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
            {step === "form" ? "Solicitar devolución" : "Devolución aprobada"}
          </h3>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70" style={{ background: "#F5EDD3", color: "#4A3728" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="px-7 py-5">
          {step === "form" ? (
            <>
              {/* Book summary */}
              <div className="flex gap-3 items-center rounded-xl p-3 mb-5" style={{ background: "#F5EDD3" }}>
                <img src={purchase.items[0].book.cover} alt={purchase.items[0].book.title} className="w-12 h-16 rounded-lg object-cover flex-shrink-0"
                  onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=450&fit=crop"; }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#4A3728" }}>{purchase.items[0].book.title}</p>
                  <p className="text-xs mb-1" style={{ color: "#6B5344", opacity: 0.75 }}>{purchase.items[0].book.author}</p>
                  <p className="font-bold" style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: "#4A3728" }}>{fmt(purchase.total)}</p>
                </div>
              </div>

              {/* Reason selection */}
              <p className="text-sm font-medium mb-3" style={{ color: "#4A3728" }}>Motivo de devolución</p>
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

              {reason && (
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#4A3728" }}>Descripción adicional (opcional)</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Describe con más detalle el motivo de tu devolución…"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                    style={{ border: "1.5px solid #E8C99A", background: "#FEFAE0", color: "#4A3728", minHeight: 80 }} />
                </div>
              )}
            </>
          ) : (
            /* QR Step */
            <div className="text-center py-2">
              <p className="text-sm font-medium mb-5" style={{ color: "#4A3728" }}>Muestra este código en tienda para completar tu devolución</p>
              <div className="w-44 h-44 mx-auto rounded-xl flex items-center justify-center mb-4 p-3" style={{ border: "3px solid #4A3728", background: "#fff" }}>
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
              <p className="text-lg font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>{qrCode}</p>
              <div className="rounded-xl p-4 text-left" style={{ background: "#F5EDD3" }}>
                <p className="text-xs mb-1" style={{ color: "#6B5344" }}>Motivo registrado: <span className="font-semibold" style={{ color: "#4A3728" }}>{reason}</span></p>
                <p className="text-xs" style={{ color: "#6B5344" }}>Válido por 7 días · Reembolso de <strong style={{ fontFamily: "'Playfair Display', serif" }}>{fmt(purchase.total)}</strong> en 3-5 días hábiles</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-7 pb-6">
          {step === "form" ? (
            <>
              <button onClick={handleClose} className="px-5 py-2.5 rounded-xl text-sm font-medium border transition-all hover:opacity-80" style={{ borderColor: "#D4A373", color: "#4A3728" }}>Cancelar</button>
              <button onClick={handleSubmit} disabled={processing || !reason}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: "#C0392B", color: "#fff" }}>
                {processing ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Procesando…</> : "Solicitar devolución"}
              </button>
            </>
          ) : (
            <button onClick={handleClose} className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90" style={{ background: "#4A3728", color: "#FEFAE0" }}>
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
