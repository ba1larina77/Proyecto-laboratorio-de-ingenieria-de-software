import { useShop } from "../../store/ShopContext";

export function Toast() {
  const { toast, toastType, dismissToast } = useShop();

  const colors: Record<string, { bg: string; icon: string }> = {
    success: { bg: "#606C38", icon: "✓" },
    error:   { bg: "#C0392B", icon: "⚠" },
    warning: { bg: "#B7791F", icon: "⚠" },
    info:    { bg: "#2980B9", icon: "ℹ" },
  };
  const c = colors[toastType] ?? colors.success;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-[9999] max-w-sm rounded-xl px-4 py-3.5 text-sm font-medium shadow-2xl transition-all duration-300 flex items-start gap-3 ${
        toast ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0 pointer-events-none"
      }`}
      style={{ backgroundColor: c.bg, color: "#FEFAE0" }}
    >
      <span className="flex-shrink-0 mt-0.5 text-base">{c.icon}</span>
      <span className="flex-1 leading-snug">{toast}</span>
      <button
        onClick={dismissToast}
        className="flex-shrink-0 ml-1 opacity-70 hover:opacity-100 transition-opacity leading-none"
        aria-label="Cerrar notificación"
      >
        ✕
      </button>
    </div>
  );
}
