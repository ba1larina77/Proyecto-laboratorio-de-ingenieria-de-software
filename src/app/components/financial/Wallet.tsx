import { useState, useMemo } from "react";
import { useShop, fmt } from "../../store/ShopContext";
import type { Card, WalletTransaction } from "../../store/shopTypes";

const QUICK_AMOUNTS = [10000, 25000, 50000, 100000];

const TX_TYPE_LABELS: Record<WalletTransaction["type"], string> = {
  recharge: "Recarga",
  purchase: "Compra",
  refund:   "Reembolso",
};

const TX_TYPE_COLORS: Record<WalletTransaction["type"], { bg: string; color: string }> = {
  recharge: { bg: "rgba(96,108,56,0.12)",   color: "#606C38" },
  purchase: { bg: "rgba(192,57,43,0.12)",   color: "#C0392B" },
  refund:   { bg: "rgba(41,128,185,0.12)",  color: "#2980B9" },
};

const TX_TYPE_ICONS: Record<WalletTransaction["type"], string> = {
  recharge: "⬆",
  purchase: "🛒",
  refund:   "↩",
};

const INITIAL_CARDS: Card[] = [
  { id: "c1", lastFour: "4521", holder: "JUAN C PÉREZ", expiry: "12/27", type: "credit",  network: "visa",       isPrimary: true  },
  { id: "c2", lastFour: "8834", holder: "JUAN C PÉREZ", expiry: "08/26", type: "debit",   network: "mastercard", isPrimary: false },
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
  const { user, updateBalance, walletTransactions, addWalletTransaction } = useShop();

  const [tab, setTab]                   = useState<"overview" | "cards" | "history">("overview");
  const [cards, setCards]               = useState<Card[]>(INITIAL_CARDS);
  const [rechargeAmount, setRechargeAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedCard, setSelectedCard] = useState("c1");
  const [cvv, setCvv]                   = useState("");
  const [recharging, setRecharging]     = useState(false);
  const [rechargeSuccess, setRechargeSuccess] = useState(false);
  const [showAddCard, setShowAddCard]   = useState(false);

  // Filtros del historial
  const [filterType, setFilterType]         = useState<"" | WalletTransaction["type"]>("");
  const [filterFrom, setFilterFrom]         = useState("");
  const [filterTo, setFilterTo]             = useState("");
  const [filterError, setFilterError]       = useState("");

  const [newCard, setNewCard] = useState({ number: "", holder: "", expiry: "", cvv: "", type: "credit" as "credit" | "debit" });
  const [cardErrors, setCardErrors] = useState({ number: "", holder: "", expiry: "", cvv: "" });
  const [addingCard, setAddingCard] = useState(false);

  const balance = user?.balance ?? 0;

  // Aplicar filtros al historial
  const filteredTxs = useMemo(() => {
    let txs = walletTransactions;
    if (filterType) txs = txs.filter(tx => tx.type === filterType);
    if (filterFrom) {
      const from = new Date(filterFrom);
      txs = txs.filter(tx => new Date(tx.date) >= from);
    }
    if (filterTo) {
      const to = new Date(filterTo);
      to.setHours(23, 59, 59, 999);
      txs = txs.filter(tx => new Date(tx.date) <= to);
    }
    return txs;
  }, [walletTransactions, filterType, filterFrom, filterTo]);

  function validateDateRange() {
    if (filterFrom && filterTo && filterFrom > filterTo) {
      setFilterError("La fecha de inicio no puede ser posterior a la fecha fin.");
      return false;
    }
    setFilterError("");
    return true;
  }

  function handleRecharge() {
    const amount = rechargeAmount || Number(customAmount.replace(/\D/g, ""));
    if (!amount || amount < 5000) return;
    if (!cvv || cvv.length < 3) return;
    if (!validateDateRange()) return;
    setRecharging(true);
    setTimeout(() => {
      const txId = `TXW-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      updateBalance(amount);
      addWalletTransaction({
        id: txId,
        date: new Date(),
        type: "recharge",
        amount,
        description: `Recarga desde tarjeta •${cards.find(c => c.id === selectedCard)?.lastFour ?? "****"}`,
      });
      setRechargeAmount(0);
      setCustomAmount("");
      setCvv("");
      setRecharging(false);
      setRechargeSuccess(true);
      setTimeout(() => setRechargeSuccess(false), 3000);
    }, 1500);
  }

  // Formatea el número de tarjeta en grupos de 4 dígitos: "1234 5678 9012 3456"
  function formatCardNumber(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trimEnd();
  }

  // Formatea vencimiento como MM/AA y valida mes válido
  function formatExpiry(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  }

  function validateCardFields(): boolean {
    const digits = newCard.number.replace(/\D/g, "");
    const errors = {
      number: digits.length < 13
        ? `El número de tarjeta debe tener entre 13 y 16 dígitos (tienes ${digits.length})`
        : "",
      holder: newCard.holder.trim().length < 3
        ? "El nombre del titular es requerido"
        : !/^[A-Za-záéíóúÁÉÍÓÚñÑ\s'-]+$/.test(newCard.holder.trim())
          ? "El nombre solo puede contener letras"
          : "",
      expiry: (() => {
        const [mm, yy] = newCard.expiry.split("/");
        const month = parseInt(mm ?? "0", 10);
        const year  = parseInt(yy ?? "0", 10) + 2000;
        const now   = new Date();
        if (!mm || !yy || mm.length !== 2 || yy.length !== 2) return "Formato requerido: MM/AA";
        if (month < 1 || month > 12) return "Mes inválido (01–12)";
        if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1))
          return "Tarjeta vencida";
        return "";
      })(),
      cvv: newCard.cvv.length < 3
        ? `El CVV debe tener ${newCard.cvv.length < 3 ? 3 : 4} dígitos`
        : "",
    };
    setCardErrors(errors);
    return !Object.values(errors).some(Boolean);
  }

  function handleAddCard() {
    if (!validateCardFields()) return;
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
      setCardErrors({ number: "", holder: "", expiry: "", cvv: "" });
      setAddingCard(false);
      setShowAddCard(false);
    }, 800);
  }

  function handleDeleteCard(id: string) {
    setCards(prev => {
      const next = prev.filter(c => c.id !== id);
      if (next.length > 0 && !next.find(c => c.isPrimary)) next[0].isPrimary = true;
      return next;
    });
  }

  function handleSetPrimary(id: string) {
    setCards(prev => prev.map(c => ({ ...c, isPrimary: c.id === id })));
  }

  function clearFilters() {
    setFilterType("");
    setFilterFrom("");
    setFilterTo("");
    setFilterError("");
  }

  const tabs = [
    { key: "overview", label: "Mi Billetera" },
    { key: "cards",    label: "Mis Tarjetas" },
    { key: "history",  label: "Historial" },
  ] as const;

  const hasFilters = filterType || filterFrom || filterTo;

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
          Gestión Financiera
        </h1>
        <p className="text-sm" style={{ color: "#6B5344", opacity: 0.8 }}>
          Billetera digital · Tarjetas · Historial de transacciones
        </p>
      </div>

      {/* Balance siempre visible */}
      <div className="rounded-2xl p-6 mb-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#4A3728 0%,#6B5344 100%)", color: "#FEFAE0" }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
          style={{ background: "#D4A373", transform: "translate(30%,-30%)" }} />
        <p className="text-sm opacity-75 mb-1">Saldo disponible</p>
        <p className="text-4xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
          {fmt(balance)}
        </p>
        <p className="text-xs opacity-60">Actualizado en tiempo real · {user?.name ?? "—"}</p>
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
            style={tab === t.key
              ? { background: "#fff", color: "#4A3728", boxShadow: "0 2px 8px rgba(74,55,40,0.12)" }
              : { color: "#6B5344" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Overview / Recarga ── */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Panel de recarga */}
          <div className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}>
            <h3 className="font-bold text-base mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
              Recargar saldo
            </h3>
            <p className="text-xs mb-4" style={{ color: "#6B5344" }}>Montos rápidos</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {QUICK_AMOUNTS.map(a => (
                <button key={a} onClick={() => { setRechargeAmount(a); setCustomAmount(""); }}
                  className="py-3 rounded-xl text-sm font-semibold border-2 transition-all"
                  style={rechargeAmount === a
                    ? { borderColor: "#4A3728", background: "rgba(74,55,40,0.04)", color: "#4A3728" }
                    : { borderColor: "#E8C99A", color: "#6B5344" }}>
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

          {/* Últimas transacciones */}
          <div className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}>
            <h3 className="font-bold text-base mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
              Últimas transacciones
            </h3>
            {walletTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3" style={{ color: "#6B5344", opacity: 0.6 }}>
                <span className="text-4xl">💳</span>
                <p className="text-sm text-center">Aún no tienes transacciones registradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {walletTransactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0"
                    style={{ borderColor: "#F5EDD3" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: TX_TYPE_COLORS[tx.type]?.bg }}>
                        <span className="text-base">{TX_TYPE_ICONS[tx.type]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "#4A3728" }}>{tx.description}</p>
                        <p className="text-xs" style={{ color: "#6B5344", opacity: 0.7 }}>
                          {new Date(tx.date).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
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
            )}
            <button onClick={() => setTab("history")}
              className="mt-4 text-xs font-medium transition-all hover:opacity-70"
              style={{ color: "#4A3728" }}>
              Ver historial completo →
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: Tarjetas ── */}
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
                {/* Número de tarjeta — máx 16 dígitos, formato 4-4-4-4 */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>
                    Número de tarjeta * <span className="font-normal opacity-60">(16 dígitos)</span>
                  </label>
                  <input
                    value={newCard.number}
                    onChange={e => {
                      const formatted = formatCardNumber(e.target.value);
                      setNewCard(p => ({ ...p, number: formatted }));
                      setCardErrors(p => ({ ...p, number: "" }));
                    }}
                    onBlur={validateCardFields}
                    inputMode="numeric"
                    maxLength={19}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none font-mono tracking-widest"
                    style={{
                      border: `1.5px solid ${cardErrors.number ? "#C0392B" : "#E8C99A"}`,
                      background: "#FEFAE0", color: "#4A3728",
                    }}
                  />
                  {cardErrors.number
                    ? <p className="text-xs mt-1" style={{ color: "#C0392B" }}>{cardErrors.number}</p>
                    : newCard.number && (
                        <p className="text-xs mt-1" style={{ color: "#6B5344", opacity: 0.7 }}>
                          {newCard.number.replace(/\D/g, "").length} / 16 dígitos
                        </p>
                      )
                  }
                </div>

                {/* Nombre del titular */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>
                    Nombre del titular *
                  </label>
                  <input
                    value={newCard.holder}
                    onChange={e => {
                      setNewCard(p => ({ ...p, holder: e.target.value.toUpperCase() }));
                      setCardErrors(p => ({ ...p, holder: "" }));
                    }}
                    onBlur={validateCardFields}
                    maxLength={26}
                    placeholder="COMO APARECE EN LA TARJETA"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none uppercase tracking-wide"
                    style={{
                      border: `1.5px solid ${cardErrors.holder ? "#C0392B" : "#E8C99A"}`,
                      background: "#FEFAE0", color: "#4A3728",
                    }}
                  />
                  {cardErrors.holder && (
                    <p className="text-xs mt-1" style={{ color: "#C0392B" }}>{cardErrors.holder}</p>
                  )}
                </div>

                {/* Vencimiento MM/AA */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>
                    Vencimiento *
                  </label>
                  <input
                    value={newCard.expiry}
                    onChange={e => {
                      const formatted = formatExpiry(e.target.value);
                      setNewCard(p => ({ ...p, expiry: formatted }));
                      setCardErrors(p => ({ ...p, expiry: "" }));
                    }}
                    onBlur={validateCardFields}
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="MM/AA"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{
                      border: `1.5px solid ${cardErrors.expiry ? "#C0392B" : "#E8C99A"}`,
                      background: "#FEFAE0", color: "#4A3728",
                    }}
                  />
                  {cardErrors.expiry && (
                    <p className="text-xs mt-1" style={{ color: "#C0392B" }}>{cardErrors.expiry}</p>
                  )}
                </div>

                {/* CVV */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>
                    CVV * <span className="font-normal opacity-60">(3–4 dígitos)</span>
                  </label>
                  <input
                    value={newCard.cvv}
                    onChange={e => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setNewCard(p => ({ ...p, cvv: digits }));
                      setCardErrors(p => ({ ...p, cvv: "" }));
                    }}
                    onBlur={validateCardFields}
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="•••"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{
                      border: `1.5px solid ${cardErrors.cvv ? "#C0392B" : "#E8C99A"}`,
                      background: "#FEFAE0", color: "#4A3728",
                    }}
                  />
                  {cardErrors.cvv && (
                    <p className="text-xs mt-1" style={{ color: "#C0392B" }}>{cardErrors.cvv}</p>
                  )}
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>Tipo</label>
                <div className="flex gap-3">
                  {([["credit", "Crédito"], ["debit", "Débito"]] as const).map(([val, label]) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="cardType" value={val} checked={newCard.type === val}
                        onChange={() => setNewCard(p => ({ ...p, type: val }))}
                        style={{ accentColor: "#4A3728" }} />
                      <span className="text-sm" style={{ color: "#4A3728" }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => {
                    setShowAddCard(false);
                    setNewCard({ number: "", holder: "", expiry: "", cvv: "", type: "credit" });
                    setCardErrors({ number: "", holder: "", expiry: "", cvv: "" });
                  }}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium border"
                  style={{ borderColor: "#D4A373", color: "#4A3728" }}>
                  Cancelar
                </button>
                <button onClick={handleAddCard} disabled={addingCard}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{ background: "#4A3728", color: "#FEFAE0" }}>
                  {addingCard
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando…</>
                    : "Guardar tarjeta"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Historial de transacciones ── */}
      {tab === "history" && (
        <div className="rounded-2xl" style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}>
          {/* Cabecera + filtros */}
          <div className="px-6 py-5 border-b" style={{ borderColor: "#F5EDD3" }}>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h3 className="font-bold text-base" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
                Historial de transacciones
              </h3>
              {hasFilters && (
                <button onClick={clearFilters}
                  className="text-xs px-3 py-1.5 rounded-lg border transition-all hover:opacity-70"
                  style={{ borderColor: "#C0392B", color: "#C0392B" }}>
                  ✕ Limpiar filtros
                </button>
              )}
            </div>

            {/* Fila de filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#4A3728" }}>Tipo</label>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value as "" | WalletTransaction["type"])}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none appearance-none"
                  style={{ border: "1.5px solid #E8C99A", background: "#FEFAE0", color: "#4A3728" }}>
                  <option value="">Todos</option>
                  <option value="recharge">Recarga</option>
                  <option value="purchase">Compra</option>
                  <option value="refund">Reembolso</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#4A3728" }}>Desde</label>
                <input
                  type="date"
                  value={filterFrom}
                  onChange={e => { setFilterFrom(e.target.value); setFilterError(""); }}
                  onBlur={validateDateRange}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: `1.5px solid ${filterError ? "#C0392B" : "#E8C99A"}`, background: "#FEFAE0", color: "#4A3728" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#4A3728" }}>Hasta</label>
                <input
                  type="date"
                  value={filterTo}
                  onChange={e => { setFilterTo(e.target.value); setFilterError(""); }}
                  onBlur={validateDateRange}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: `1.5px solid ${filterError ? "#C0392B" : "#E8C99A"}`, background: "#FEFAE0", color: "#4A3728" }} />
              </div>
            </div>
            {filterError && (
              <p className="text-xs mt-2" style={{ color: "#C0392B" }}>{filterError}</p>
            )}
          </div>

          {/* Lista de transacciones filtradas */}
          <div className="p-6">
            {filteredTxs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3" style={{ color: "#6B5344" }}>
                <span className="text-5xl opacity-40">🔍</span>
                <p className="text-sm font-medium">
                  {hasFilters ? "No hay transacciones para los filtros seleccionados" : "Aún no tienes transacciones registradas"}
                </p>
                {hasFilters && (
                  <button onClick={clearFilters}
                    className="text-xs px-4 py-2 rounded-lg border mt-1 hover:opacity-70"
                    style={{ borderColor: "#D4A373", color: "#4A3728" }}>
                    Ver todas las transacciones
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTxs.map(tx => (
                  <div key={tx.id}
                    className="flex items-center justify-between p-3 rounded-xl gap-3"
                    style={{ background: "#F5EDD3" }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: TX_TYPE_COLORS[tx.type]?.bg }}>
                        <span className="text-sm">{TX_TYPE_ICONS[tx.type]}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "#4A3728" }}>{tx.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs" style={{ color: "#6B5344", opacity: 0.7 }}>
                            {new Date(tx.date).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: TX_TYPE_COLORS[tx.type]?.bg, color: TX_TYPE_COLORS[tx.type]?.color }}>
                            {TX_TYPE_LABELS[tx.type]}
                          </span>
                          {/* ID abreviado con tooltip */}
                          <span
                            title={`ID de transacción: ${tx.id}`}
                            className="text-xs font-mono px-1.5 py-0.5 rounded cursor-default"
                            style={{ background: "rgba(74,55,40,0.06)", color: "#6B5344" }}>
                            #{tx.id.slice(-8)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="font-bold text-sm flex-shrink-0"
                      style={{ color: tx.amount > 0 ? "#606C38" : "#C0392B", fontFamily: "'Playfair Display', serif" }}>
                      {tx.amount > 0 ? "+" : ""}{fmt(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer con resumen */}
          {filteredTxs.length > 0 && (
            <div className="px-6 py-4 border-t flex justify-between text-xs" style={{ borderColor: "#F5EDD3", color: "#6B5344" }}>
              <span>{filteredTxs.length} transacción{filteredTxs.length !== 1 ? "es" : ""}</span>
              <span>
                Neto:{" "}
                <strong style={{ color: filteredTxs.reduce((s, t) => s + t.amount, 0) >= 0 ? "#606C38" : "#C0392B" }}>
                  {filteredTxs.reduce((s, t) => s + t.amount, 0) >= 0 ? "+" : ""}
                  {fmt(filteredTxs.reduce((s, t) => s + t.amount, 0))}
                </strong>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
