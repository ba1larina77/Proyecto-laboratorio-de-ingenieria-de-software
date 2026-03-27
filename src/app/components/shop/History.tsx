import { useState } from "react";
import { useShop, fmt, MAX_DIFFERENT_BOOKS } from "../../store/ShopContext";
import type { Purchase } from "../../store/shopTypes";
import { ReturnModal } from "./ReturnModal";

const STATUS_LABELS: Record<string, string> = { delivered: "Entregado", transit: "En camino", preparing: "En preparación", cancelled: "Cancelado", returned: "Devuelto", active: "Activa", expired: "Expirada" };
const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  delivered: { bg: "rgba(96,108,56,0.12)", color: "#606C38" },
  transit: { bg: "rgba(41,128,185,0.12)", color: "#2980B9" },
  preparing: { bg: "rgba(212,163,115,0.2)", color: "#8B6914" },
  cancelled: { bg: "rgba(192,57,43,0.1)", color: "#C0392B" },
  returned: { bg: "rgba(41,128,185,0.12)", color: "#2980B9" },
  expired: { bg: "rgba(192,57,43,0.1)", color: "#C0392B" },
  active: { bg: "rgba(96,108,56,0.12)", color: "#606C38" },
};

type HistoryTab = "purchases" | "reservations" | "cancellations";

