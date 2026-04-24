import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { useShop } from "../../store/ShopContext";

export function ChatWidget() {
  const { user, chats, sendMessageToAdmin } = useShop();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const activeChat = chats.find(c => c.clientId === user?.id && c.status === 'active');
  const messages = activeChat ? activeChat.messages : [{ sender: 'admin' as const, text: '¡Hola! ¿En qué te podemos ayudar?' }];

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    
    sendMessageToAdmin(input.trim());
    setInput("");
  };

  if (!user || user.role !== "cliente") return null;

  return (
    <>
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[600] w-14 h-14 bg-[#4A3728] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform animate-in zoom-in">
          <MessageCircle className="w-6 h-6" style={{ color: "#D4A373" }} />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[600] w-80 bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in slide-in-from-bottom-2" style={{ borderColor: "rgba(0,0,0,0.1)", height: "420px" }}>
          <div className="p-4 flex items-center justify-between" style={{ background: "#4A3728" }}>
            <h3 className="font-bold flex items-center gap-2 text-[#FEFAE0]">
              <MessageCircle className="w-5 h-5" style={{ color: "#D4A373" }} /> Asistencia en línea
            </h3>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-80 text-white"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col" style={{ background: "#FEFAE0" }}>
            {messages.map((m, idx) => (
              <div key={idx} className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.sender === 'bot' || m.sender === 'admin' ? 'bg-white border rounded-tl-sm self-start text-gray-800 shadow-sm' : 'rounded-tr-sm self-end shadow-sm'}`} style={m.sender === 'user' ? { background: "#D4A373", color: "#4A3728" } : undefined}>
                <p>{m.text}</p>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-white border-t flex gap-2">
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 px-3 py-2 bg-gray-50 border rounded-xl outline-none text-sm"
              style={{ borderColor: "rgba(0,0,0,0.1)" }}
            />
            <button type="submit" className="w-10 h-10 rounded-xl flex flex-shrink-0 items-center justify-center hover:opacity-90 transition-opacity" style={{ background: "#606C38", color: "#fff" }}>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
