import { useShop } from "../../store/ShopContext";

export function Toast() {
  const { toast, toastType } = useShop();

  const colors = {
    success: { bg: "#4A3728", icon: "✓" },
    error:   { bg: "#C0392B", icon: "⚠️" },
    info:    { bg: "#2980B9", icon: "ℹ️" },
  };
  const c = colors[toastType] || colors.success;

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] max-w-sm rounded-xl px-5 py-3.5 text-sm font-medium shadow-2xl transition-all duration-300 flex items-start gap-3 ${
        toast ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0 pointer-events-none"
      }`}
      style={{ backgroundColor: c.bg, color: "#FEFAE0" }}
    >
      <span className="flex-shrink-0 mt-0.5">{c.icon}</span>
      <span>{toast}</span>
    </div>
  );
}
