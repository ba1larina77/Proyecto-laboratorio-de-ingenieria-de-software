import { useState } from "react";
import type { Card, WalletTransaction } from "../../store/shopTypes";

function fmt(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
}

const QUICK_AMOUNTS = [10000, 25000, 50000, 100000];

const INITIAL_CARDS: Card[] = [
  { id: "c1", lastFour: "4521", holder: "JUAN C PÉREZ", expiry: "12/27", type: "credit", network: "visa", isPrimary: true },
  { id: "c2", lastFour: "8834", holder: "JUAN C PÉREZ", expiry: "08/26", type: "debit", network: "mastercard", isPrimary: false },
];

const INITIAL_TXS: WalletTransaction[] = [
  { id: "t1", date: new Date("2024-12-01"), type: "recharge", amount: 50000, description: "Recarga desde tarjeta •4521" },
  { id: "t2", date: new Date("2024-12-03"), type: "purchase", amount: -28900, description: "Cien Años de Soledad" },
  { id: "t3", date: new Date("2024-12-10"), type: "refund", amount: 35000, description: "Reembolso pedido P-2024-002" },
];

function CardVisual({ card, onDelete, onSetPrimary }: { card: Card; onDelete: (id: string) => void; onSetPrimary: (id: string) => void }) {
  const isVisa = card.network === "visa";
  return (
    <div className="relative rounded-2xl p-5 overflow-hidden"
      style={{ background: isVisa ? "linear-gradient(135deg,#4A3728,#6B5344)" : "linear-gradient(135deg,#1a1a2e,#16213e)", color: "#FEFAE0" }}>
      {card.isPrimary && (
        <span className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: "#D4A373", color: "#4A3728" }}>Principal</span>
      )}
      <div className="w-10 h-6 rounded mb-4" style={{ background: "#D4A373" }} />
      <p className="text-lg font-bold mb-4 tracking-widest" style={{ fontFamily: "monospace" }}>
        •••• •••• •••• {card.lastFour}
      </p>
      <div className="flex justify-between items-end">
        <div>
          <p className="text-xs opacity-60 mb-0.5">TITULAR</p>
          <p className="text-sm font-semibold">{card.holder}</p>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-60 mb-0.5">VENCE</p>
          <p className="text-sm font-semibold">{card.expiry}</p>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-60 mb-0.5">TIPO</p>
          <p className="text-xs font-semibold uppercase">{card.type === "credit" ? "Crédito" : "Débito"}</p>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        {!card.isPrimary && (
          <button onClick={() => onSetPrimary(card.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}>
            Hacer principal
          </button>
        )}
        <button onClick={() => onDelete(card.id)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
          style={{ background: "rgba(192,57,43,0.3)", border: "1px solid rgba(192,57,43,0.5)" }}>
          Eliminar
        </button>
      </div>
    </div>
  );
}

