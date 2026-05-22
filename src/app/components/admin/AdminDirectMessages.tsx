import { useState, useRef, useEffect, useMemo } from "react";
import { X, Mail, Send, Inbox, UserPlus, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { useShop } from "../../store/ShopContext";
import type { DirectMessage } from "../../store/shopTypes";

const URGENCY_MS = 24 * 60 * 60 * 1000; // 24 horas

function isUrgent(conv: DirectMessage): boolean {
  return (
    conv.status === 'pending_admin' &&
    conv.lastUserMsgAt > 0 &&
    Date.now() - conv.lastUserMsgAt > URGENCY_MS
  );
}

function waitLabel(conv: DirectMessage): string {
  if (conv.status !== 'pending_admin' || conv.lastUserMsgAt === 0) return "";
  const ms = Date.now() - conv.lastUserMsgAt;
  const h = Math.floor(ms / 3600000);
  if (h < 1) return `${Math.floor(ms / 60000)} min`;
  return `${h} h`;
}

interface Props { onClose: () => void; }

type Tab = 'active' | 'resolved';

export function AdminDirectMessages({ onClose }: Props) {
  const { user, directMessages, usersList, adminSendToUser, markDirectMessageRead, resolveConversation } = useShop();

  const [tab, setTab] = useState<Tab>('active');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingTarget, setPendingTarget] = useState<{ userId: string; userName: string } | null>(null);
  const [input, setInput] = useState("");
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [now, setNow] = useState(Date.now());
  const endRef = useRef<HTMLDivElement>(null);

  // Actualizar reloj cada 60 s para recalcular urgencia sin recargar
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const activeConvs = useMemo(() =>
    directMessages
      .filter(c => c.status !== 'resolved')
      .sort((a, b) => {
        // Urgentes primero, luego pending_admin, luego por updatedAt desc
        const ua = isUrgent(a) ? 2 : a.status === 'pending_admin' ? 1 : 0;
        const ub = isUrgent(b) ? 2 : b.status === 'pending_admin' ? 1 : 0;
        if (ub !== ua) return ub - ua;
        return b.updatedAt - a.updatedAt;
      }),
  [directMessages, now]);

  const resolvedConvs = useMemo(() =>
    directMessages
      .filter(c => c.status === 'resolved')
      .sort((a, b) => (b.resolvedAt ?? b.updatedAt) - (a.resolvedAt ?? a.updatedAt)),
  [directMessages]);

  const conversations = tab === 'active' ? activeConvs : resolvedConvs;
  const selected = directMessages.find(c => c.id === selectedId) ?? null;

  const pendingCount = activeConvs.filter(c => c.status === 'pending_admin').length;
  const urgentCount  = activeConvs.filter(c => isUrgent(c)).length;

  // Seleccionar primera conversación al cambiar de tab
  useEffect(() => {
    const list = tab === 'active' ? activeConvs : resolvedConvs;
    if (list.length > 0 && (!selectedId || !list.find(c => c.id === selectedId))) {
      setSelectedId(list[0].id);
      setPendingTarget(null);
    } else if (list.length === 0) {
      setSelectedId(null);
      setPendingTarget(null);
    }
  }, [tab, activeConvs.length, resolvedConvs.length]);

  // Marcar como leída al seleccionar
  useEffect(() => {
    if (selected?.status === 'pending_admin') markDirectMessageRead(selected.id);
  }, [selectedId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages.length, selectedId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    if (selected) {
      adminSendToUser(selected.userId, selected.userName, input.trim());
    } else if (pendingTarget) {
      adminSendToUser(pendingTarget.userId, pendingTarget.userName, input.trim());
      setSelectedId(`conv-${pendingTarget.userId}`);
      setPendingTarget(null);
    }
    setInput("");
  };

  const handleResolve = () => {
    if (!selectedId) return;
    resolveConversation(selectedId);
  };

  const startConversationWith = (userId: string, userName: string) => {
    const convId = `conv-${userId}`;
    setSelectedId(convId);
    if (!directMessages.find(c => c.id === convId)) setPendingTarget({ userId, userName });
    setShowUserPicker(false);
    setUserSearch("");
    setTab('active');
  };

  const filteredUsers = usersList.filter(u =>
    userSearch === "" ||
    `${u.nombres} ${u.apellidos}`.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.correo.toLowerCase().includes(userSearch.toLowerCase())
  );

  const isResolved = selected?.status === 'resolved';

  return (
    <div
      className="fixed inset-0 z-[700] flex items-center justify-center p-4"
      style={{ background: "rgba(74,55,40,0.55)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex"
        style={{ height: "600px", background: "#FEFAE0" }}
      >
        {/* ── SIDEBAR ── */}
        <div className="w-72 flex flex-col border-r" style={{ borderColor: "#E8C99A", background: "#fff" }}>

          {/* Header sidebar */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#606C38" }}>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Mensajes Directos
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
              {urgentCount > 0 && (
                <span className="flex items-center gap-0.5 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  <AlertTriangle className="w-2.5 h-2.5" />{urgentCount}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowUserPicker(v => !v)} title="Nueva conversación" className="text-white/80 hover:text-white">
                <UserPlus className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="text-white/70 hover:text-white ml-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tabs Activas / Resueltas */}
          <div className="flex border-b" style={{ borderColor: "#E8C99A" }}>
            {(['active', 'resolved'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 text-xs font-bold transition-colors"
                style={{
                  background: tab === t ? "#F5EDD3" : "transparent",
                  color: tab === t ? "#4A3728" : "#9ca3af",
                  borderBottom: tab === t ? "2px solid #606C38" : "2px solid transparent",
                }}
              >
                {t === 'active' ? `Activas (${activeConvs.length})` : `Resueltas (${resolvedConvs.length})`}
              </button>
            ))}
          </div>

          {/* User picker (nueva conversación) */}
          {showUserPicker && (
            <div className="border-b" style={{ borderColor: "#E8C99A", background: "#F5EDD3" }}>
              <div className="p-2">
                <input
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Buscar usuario..."
                  autoFocus
                  className="w-full px-3 py-1.5 rounded-lg text-xs outline-none"
                  style={{ border: "1px solid #E8C99A", background: "#fff" }}
                />
              </div>
              <div className="max-h-32 overflow-y-auto">
                {filteredUsers.length === 0
                  ? <p className="px-3 py-2 text-xs text-gray-400">Sin resultados</p>
                  : filteredUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => startConversationWith(u.id, `${u.nombres} ${u.apellidos}`)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-white/60 transition-colors"
                      style={{ color: "#4A3728" }}
                    >
                      <span className="font-semibold">{u.nombres} {u.apellidos}</span>
                      <span className="block text-gray-400 text-[10px]">{u.correo}</span>
                    </button>
                  ))
                }
              </div>
            </div>
          )}

          {/* Lista conversaciones */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs text-gray-400">
                  {tab === 'active' ? 'Sin conversaciones activas' : 'Sin conversaciones resueltas'}
                </p>
              </div>
            ) : (
              conversations.map(conv => {
                const urgent = isUrgent(conv);
                const wait = waitLabel(conv);
                const lastMsg = conv.messages[conv.messages.length - 1];
                const isSelected = selectedId === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => { setSelectedId(conv.id); setPendingTarget(null); }}
                    className="w-full text-left px-4 py-3 border-b transition-colors"
                    style={{
                      borderColor: "#F5EDD3",
                      background: isSelected
                        ? urgent ? "rgba(249,115,22,0.12)" : "#F5EDD3"
                        : urgent ? "rgba(249,115,22,0.06)" : "transparent",
                    }}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-sm truncate" style={{ color: "#4A3728" }}>
                        {conv.userName}
                      </span>
                      {urgent && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 flex-shrink-0">
                          <AlertTriangle className="w-2.5 h-2.5" /> Urgente
                        </span>
                      )}
                      {!urgent && conv.status === 'pending_admin' && (
                        <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                      )}
                      {conv.status === 'resolved' && (
                        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#606C38" }} />
                      )}
                    </div>
                    {lastMsg && (
                      <p className="text-[11px] line-clamp-1" style={{ color: "#6B5344" }}>
                        {lastMsg.sender === 'admin' ? '↗ ' : ''}{lastMsg.content}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-[10px] opacity-40">
                        {new Date(conv.updatedAt).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {wait && (
                        <span className="flex items-center gap-0.5 text-[10px]" style={{ color: urgent ? "#ea580c" : "#9ca3af" }}>
                          <Clock className="w-2.5 h-2.5" />{wait}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── PANEL DE CONVERSACIÓN ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {(selected || pendingTarget) ? (
            <>
              {/* Header conversación */}
              <div className="px-5 py-3 border-b flex items-center justify-between gap-2" style={{ borderColor: "#E8C99A", background: "#fff" }}>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: "#4A3728" }}>
                    {selected?.userName ?? pendingTarget?.userName}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selected && isUrgent(selected) && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600">
                        <AlertTriangle className="w-3 h-3" />
                        Sin respuesta hace {waitLabel(selected)} — Urgente
                      </span>
                    )}
                    {selected?.status === 'pending_admin' && !isUrgent(selected) && (
                      <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Esperando respuesta · {waitLabel(selected)}
                      </span>
                    )}
                    {selected?.status === 'resolved' && (
                      <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: "#606C38" }}>
                        <CheckCircle className="w-3 h-3" />
                        Resuelta · {selected.resolvedAt ? new Date(selected.resolvedAt).toLocaleDateString("es-CO") : ""}
                      </span>
                    )}
                    {selected?.status === 'pending_user' && (
                      <span className="text-[10px] text-gray-400">Esperando respuesta del usuario</span>
                    )}
                    {!selected && pendingTarget && (
                      <span className="text-[10px]" style={{ color: "#606C38" }}>Nueva conversación</span>
                    )}
                  </div>
                </div>

                {/* Botón Resolver — solo en conversaciones activas */}
                {selected && !isResolved && (
                  <button
                    onClick={handleResolve}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 flex-shrink-0"
                    style={{ background: "rgba(96,108,56,0.12)", color: "#606C38", border: "1px solid rgba(96,108,56,0.3)" }}
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Resolver
                  </button>
                )}
              </div>

              {/* Hilo de mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: "#FEFAE0" }}>
                {(!selected || selected.messages.length === 0) ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-40">
                    <Mail className="w-10 h-10 mb-2" style={{ color: "#606C38" }} />
                    <p className="text-xs">Escribe el primer mensaje</p>
                  </div>
                ) : (
                  selected.messages.map(msg => {
                    const isAdmin = msg.sender === 'admin';
                    return (
                      <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                        <div
                          className="max-w-[76%] px-3.5 py-2.5 rounded-2xl text-sm shadow-sm"
                          style={
                            isAdmin
                              ? { background: "#606C38", color: "#fff", borderRadius: "18px 18px 4px 18px" }
                              : { background: "#fff", color: "#4A3728", border: "1px solid #E8C99A", borderRadius: "18px 18px 18px 4px" }
                          }
                        >
                          {!isAdmin && <p className="text-[10px] font-bold mb-0.5" style={{ color: "#606C38" }}>{msg.senderName}</p>}
                          {isAdmin  && <p className="text-[10px] font-bold mb-0.5 opacity-70">Tú</p>}
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

              {/* Input — oculto si la conversación está resuelta */}
              {!isResolved ? (
                <form onSubmit={handleSend} className="p-3 bg-white border-t flex gap-2" style={{ borderColor: "#E8C99A" }}>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={`Mensaje para ${selected?.userName ?? pendingTarget?.userName ?? "usuario"}...`}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: "1.5px solid #E8C99A", background: "#FEFAE0", color: "#4A3728" }}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || (!selected && !pendingTarget)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40 transition-opacity"
                    style={{ background: "#606C38", color: "#fff" }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="p-4 bg-white border-t text-xs text-center" style={{ borderColor: "#E8C99A", color: "#606C38" }}>
                  <CheckCircle className="inline w-3.5 h-3.5 mr-1" />
                  Conversación resuelta — solo lectura
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ color: "#6B5344" }}>
              <Mail className="w-14 h-14 opacity-15" />
              <div className="text-center">
                <p className="text-sm font-medium opacity-40">Selecciona una conversación</p>
                <p className="text-xs opacity-30">o inicia una nueva con un usuario</p>
              </div>
              <button
                onClick={() => setShowUserPicker(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80"
                style={{ background: "#606C38", color: "#fff" }}
              >
                <UserPlus className="w-4 h-4" /> Nueva conversación
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
