import { useState, useRef, useEffect } from "react";
import { X, Send, CheckCircle, MessageCircle, Clock } from "lucide-react";
import { useShop } from "../../store/ShopContext";
import type { ChatSession } from "../../store/ShopContext";

function getWaitMinutes(chat: ChatSession): number {
  const msgs = chat.messages;
  let lastUserIdx = -1;
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].sender === "user") { lastUserIdx = i; break; }
  }
  if (lastUserIdx === -1) return 0;
  const hasAdminAfter = msgs.slice(lastUserIdx + 1).some(m => m.sender === "admin");
  if (hasAdminAfter) return 0;
  return Math.floor((Date.now() - msgs[lastUserIdx].timestamp) / 60000);
}

interface AdminChatPanelProps {
  onClose: () => void;
}

export function AdminChatPanel({ onClose }: AdminChatPanelProps) {
  const { chats, replyToChat, resolveChat } = useShop();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [now, setNow] = useState(Date.now());
  const endRef = useRef<HTMLDivElement>(null);

  const activeChats = chats.filter(c => c.status === "active");
  const selectedChat = chats.find(c => c.id === selectedChatId) ?? null;

  useEffect(() => {
    if (activeChats.length > 0 && !selectedChatId) {
      setSelectedChatId(activeChats[0].id);
    }
  }, [activeChats.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedChat?.messages.length]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || !selectedChatId) return;
    replyToChat(selectedChatId, replyText.trim());
    setReplyText("");
  }

  function handleResolve(chatId: string) {
    resolveChat(chatId);
    if (selectedChatId === chatId) {
      const next = activeChats.find(c => c.id !== chatId);
      setSelectedChatId(next?.id ?? null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[700] flex items-center justify-center p-4"
      style={{ background: "rgba(74,55,40,0.55)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex"
        style={{ height: "540px", background: "#FEFAE0" }}
      >
        {/* Lista de chats */}
        <div className="w-72 flex flex-col border-r" style={{ borderColor: "#E8C99A", background: "#fff" }}>
          <div className="px-4 py-4 flex items-center justify-between border-b" style={{ borderColor: "#E8C99A", background: "#4A3728" }}>
            <h3 className="font-bold text-sm text-[#FEFAE0] flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#D4A373]" /> Chats de soporte
            </h3>
            <button onClick={onClose} className="text-[#D4A373] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeChats.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-2xl mb-2">✨</p>
                <p className="text-xs text-gray-400">Sin chats pendientes</p>
              </div>
            ) : (
              activeChats.map(chat => {
                const wait = getWaitMinutes(chat);
                const isSelected = chat.id === selectedChatId;
                const lastMsg = chat.messages[chat.messages.length - 1];
                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className="w-full text-left px-4 py-3 border-b transition-colors"
                    style={{
                      borderColor: "#F5EDD3",
                      background: isSelected ? "#F5EDD3" : "transparent",
                    }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm truncate" style={{ color: "#4A3728" }}>
                        {chat.clientName}
                      </span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1"
                        style={{
                          background: wait > 5 ? "rgba(192,57,43,0.12)" : "rgba(96,108,56,0.12)",
                          color: wait > 5 ? "#C0392B" : "#606C38",
                        }}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        {wait === 0 ? "Respondido" : `${wait} min`}
                      </span>
                    </div>
                    {lastMsg && (
                      <p className="text-[11px] line-clamp-1 italic" style={{ color: "#6B5344" }}>
                        "{lastMsg.text}"
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Área de conversación */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Header del chat */}
              <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: "#E8C99A", background: "#fff" }}>
                <div>
                  <p className="font-bold text-sm" style={{ color: "#4A3728" }}>{selectedChat.clientName}</p>
                  <p className="text-xs" style={{ color: "#6B5344" }}>
                    Iniciado {new Date(selectedChat.startedAt).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <button
                  onClick={() => handleResolve(selectedChat.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                  style={{ background: "rgba(96,108,56,0.12)", color: "#606C38", border: "1px solid rgba(96,108,56,0.3)" }}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Resolver
                </button>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: "#FEFAE0" }}>
                {selectedChat.messages.map((m, i) => {
                  const isUser = m.sender === "user";
                  const isAdmin = m.sender === "admin";
                  return (
                    <div key={i} className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
                      <div
                        className="max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm shadow-sm"
                        style={
                          isUser
                            ? { background: "#fff", color: "#4A3728", borderRadius: "18px 18px 18px 4px" }
                            : isAdmin
                            ? { background: "#4A3728", color: "#FEFAE0", borderRadius: "18px 18px 4px 18px" }
                            : { background: "#E8C99A", color: "#4A3728", borderRadius: "18px 18px 18px 4px" }
                        }
                      >
                        {m.sender === "admin" && (
                          <p className="text-[10px] font-bold mb-0.5" style={{ color: "#D4A373" }}>Admin</p>
                        )}
                        {m.sender === "bot" && (
                          <p className="text-[10px] font-bold mb-0.5" style={{ color: "#8B6914" }}>Sistema</p>
                        )}
                        <p>{m.text}</p>
                        <p className="text-[10px] mt-1 opacity-60">
                          {new Date(m.timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              {/* Input de respuesta */}
              <form onSubmit={handleSendReply} className="p-3 bg-white border-t flex gap-2" style={{ borderColor: "#E8C99A" }}>
                <input
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: "1.5px solid #E8C99A", background: "#FEFAE0", color: "#4A3728" }}
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40 transition-opacity"
                  style={{ background: "#4A3728", color: "#D4A373" }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center" style={{ color: "#6B5344" }}>
              <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium opacity-50">Selecciona una conversación</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
