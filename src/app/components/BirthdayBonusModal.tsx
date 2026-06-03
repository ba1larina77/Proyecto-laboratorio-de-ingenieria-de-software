import { useEffect, useState } from "react";
import { X, Gift, Copy, Check, Sparkles } from "lucide-react";
import type { BirthdayCoupon } from "../utils/birthdayEmail";

interface BirthdayBonusModalProps {
  isOpen: boolean;
  coupon: BirthdayCoupon | null;
  userName: string;
  onClose: () => void;
}

export function BirthdayBonusModal({
  isOpen,
  coupon,
  userName,
  onClose,
}: BirthdayBonusModalProps) {
  const [copied, setCopied] = useState(false);
  const [confetti, setConfetti] = useState<{ id: number; x: number; color: string; delay: number; size: number }[]>([]);

  /* Generar confeti al abrir */
  useEffect(() => {
    if (!isOpen) return;
    const colors = ["#D4A373", "#606C38", "#4A3728", "#E8C99A", "#FEFAE0", "#a7c957", "#bc6c25"];
    const pieces = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 1.5,
      size: 6 + Math.random() * 8,
    }));
    setConfetti(pieces);
    setCopied(false);
  }, [isOpen]);

  if (!isOpen || !coupon) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const expiresDate = new Date(coupon.expiresAt).toLocaleDateString("es-CO", {
    day: "numeric", month: "long", year: "numeric",
  });

  const firstName = userName.split(" ")[0];

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(74, 55, 40, 0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Confetti */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {confetti.map((p) => (
          <div
            key={p.id}
            className="absolute animate-bounce"
            style={{
              left: `${p.x}%`,
              top: `-${p.size * 2}px`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              animation: `fall ${2 + p.delay}s linear ${p.delay}s forwards`,
              opacity: 0.9,
            }}
          />
        ))}
      </div>

      {/* Modal Card */}
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: "linear-gradient(135deg, #FEFAE0 0%, #fff8e7 50%, #FEFAE0 100%)" }}
      >
        {/* Header festivo */}
        <div
          className="relative px-8 pt-10 pb-8 text-center overflow-hidden"
          style={{ background: "linear-gradient(135deg, #4A3728 0%, #6B5344 100%)" }}
        >
          {/* Sparkle icons decorativos */}
          <Sparkles className="absolute top-4 left-5 w-5 h-5 text-[#D4A373] opacity-60 animate-spin" style={{ animationDuration: "4s" }} />
          <Sparkles className="absolute top-3 right-8 w-4 h-4 text-[#E8C99A] opacity-50 animate-spin" style={{ animationDuration: "6s" }} />
          <Sparkles className="absolute bottom-4 left-10 w-3 h-3 text-[#D4A373] opacity-40 animate-spin" style={{ animationDuration: "3s" }} />

          {/* Icono central */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-lg relative"
            style={{ background: "linear-gradient(135deg, #D4A373, #E8C99A)" }}>
            <span className="text-4xl select-none">🎂</span>
          </div>

          <h2 className="text-2xl font-bold text-[#FEFAE0] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            ¡Feliz Cumpleaños,<br />{firstName}! 🎉
          </h2>
          <p className="text-[#D4A373] text-sm font-medium">
            Hoy es un día muy especial para ti
          </p>
        </div>

        {/* Cuerpo */}
        <div className="px-8 py-6 space-y-5">
          {/* Mensaje principal */}
          <div className="text-center">
            <p className="text-[#4A3728] text-sm leading-relaxed">
              Desde todo el equipo de <span className="font-bold">Biblion</span> te deseamos un feliz cumpleaños. 🎁<br />
              Como regalo especial, tienes derecho a un descuento en tu próxima compra.
            </p>
          </div>

          {/* Badge de descuento */}
          <div className="flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border-2 border-dashed"
            style={{ borderColor: "#D4A373", backgroundColor: "#FFF8E7" }}>
            <Gift className="w-6 h-6 text-[#D4A373] flex-shrink-0" />
            <div className="text-center">
              <p className="text-xs text-[#6B5344] font-semibold uppercase tracking-widest">Tu regalo</p>
              <p className="text-2xl font-black text-[#4A3728]">15% de descuento</p>
              <p className="text-xs text-[#6B5344]">en tu próxima compra</p>
            </div>
          </div>

          {/* Código de cupón */}
          <div className="space-y-2">
            <p className="text-center text-xs font-bold text-[#6B5344] uppercase tracking-wider">
              Código del bono
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 py-3 px-4 rounded-xl text-center font-mono font-black text-lg tracking-widest"
                style={{ backgroundColor: "#4A3728", color: "#D4A373", letterSpacing: "0.2em" }}>
                {coupon.code}
              </div>
              <button
                onClick={handleCopy}
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0"
                style={{
                  backgroundColor: copied ? "#606C38" : "#E8C99A",
                  color: copied ? "white" : "#4A3728",
                  transform: copied ? "scale(1.1)" : "scale(1)",
                }}
                title={copied ? "¡Copiado!" : "Copiar código"}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            {copied && (
              <p className="text-center text-xs text-[#606C38] font-semibold animate-in fade-in slide-in-from-top-1">
                ✓ ¡Código copiado al portapapeles!
              </p>
            )}
          </div>

          {/* Info del cupón */}
          <div className="rounded-xl p-3 text-xs space-y-1" style={{ backgroundColor: "#F5EDD3" }}>
            <div className="flex justify-between text-[#6B5344]">
              <span>⚡ Uso único</span>
              <span>Solo para ti</span>
            </div>
            <div className="flex justify-between text-[#6B5344]">
              <span>📅 Válido hasta</span>
              <span className="font-semibold">{expiresDate}</span>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all duration-200 border border-[#E8C99A] text-[#6B5344] hover:bg-[#E8C99A]/20"
            >
              Cerrar
            </button>
            <button
              onClick={() => { handleCopy(); onClose(); }}
              className="flex-1 py-3 rounded-2xl font-bold text-sm text-white transition-all duration-200 shadow-lg"
              style={{ background: "linear-gradient(135deg, #606C38, #485229)" }}
            >
              ¡Copiar y aprovechar! 🎉
            </button>
          </div>
        </div>

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#D4A373] hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Keyframe de caída del confeti */}
      <style>{`
        @keyframes fall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