function OrderDetailModal({ purchase, onClose, onReturn, onCancel }: { purchase: Purchase | null; onClose: () => void; onReturn: (p: Purchase) => void; onCancel: (id: string) => void; }) {
  if (!purchase) return null;
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4" style={{ background: "rgba(74,55,40,0.5)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl overflow-y-auto" style={{ background: "#fff", maxHeight: "90vh", boxShadow: "0 24px 80px rgba(74,55,40,0.3)" }}>
        <div className="flex items-center justify-between px-7 pt-6">
          <h3 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>Detalle del pedido</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70" style={{ background: "#F5EDD3", color: "#4A3728" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="px-7 py-5 space-y-5">
          {/* ID + status */}
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div><p className="text-xs" style={{ color: "#6B5344" }}>Pedido</p>
              <p className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>{purchase.id}</p></div>
            <span className="text-sm font-semibold px-3 py-1.5 rounded-lg" style={{ ...(STATUS_STYLES[purchase.status] || {}) }}>{STATUS_LABELS[purchase.status] || purchase.status}</span>
          </div>
          {/* Method + address */}
          <div className="grid grid-cols-2 gap-3">
            {[
              ["MÉTODO", purchase.delivery === "shipping" ? "🚚 Envío a domicilio" : "🏪 Recogida en tienda"],
              [purchase.delivery === "shipping" ? "DIRECCIÓN" : "TIENDA", purchase.address || purchase.store || "—"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl p-3" style={{ background: "#F5EDD3" }}>
                <p className="text-xs mb-1" style={{ color: "#6B5344" }}>{k}</p>
                <p className="text-sm font-semibold" style={{ color: "#4A3728" }}>{v}</p>
              </div>
            ))}
          </div>
          {/* Items */}
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: "#4A3728" }}>Artículos</p>
            {purchase.items.map((item, i) => (
              <div key={i} className="flex gap-3 items-center py-2.5 border-b" style={{ borderColor: "#F5EDD3" }}>
                <img src={item.book.cover} className="w-10 h-14 rounded-lg object-cover flex-shrink-0"
                  onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=450&fit=crop"; }} />
                <div className="flex-1"><p className="text-sm font-semibold" style={{ color: "#4A3728" }}>{item.book.title}</p>
                  <p className="text-xs" style={{ color: "#6B5344" }}>{item.book.author} · ×{item.qty}</p></div>
                <p className="font-bold" style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: "#4A3728" }}>{fmt(item.price * item.qty)}</p>
              </div>
            ))}
            <div className="flex justify-between pt-3 font-bold text-sm" style={{ color: "#4A3728" }}>
              <span>Total</span><span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16 }}>{fmt(purchase.total)}</span>
            </div>
          </div>
          {/* Tracking */}
          <div>
            <p className="text-sm font-semibold mb-4" style={{ color: "#4A3728" }}>Estado del envío</p>
            <div className="relative pl-7">
              <div className="absolute left-2.5 top-2 bottom-2 w-0.5" style={{ background: "#EDE0C4" }} />
              {purchase.tracking.map((step, i) => {
                const isActive = !step.done && purchase.tracking.findIndex(s => !s.done) === i;
                return (
                  <div key={i} className="flex gap-4 mb-5 last:mb-0 relative">
                    <div className="absolute -left-7 top-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: step.done ? "#606C38" : isActive ? "#4A3728" : "#EDE0C4", boxShadow: isActive ? "0 0 0 4px rgba(74,55,40,0.1)" : undefined }}>
                      {step.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>}
                    </div>
                    <div><p className="text-sm font-semibold" style={{ color: "#4A3728" }}>{step.status}</p>
                      <p className="text-xs" style={{ color: "#6B5344" }}>{step.date || "Pendiente"}</p></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-7 pb-6">
          {purchase.status === "delivered" && (
            <button onClick={() => { onClose(); onReturn(purchase); }} className="px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:opacity-80" style={{ borderColor: "#C0392B", color: "#C0392B" }}>Solicitar devolución</button>
          )}
          {purchase.status === "preparing" && (
            <button onClick={() => { onClose(); onCancel(purchase.id); }} className="px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:opacity-80" style={{ borderColor: "#C0392B", color: "#C0392B" }}>Cancelar pedido</button>
          )}
          <button onClick={onClose} className="ml-auto px-5 py-2.5 rounded-xl text-sm font-medium border hover:opacity-80" style={{ borderColor: "#D4A373", color: "#4A3728" }}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || { bg: "#f0f0f0", color: "#666" };
  return <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: s.bg, color: s.color }}>{STATUS_LABELS[status] || status}</span>;
}

export function History() {
  const { purchases, reservationHistory, cancellations, cancelOrder } = useShop();
  const [tab, setTab] = useState<HistoryTab>("purchases");
  const [detailPurchase, setDetailPurchase] = useState<Purchase | null>(null);
  const [returnPurchase, setReturnPurchase] = useState<Purchase | null>(null);

  const totalSpent = purchases.reduce((s, p) => s + p.total, 0);

  const TABS: { key: HistoryTab; label: string }[] = [
    { key: "purchases", label: "Compras" },
    { key: "reservations", label: "Reservas" },
    { key: "cancellations", label: "Cancelaciones" },
  ];

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>Historial</h1>
        <p className="text-sm" style={{ color: "#6B5344", opacity: 0.8 }}>Compras, reservas y cancelaciones registradas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total compras", value: purchases.length, sub: "pedidos", accent: "#D4A373" },
          { label: "Total gastado", value: fmt(totalSpent).replace("COP", "$"), sub: "en libros", accent: "#606C38" },
          { label: "Reservas activas", value: `${reservationHistory.length}`, sub: `de ${MAX_DIFFERENT_BOOKS} permitidas`, accent: "#6B5344" },
          { label: "Cancelaciones", value: cancellations.length, sub: "históricas", accent: "#C0392B" },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl p-5" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(74,55,40,0.08)", borderLeft: `3px solid ${stat.accent}` }}>
            <p className="text-xs font-medium mb-1.5" style={{ color: "#6B5344" }}>{stat.label}</p>
            <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: "#6B5344", opacity: 0.7 }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-5 py-2 rounded-full text-sm font-semibold border transition-all"
            style={tab === t.key ? { background: "#4A3728", borderColor: "#4A3728", color: "#FEFAE0" } : { background: "#fff", borderColor: "#E8C99A", color: "#6B5344" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Purchases */}
      {tab === "purchases" && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}>
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#F5EDD3" }}>
            <h4 className="font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>Historial de compras</h4>
            <span className="text-sm" style={{ color: "#6B5344" }}>{purchases.length} pedido{purchases.length !== 1 ? "s" : ""}</span>
          </div>
          {purchases.length === 0 ? (
            <div className="text-center py-12" style={{ color: "#6B5344", opacity: 0.6 }}><p>Sin compras aún</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr style={{ borderBottom: "2px solid #F5EDD3" }}>
                  {["Pedido", "Fecha", "Libros", "Total", "Entrega", "Estado", "Acciones"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold whitespace-nowrap" style={{ color: "#6B5344" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {purchases.map(p => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-stone-50 transition-colors" style={{ borderColor: "#F5EDD3" }}>
                      <td className="px-5 py-4 text-sm font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>{p.id}</td>
                      <td className="px-5 py-4 text-xs whitespace-nowrap" style={{ color: "#6B5344" }}>{p.date.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="px-5 py-4">
                        {p.items.map((item, i) => <div key={i} className="text-xs truncate max-w-36" style={{ color: "#6B5344" }}>{item.book.title} ×{item.qty}</div>)}
                      </td>
                      <td className="px-5 py-4 text-sm font-bold whitespace-nowrap" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>{fmt(p.total)}</td>
                      <td className="px-5 py-4 text-xs whitespace-nowrap" style={{ color: "#6B5344" }}>{p.delivery === "shipping" ? "🚚 Domicilio" : "🏪 Tienda"}</td>
                      <td className="px-5 py-4"><StatusPill status={p.status} /></td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5">
                          <button onClick={() => setDetailPurchase(p)} className="px-2.5 py-1 rounded-lg text-xs font-medium border hover:opacity-70 transition-opacity" style={{ borderColor: "#D4A373", color: "#4A3728" }}>Ver</button>
                          {p.status === "delivered" && <button onClick={() => setReturnPurchase(p)} className="px-2.5 py-1 rounded-lg text-xs font-medium border hover:opacity-70 transition-opacity" style={{ borderColor: "#C0392B", color: "#C0392B" }}>Dev.</button>}
                          {p.status === "preparing" && <button onClick={() => cancelOrder(p.id)} className="px-2.5 py-1 rounded-lg text-xs font-medium border hover:opacity-70 transition-opacity" style={{ borderColor: "#C0392B", color: "#C0392B" }}>Cancelar</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Reservation history */}
      {tab === "reservations" && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: "#F5EDD3" }}>
            <h4 className="font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>Historial de reservas</h4>
          </div>
          {reservationHistory.length === 0 ? (
            <div className="text-center py-12" style={{ color: "#6B5344", opacity: 0.6 }}><p>Sin historial de reservas</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr style={{ borderBottom: "2px solid #F5EDD3" }}>
                  {["ID", "Libro", "Fecha", "Estado"].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B5344" }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {reservationHistory.map(r => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-stone-50 transition-colors" style={{ borderColor: "#F5EDD3" }}>
                      <td className="px-5 py-4 text-sm font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>{r.id}</td>
                      <td className="px-5 py-4"><p className="text-sm font-semibold" style={{ color: "#4A3728" }}>{r.book.title}</p><p className="text-xs" style={{ color: "#6B5344" }}>{r.book.author}</p></td>
                      <td className="px-5 py-4 text-xs whitespace-nowrap" style={{ color: "#6B5344" }}>{r.date.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="px-5 py-4"><StatusPill status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Cancellations */}
      {tab === "cancellations" && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: "#F5EDD3" }}>
            <h4 className="font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>Historial de cancelaciones</h4>
          </div>
          {cancellations.length === 0 ? (
            <div className="text-center py-12" style={{ color: "#6B5344", opacity: 0.6 }}><p>Sin cancelaciones registradas</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr style={{ borderBottom: "2px solid #F5EDD3" }}>
                  {["ID", "Tipo", "Libro", "Fecha", "Motivo", "Reembolso"].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#6B5344" }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {cancellations.map(c => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-stone-50 transition-colors" style={{ borderColor: "#F5EDD3" }}>
                      <td className="px-5 py-4 text-sm font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>{c.id}</td>
                      <td className="px-5 py-4"><span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: "rgba(41,128,185,0.1)", color: "#2980B9" }}>{c.type === "purchase" ? "Compra" : "Reserva"}</span></td>
                      <td className="px-5 py-4 text-sm font-semibold" style={{ color: "#4A3728" }}>{c.book.title}</td>
                      <td className="px-5 py-4 text-xs whitespace-nowrap" style={{ color: "#6B5344" }}>{c.date.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="px-5 py-4 text-xs max-w-36" style={{ color: "#6B5344" }}>{c.reason || "—"}</td>
                      <td className="px-5 py-4 text-sm font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>{c.refund ? fmt(c.refund) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <OrderDetailModal purchase={detailPurchase} onClose={() => setDetailPurchase(null)} onReturn={p => { setDetailPurchase(null); setReturnPurchase(p); }} onCancel={id => { cancelOrder(id); setDetailPurchase(null); }} />
      <ReturnModal purchase={returnPurchase} onClose={() => setReturnPurchase(null)} />
    </div>
  );
}
