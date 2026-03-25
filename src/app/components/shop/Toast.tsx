import { useShop } from "../../store/ShopContext";

export function Toast() {
  const { toast } = useShop();
  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] max-w-xs rounded-xl px-5 py-3.5 text-sm font-medium shadow-2xl transition-all duration-300 ${
        toast
          ? "translate-y-0 opacity-100"
          : "translate-y-16 opacity-0 pointer-events-none"
      }`}
      style={{ backgroundColor: "#4A3728", color: "#FEFAE0" }}
    >
      {toast}
    </div>
  );
}
