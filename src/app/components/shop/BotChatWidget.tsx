import { useState, useEffect, useRef } from "react";
import {
  MessageCircle, Bot, X, Send, Trash2,
  Star, ShoppingCart, Sparkles,
} from "lucide-react";
import { useShop, fmt } from "../../store/ShopContext";
import type { BotMessage, BotBookResult } from "../../store/shopTypes";

const CHIPS_ROW1 = [
  { label: "🔥 Tendencias para mí",   msg: "¿Qué libros están en tendencia?" },
  { label: "📈 Más vendidos",          msg: "¿Cuáles son los libros más vendidos?" },
  { label: "⭐ Mejor calificados",     msg: "¿Cuáles son los libros mejor calificados?" },
  { label: "✨ Novedades recientes",   msg: "¿Cuáles son las novedades recientes?" },
];
const CHIPS_ROW2 = [
  { label: "🎲 ¿Qué me recomiendas?", msg: "¿Qué me recomiendas?" },
  { label: "📚 Ciencia ficción",       msg: "Recomiéndame libros de ciencia ficción" },
  { label: "💰 Menos de 30.000",       msg: "Libros de menos de 30.000 pesos" },
];

export function BotChatWidget() {
  const {
    user, botMessages, botTyping, sendBotMessage, clearBotHistory,
    addToCart, spotlightBook,
  } = useShop();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput]   = useState("");
  const endRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [botMessages, botTyping, isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 80);
  }, [isOpen]);

  const handleSend = async (e?: React.FormEvent, text?: string) => {
    e?.preventDefault();
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput("");
    await sendBotMessage(msg);
  };

  if (!user || user.role !== "cliente") return null;

  const hasUnread = !isOpen && botMessages.length > 0 &&
    botMessages[botMessages.length - 1]?.sender === "bot";

  return (
    <>
      {/* ── Botón flotante ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[700] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
          style={{ background: "#4A3728", boxShadow: "0 4px 20px rgba(74,55,40,0.4)" }}
          title="Asistente en línea"
        >
          <MessageCircle className="w-6 h-6" style={{ color: "#D4A373" }} />
          {hasUnread && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white animate-pulse"
              style={{ background: "#D4A373" }}
            />
          )}
        </button>
      )}

      {/* ── Panel principal ── */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-[700] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{
            width: 360,
            height: 530,
            background: "#FEFAE0",
            border: "1.5px solid rgba(212,163,115,0.35)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #4A3728, #606C38)" }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(212,163,115,0.2)", border: "1.5px solid rgba(212,163,115,0.5)" }}
            >
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-none">Asistente en línea</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#D4A373" }}>
                {botTyping ? "Escribiendo…" : "Asistente de recomendaciones"}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {botMessages.length > 0 && (
                <button
                  onClick={clearBotHistory}
                  title="Limpiar conversación"
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
                  style={{ background: "rgba(255,255,255,0.12)" }}
                >
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Mensajes */}
          <div
            className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
            style={{ background: "#FEFAE0" }}
          >
            {botMessages.length === 0 && (
              <BotBubble
                msg={{
                  id: "welcome",
                  sender: "bot",
                  content: `¡Hola, ${user.name.split(" ")[0]}! 👋 Soy tu asistente de recomendaciones. Cuéntame qué tipo de libro buscas o prueba una sugerencia.`,
                  timestamp: Date.now(),
                }}
                onAddToCart={addToCart}
                onOpenBook={id => { spotlightBook(id); setIsOpen(false); }}
              />
            )}
            {botMessages.map(msg =>
              msg.sender === "user"
                ? <UserBubble key={msg.id} msg={msg} />
                : <BotBubble key={msg.id} msg={msg} onAddToCart={addToCart}
                    onOpenBook={id => { spotlightBook(id); setIsOpen(false); }} />
            )}
            {botTyping && <TypingBubble />}
            <div ref={endRef} />
          </div>

          {/* Chips de sugerencias rápidas */}
          {botMessages.length === 0 && !botTyping && (
            <div className="px-3 pb-2 flex-shrink-0 space-y-1.5">
              {/* Fila 1: tendencias */}
              <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {CHIPS_ROW1.map(c => (
                  <button
                    key={c.msg}
                    onClick={() => handleSend(undefined, c.msg)}
                    className="flex-shrink-0 text-[10px] font-semibold px-2.5 py-1.5 rounded-full border transition-all hover:opacity-80"
                    style={{ borderColor: "#606C38", color: "#606C38", background: "rgba(96,108,56,0.07)" }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              {/* Fila 2: recomendaciones clásicas */}
              <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {CHIPS_ROW2.map(c => (
                  <button
                    key={c.msg}
                    onClick={() => handleSend(undefined, c.msg)}
                    className="flex-shrink-0 text-[10px] font-semibold px-2.5 py-1.5 rounded-full border transition-all hover:opacity-80"
                    style={{ borderColor: "#D4A373", color: "#4A3728", background: "#fff" }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
            style={{ background: "#fff", borderTop: "1px solid #F5EDD3" }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Escríbeme algo…"
              disabled={botTyping}
              className="flex-1 px-3 py-2 rounded-xl text-sm outline-none disabled:opacity-50"
              style={{ background: "#FEFAE0", border: "1.5px solid #E8C99A", color: "#4A3728" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || botTyping}
              className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40 transition-opacity hover:opacity-80"
              style={{ background: "#4A3728" }}
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

// ── Sub-componentes ───────────────────────────────────────────

function UserBubble({ msg }: { msg: BotMessage }) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[78%] px-3 py-2 rounded-2xl rounded-br-sm text-sm"
        style={{ background: "#D4A373", color: "#4A3728" }}
      >
        <p className="leading-relaxed">{msg.content}</p>
        <p className="text-[9px] mt-0.5 opacity-55 text-right">
          {new Date(msg.timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

function BotBubble({
  msg, onAddToCart, onOpenBook,
}: {
  msg: BotMessage;
  onAddToCart: (id: number) => void;
  onOpenBook?: (id: number) => void;
}) {
  const renderText = (text: string) =>
    text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : part.includes("\n")
          ? part.split("\n").map((line, j) => (
              <span key={j}>{line}{j < part.split("\n").length - 1 && <br />}</span>
            ))
          : part
    );

  return (
    <div className="flex items-start gap-2">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: "linear-gradient(135deg, #4A3728, #606C38)" }}
      >
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div
          className="inline-block max-w-full px-3 py-2 rounded-2xl rounded-tl-sm text-sm shadow-sm"
          style={{ background: "#fff", border: "1px solid #F5EDD3", color: "#4A3728" }}
        >
          <p className="leading-relaxed">{renderText(msg.content)}</p>
          <p className="text-[9px] mt-0.5 opacity-50">
            {new Date(msg.timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        {msg.books && msg.books.length > 0 && (
          <div className="flex gap-2.5 overflow-x-auto pb-1 pr-1" style={{ scrollbarWidth: "none" }}>
            {msg.books.map(book => (
              <BotBookCard
                key={book.bookId}
                book={book}
                onAddToCart={onAddToCart}
                onOpen={onOpenBook}
              />
            ))}
            {/* Spacer para que el último libro no quede recortado */}
            <div className="flex-shrink-0 w-2" />
          </div>
        )}
      </div>
    </div>
  );
}

function BotBookCard({
  book, onAddToCart, onOpen,
}: {
  book: BotBookResult;
  onAddToCart: (id: number) => void;
  onOpen?: (id: number) => void;
}) {
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!book.available || added) return;
    onAddToCart(book.bookId);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div
      onClick={() => onOpen?.(book.bookId)}
      className="flex-shrink-0 rounded-xl overflow-hidden group transition-all hover:shadow-md"
      style={{
        width: 120,
        background: "#fff",
        border: "1px solid #F5EDD3",
        cursor: onOpen ? "pointer" : "default",
      }}
    >
      <div className="relative overflow-hidden" style={{ height: 90 }}>
        <img
          src={book.cover.includes("unsplash") ? `${book.cover}&w=240&q=65` : book.cover}
          alt={book.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=240&q=60"; }}
        />
        <div
          className="absolute top-1 right-1 flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[9px] font-bold"
          style={{ background: "rgba(74,55,40,0.85)", color: "#D4A373" }}
        >
          <Star className="w-2 h-2" fill="#D4A373" stroke="none" />
          {(book.rating ?? 0).toFixed(1)}
        </div>
      </div>
      <div className="p-1.5">
        <div
          className="text-[8px] font-semibold px-1 py-0.5 rounded-full mb-1 line-clamp-1"
          style={{ background: "rgba(212,163,115,0.2)", color: "#7A5C35" }}
        >
          ✦ {book.reason}
        </div>
        <p
          className="text-[10px] font-semibold line-clamp-2 mb-0.5 leading-tight"
          style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}
        >
          {book.title}
        </p>
        <p className="text-[9px] truncate mb-1.5" style={{ color: "#6B5344", opacity: 0.75 }}>{book.author}</p>
        <div className="flex items-center justify-between gap-1">
          <span className="text-[9px] font-bold" style={{ color: "#4A3728" }}>{fmt(book.price)}</span>
          {book.available ? (
            <button
              onClick={handleAdd}
              className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
              style={{ background: added ? "#606C38" : "#4A3728", color: "#D4A373" }}
              title={added ? "Agregado" : "Agregar al carrito"}
            >
              <ShoppingCart className="w-3 h-3" />
            </button>
          ) : (
            <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: "rgba(192,57,43,0.1)", color: "#C0392B" }}>
              Agotado
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#4A3728" }}>
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="px-3 py-2.5 rounded-2xl rounded-bl-sm bg-white shadow-sm border text-sm" style={{ borderColor: "#F5EDD3" }}>
        <div className="flex items-center gap-1 py-0.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: "#D4A373", animation: `bounce 1.2s ${i * 0.2}s infinite ease-in-out` }}
            />
          ))}
        </div>
      </div>
      <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-5px);opacity:1} }`}</style>
    </div>
  );
}