export function Wallet() {
  const [tab, setTab] = useState<"overview" | "cards" | "history">("overview");
  const [balance, setBalance] = useState(125800);
  const [cards, setCards] = useState<Card[]>(INITIAL_CARDS);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(INITIAL_TXS);
  const [rechargeAmount, setRechargeAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedCard, setSelectedCard] = useState("c1");
  const [cvv, setCvv] = useState("");
  const [recharging, setRecharging] = useState(false);
  const [rechargeSuccess, setRechargeSuccess] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);

  // New card form
  const [newCard, setNewCard] = useState({ number: "", holder: "", expiry: "", cvv: "", type: "credit" as "credit" | "debit" });
  const [addingCard, setAddingCard] = useState(false);

  function handleRecharge() {
    const amount = rechargeAmount || Number(customAmount.replace(/\D/g, ""));
    if (!amount || amount < 5000) return;
    if (!cvv || cvv.length < 3) return;
    setRecharging(true);
    setTimeout(() => {
      setBalance(prev => prev + amount);
      setTransactions(prev => [{
        id: "t" + Date.now(), date: new Date(), type: "recharge",
        amount, description: `Recarga desde tarjeta •${cards.find(c => c.id === selectedCard)?.lastFour || "****"}`
      }, ...prev]);
      setRechargeAmount(0); setCustomAmount(""); setCvv(""); setRecharging(false); setRechargeSuccess(true);
      setTimeout(() => setRechargeSuccess(false), 3000);
    }, 1500);
  }

  function handleAddCard() {
    if (!newCard.number || !newCard.holder || !newCard.expiry || !newCard.cvv) return;
    setAddingCard(true);
    setTimeout(() => {
      const card: Card = {
        id: "c" + Date.now(),
        lastFour: newCard.number.slice(-4),
        holder: newCard.holder.toUpperCase(),
        expiry: newCard.expiry,
        type: newCard.type,
        network: newCard.number.startsWith("4") ? "visa" : "mastercard",
        isPrimary: cards.length === 0,
      };
      setCards(prev => [...prev, card]);
      setNewCard({ number: "", holder: "", expiry: "", cvv: "", type: "credit" });
      setAddingCard(false); setShowAddCard(false);
    }, 800);
  }

  function handleDeleteCard(id: string) {
    setCards(prev => {
      const next = prev.filter(c => c.id !== id);
      if (next.length > 0 && !next.find(c => c.isPrimary)) {
        next[0].isPrimary = true;
      }
      return next;
    });
  }

  function handleSetPrimary(id: string) {
    setCards(prev => prev.map(c => ({ ...c, isPrimary: c.id === id })));
  }

  const tabs = [
    { key: "overview", label: "Mi Billetera" },
    { key: "cards", label: "Mis Tarjetas" },
    { key: "history", label: "Historial" },
  ] as const;

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
          Gestión Financiera
        </h1>
        <p className="text-sm" style={{ color: "#6B5344", opacity: 0.8 }}>
          M8-HU1: Gestionar tarjetas · M8-HU2: Recargar saldo · M8-HU3: Consultar saldo
        </p>
      </div>

      {/* Balance card - visible siempre (M8-HU3) */}
      <div className="rounded-2xl p-6 mb-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#4A3728 0%,#6B5344 100%)", color: "#FEFAE0" }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
          style={{ background: "#D4A373", transform: "translate(30%,-30%)" }} />
        <p className="text-sm opacity-75 mb-1">Saldo disponible</p>
        <p className="text-4xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
          {fmt(balance)}
        </p>
        <p className="text-xs opacity-60">Actualizado en tiempo real · Juan Carlos Pérez</p>
        {rechargeSuccess && (
          <div className="mt-3 rounded-lg px-3 py-2 text-sm font-semibold"
            style={{ background: "rgba(96,108,56,0.4)", border: "1px solid #606C38" }}>
            ✓ Recarga exitosa — saldo actualizado
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1 mb-6 w-fit" style={{ background: "#F5EDD3" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={tab === t.key ? { background: "#fff", color: "#4A3728", boxShadow: "0 2px 8px rgba(74,55,40,0.12)" } : { color: "#6B5344" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: Overview / Recharge (M8-HU2) */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}>
            <h3 className="font-bold text-base mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
              Recargar saldo
            </h3>
            <p className="text-xs mb-4" style={{ color: "#6B5344" }}>Montos rápidos</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {QUICK_AMOUNTS.map(a => (
                <button key={a} onClick={() => { setRechargeAmount(a); setCustomAmount(""); }}
                  className="py-3 rounded-xl text-sm font-semibold border-2 transition-all"
                  style={rechargeAmount === a ? { borderColor: "#4A3728", background: "rgba(74,55,40,0.04)", color: "#4A3728" } : { borderColor: "#E8C99A", color: "#6B5344" }}>
                  {fmt(a)}
                </button>
              ))}
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>Otro monto</label>
              <input value={customAmount} onChange={e => { setCustomAmount(e.target.value); setRechargeAmount(0); }}
                placeholder="$0" className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: "1.5px solid #E8C99A", background: "#FEFAE0", color: "#4A3728" }} />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>Tarjeta</label>
              <select value={selectedCard} onChange={e => setSelectedCard(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none appearance-none"
                style={{ border: "1.5px solid #E8C99A", background: "#FEFAE0", color: "#4A3728" }}>
                {cards.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.network.toUpperCase()} •{c.lastFour} — {c.type === "credit" ? "Crédito" : "Débito"}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-5">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>CVV *</label>
              <input value={cvv} onChange={e => setCvv(e.target.value.slice(0, 3))}
                placeholder="•••" maxLength={3} type="password"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: "1.5px solid #E8C99A", background: "#FEFAE0", color: "#4A3728" }} />
            </div>
            <button onClick={handleRecharge}
              disabled={recharging || (!rechargeAmount && !customAmount) || !cvv}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all hover:opacity-90"
              style={{ background: "#4A3728", color: "#FEFAE0" }}>
              {recharging
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Procesando…</>
                : `Recargar ${rechargeAmount ? fmt(rechargeAmount) : customAmount ? `$${customAmount}` : ""}`}
            </button>
          </div>

          {/* Recent transactions summary */}
          <div className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}>
            <h3 className="font-bold text-base mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
              Últimas transacciones
            </h3>
            <div className="space-y-3">
              {transactions.slice(0, 5).map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0"
                  style={{ borderColor: "#F5EDD3" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: tx.type === "recharge" ? "rgba(96,108,56,0.12)" : tx.type === "refund" ? "rgba(41,128,185,0.12)" : "rgba(192,57,43,0.12)" }}>
                      <span className="text-base">{tx.type === "recharge" ? "⬆️" : tx.type === "refund" ? "↩️" : "🛒"}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#4A3728" }}>{tx.description}</p>
                      <p className="text-xs" style={{ color: "#6B5344", opacity: 0.7 }}>
                        {tx.date.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-sm flex-shrink-0"
                    style={{ color: tx.amount > 0 ? "#606C38" : "#C0392B", fontFamily: "'Playfair Display', serif" }}>
                    {tx.amount > 0 ? "+" : ""}{fmt(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={() => setTab("history")}
              className="mt-4 text-xs font-medium transition-all hover:opacity-70"
              style={{ color: "#4A3728" }}>
              Ver historial completo →
            </button>
          </div>
        </div>
      )}

      {/* TAB: Cards (M8-HU1) */}
      {tab === "cards" && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {cards.map(card => (
              <CardVisual key={card.id} card={card} onDelete={handleDeleteCard} onSetPrimary={handleSetPrimary} />
            ))}
            <button onClick={() => setShowAddCard(true)}
              className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 min-h-40 transition-all hover:opacity-70"
              style={{ borderColor: "#D4A373", color: "#4A3728" }}>
              <span className="text-3xl">+</span>
              <span className="text-sm font-semibold">Agregar nueva tarjeta</span>
            </button>
          </div>

          {showAddCard && (
            <div className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}>
              <h3 className="font-bold text-base mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
                Agregar tarjeta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {[
                  ["number", "Número de tarjeta", "text", "1234 5678 9012 3456"],
                  ["holder", "Nombre del titular", "text", "Como aparece en la tarjeta"],
                  ["expiry", "Vencimiento (MM/AA)", "text", "12/27"],
                  ["cvv", "CVV", "password", "•••"],
                ].map(([field, label, type, placeholder]) => (
                  <div key={field}>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>{label} *</label>
                    <input value={newCard[field as keyof typeof newCard]}
                      onChange={e => setNewCard(p => ({ ...p, [field]: e.target.value }))}
                      type={type} placeholder={placeholder}
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                      style={{ border: "1.5px solid #E8C99A", background: "#FEFAE0", color: "#4A3728" }} />
                  </div>
                ))}
              </div>
              <div className="mb-5">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>Tipo</label>
                <div className="flex gap-3">
                  {[["credit", "Crédito"], ["debit", "Débito"]].map(([val, label]) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="cardType" value={val} checked={newCard.type === val}
                        onChange={() => setNewCard(p => ({ ...p, type: val as "credit" | "debit" }))}
                        style={{ accentColor: "#4A3728" }} />
                      <span className="text-sm" style={{ color: "#4A3728" }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAddCard(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium border"
                  style={{ borderColor: "#D4A373", color: "#4A3728" }}>
                  Cancelar
                </button>
                <button onClick={handleAddCard} disabled={addingCard}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{ background: "#4A3728", color: "#FEFAE0" }}>
                  {addingCard ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando…</> : "Guardar tarjeta"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: History */}
      {tab === "history" && (
        <div className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}>
          <h3 className="font-bold text-base mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
            Historial de transacciones
          </h3>
          {transactions.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "#6B5344" }}>No hay transacciones registradas</p>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: "#F5EDD3" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: tx.type === "recharge" ? "rgba(96,108,56,0.15)" : tx.type === "refund" ? "rgba(41,128,185,0.15)" : "rgba(192,57,43,0.15)" }}>
                      <span className="text-sm">{tx.type === "recharge" ? "⬆" : tx.type === "refund" ? "↩" : "🛒"}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#4A3728" }}>{tx.description}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs" style={{ color: "#6B5344", opacity: 0.7 }}>
                          {tx.date.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: tx.type === "recharge" ? "rgba(96,108,56,0.1)" : tx.type === "refund" ? "rgba(41,128,185,0.1)" : "rgba(192,57,43,0.1)",
                            color: tx.type === "recharge" ? "#606C38" : tx.type === "refund" ? "#2980B9" : "#C0392B" }}>
                          {tx.type === "recharge" ? "Recarga" : tx.type === "refund" ? "Reembolso" : "Compra"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-sm" style={{ color: tx.amount > 0 ? "#606C38" : "#C0392B", fontFamily: "'Playfair Display', serif" }}>
                    {tx.amount > 0 ? "+" : ""}{fmt(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
