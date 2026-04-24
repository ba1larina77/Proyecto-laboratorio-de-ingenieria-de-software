import { useEffect, useState } from "react";
import { useShop, fmt, MAX_DIFFERENT_BOOKS, MAX_SAME_BOOK_COPIES, RESERVATION_HOURS } from "../../store/ShopContext";
import type { Reservation } from "../../store/shopTypes";

function useCountdown(expiresAt: Date) {
  const [diff, setDiff] = useState(expiresAt.getTime() - Date.now());
  useEffect(() => {
    const t = setInterval(() => setDiff(expiresAt.getTime() - Date.now()), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  return diff;
}

function CountdownTimer({ res, onExpire }: { res: Reservation; onExpire: (id: string) => void }) {
  const diff = useCountdown(res.expiresAt);
  useEffect(() => { if (diff <= 0) onExpire(res.id); }, [diff, res.id, onExpire]);
  if (diff <= 0) return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: "rgba(192,57,43,0.1)", color: "#C0392B" }}>
      Expirada — liberada automáticamente (RF-CR-06)
    </span>
  );
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const isSafe = diff > 10 * 3600000;
  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
      style={{ background: isSafe ? "rgba(96,108,56,0.1)" : "rgba(192,57,43,0.1)", color: isSafe ? "#606C38" : "#C0392B" }}>
      ⏱ {h}h {String(m).padStart(2, "0")}m {String(s).padStart(2, "0")}s restantes
    </span>
  );
}

export function Reservations() {
  const { reservations, cancelReservation, convertReservationToCart, expireReservation } = useShop();
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);
  const active = reservations.filter(r => r.status === "active");
  const differentBooks = new Set(active.map(r => r.bookId)).size;

  function handleCancelConfirm(id: string) {
    cancelReservation(id);
    setCancelConfirm(null);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-4 justify-between items-start mb-7">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
            Mis reservas
          </h1>
          <p className="text-sm" style={{ color: "#6B5344", opacity: 0.8 }}>
            RF-CR-05: Vigencia {RESERVATION_HOURS}h · RF-CR-03: Máx. {MAX_DIFFERENT_BOOKS} libros diferentes · RF-CR-04: Máx. {MAX_SAME_BOOK_COPIES} ejemplares del mismo título
          </p>
        </div>

        {/* Límites visibles */}
        <div className="flex gap-6 rounded-xl px-5 py-3.5" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(74,55,40,0.10)" }}>
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: "#6B5344" }}>Títulos activos</p>
            <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: differentBooks >= MAX_DIFFERENT_BOOKS ? "#C0392B" : "#4A3728" }}>
              {differentBooks}
            </p>
            <p className="text-xs" style={{ color: "#6B5344" }}>de {MAX_DIFFERENT_BOOKS} permitidos</p>
          </div>
          <div className="w-px" style={{ background: "#EDE0C4" }} />
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: "#6B5344" }}>Total reservas</p>
            <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
              {active.length}
            </p>
          </div>
        </div>
      </div>

      {/* Alerta de límite */}
      {differentBooks >= MAX_DIFFERENT_BOOKS && (
        <div className="rounded-xl p-4 mb-5 flex items-start gap-3"
          style={{ background: "rgba(192,57,43,0.08)", border: "1.5px solid #C0392B" }}>
          <span className="text-base flex-shrink-0">⚠️</span>
          <p className="text-sm" style={{ color: "#C0392B" }}>
            <strong>Límite alcanzado (RF-CR-03):</strong> Has reservado el máximo de {MAX_DIFFERENT_BOOKS} libros diferentes.
            Cancela una reserva para poder agregar nuevos títulos.
          </p>
        </div>
      )}

      {active.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"
            className="mx-auto mb-3" style={{ color: "#D4A373" }}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <p className="text-sm font-medium mb-1" style={{ color: "#4A3728" }}>No tienes reservas activas</p>
          <p className="text-xs" style={{ color: "#6B5344", opacity: 0.7 }}>Puedes reservar hasta {MAX_DIFFERENT_BOOKS} libros diferentes simultáneamente</p>
        </div>
      ) : (
        <div className="space-y-4">
          {active.map(res => (
            <div key={res.id} className="flex gap-5 rounded-2xl p-5 transition-all hover:shadow-md"
              style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.08)", borderLeft: "4px solid #D4A373" }}>
              <div className="w-20 h-28 rounded-xl overflow-hidden flex-shrink-0">
                <img src={res.book.cover} alt={res.book.title} className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=450&fit=crop"; }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base mb-0.5 leading-tight"
                  style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
                  {res.book.title}
                </h3>
                <p className="text-xs mb-3" style={{ color: "#6B5344", opacity: 0.75 }}>{res.book.author}</p>
                <div className="flex flex-wrap gap-2 items-center mb-3">
                  <span className="text-xs flex items-center gap-1" style={{ color: "#6B5344" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                    </svg>
                    Reservado: {res.createdAt.toLocaleDateString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(212,163,115,0.2)", color: "#4A3728" }}>
                    {res.book.category}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <CountdownTimer res={res} onExpire={expireReservation} />
                  <span className="font-bold" style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#4A3728" }}>
                    {fmt(res.book.price)}
                  </span>
                </div>

                {/* CU-CR-002 Alterno D: confirmación de cancelación */}
                {cancelConfirm === res.id ? (
                  <div className="rounded-xl p-3 mb-2" style={{ background: "rgba(192,57,43,0.06)", border: "1.5px solid #C0392B" }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: "#C0392B" }}>
                      ¿Confirmas la cancelación de esta reserva?
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => handleCancelConfirm(res.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                        style={{ background: "#C0392B", color: "#fff" }}>
                        Sí, cancelar
                      </button>
                      <button onClick={() => setCancelConfirm(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:opacity-80"
                        style={{ borderColor: "#D4A373", color: "#4A3728" }}>
                        No, mantener
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => convertReservationToCart(res.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                      style={{ background: "#4A3728", color: "#FEFAE0" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                      </svg>
                      Comprar ahora
                    </button>
                    <button onClick={() => setCancelConfirm(res.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all hover:opacity-80"
                      style={{ borderColor: "#C0392B", color: "#C0392B" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6 6 18M6 6l12 12"/>
                      </svg>
                      Cancelar reserva
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
