import { useState, useRef, useEffect } from "react";
import { Mail, Send, X } from "lucide-react";
import { useShop } from "../../store/ShopContext";

interface Props {
  /** Permite abrir el widget desde la navbar (badge click) */
  forceOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DirectMessageWidget({ forceOpen, onOpenChange }: Props) {
  const { user, directMessages, unreadDirectCount, sendDirectMessage, markDirectMessageRead } = useShop();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const convId = user ? `conv-${user.id}` : null;
  const conv = directMessages.find(c => c.id === convId) ?? null;
  const messages = conv?.messages ?? [];

  const open = (val: boolean) => {
    setIsOpen(val);
    onOpenChange?.(val);
  };

  // Abrir desde fuera (click en badge de navbar)
  useEffect(() => {
    if (forceOpen) open(true);
  }, [forceOpen]);

  // Scroll al último mensaje
  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isOpen]);

  // Al abrir: marcar conversación como leída si tiene mensajes pendientes del admin
  useEffect(() => {
    if (isOpen && convId && conv?.status === 'pending_user') {
      markDirectMessageRead(convId);
    }
  }, [isOpen, conv?.status]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    sendDirectMessage(input.trim());
    setInput("");
  };

  if (!user || user.role !== "cliente") return null;

  return (
    <>
      {/* ── Botón flotante ── */}
      {!isOpen && (
        <button
          onClick={() => open(true)}
          title="Mensaje directo al administrador"
          className="fixed bottom-24 right-6 z-[600] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform animate-in zoom-in"
          style={{ background: "#606C38", color: "#fff" }}
        >
          <Mail className="w-6 h-6" />
          {unreadDirectCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white animate-pulse px-1"
            >
              {unreadDirectCount}
            </span>
          )}
        </button>
      )}

      {/* ── Panel de chat ── */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-[600] w-80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-2"
          style={{ height: "460px", background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}
        >
          {/* Header */}
          <div className="p-4 flex items-center justify-between" style={{ background: "#606C38" }}>
            <h3 className="font-bold flex items-center gap-2 text-white text-sm">
              <Mail className="w-4 h-4" />
              Mensaje al Administrador
            </h3>
            <button onClick={() => open(false)} className="hover:opacity-80 text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Hilo de mensajes */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3" style={{ background: "#F7F9F3" }}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                <Mail className="w-10 h-10 mb-2" style={{ color: "#606C38" }} />
                <p className="text-xs text-gray-500">
                  Escribe un mensaje y un<br />administrador te responderá.
                </p>
              </div>
            ) : (
              messages.map(msg => {
                const isUser = msg.sender === "user";
                return (
                  <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[82%] px-3 py-2.5 rounded-2xl text-sm shadow-sm"
                      style={
                        isUser
                          ? { background: "#606C38", color: "#fff", borderRadius: "18px 18px 4px 18px" }
                          : { background: "#fff", color: "#4A3728", border: "1px solid #E8C99A", borderRadius: "18px 18px 18px 4px" }
                      }
                    >
                      {!isUser && (
                        <p className="text-[10px] font-bold mb-0.5" style={{ color: "#606C38" }}>
                          {msg.senderName}
                        </p>
                      )}
                      <p>{msg.content}</p>
                      <p className="text-[10px] mt-1 opacity-50 text-right">
                        {new Date(msg.timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t flex gap-2" style={{ borderColor: "#e5e7eb" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
              style={{ border: "1.5px solid #d1d5db", background: "#F7F9F3" }}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center disabled:opacity-40 transition-opacity"
              style={{ background: "#606C38", color: "#fff" }}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
