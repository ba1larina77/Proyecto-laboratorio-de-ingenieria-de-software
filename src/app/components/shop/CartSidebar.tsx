import { useShop, fmt } from "../../store/ShopContext";

interface CartSidebarProps {
  onCheckout: () => void;
}

export function CartSidebar({ onCheckout }: CartSidebarProps) {
  const { cart, cartOpen, closeCart, removeFromCart, changeQty } = useShop();
  const subtotal = cart.reduce((s, i) => s + i.book.price * i.qty, 0);
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${cartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ background: "rgba(74,55,40,0.4)" }}
        onClick={closeCart}
      />

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-50 flex flex-col w-full max-w-md transition-transform duration-300 ${cartOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ background: "#fff", boxShadow: "-8px 0 40px rgba(74,55,40,0.2)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "#E8C99A" }}>
          <h3 className="text-xl font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
            Carrito {totalQty > 0 && <span className="text-base font-normal" style={{ color: "#6B5344" }}>({totalQty})</span>}
          </h3>
          <button
            onClick={closeCart}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
            style={{ background: "#F5EDD3", color: "#4A3728" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full pb-16" style={{ color: "#6B5344", opacity: 0.6 }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="mb-4">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <p className="text-sm">Tu carrito está vacío</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.book.id} className="flex gap-4 py-4 border-b" style={{ borderColor: "#F5EDD3" }}>
                <div className="w-14 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.book.cover} alt={item.book.title} className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=450&fit=crop"; }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight mb-0.5 truncate" style={{ color: "#4A3728" }}>{item.book.title}</p>
                  <p className="text-xs mb-2" style={{ color: "#6B5344", opacity: 0.7 }}>{item.book.author}</p>
                  <p className="text-base font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>{fmt(item.book.price * item.qty)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => changeQty(item.book.id, -1)} className="w-7 h-7 rounded-md border flex items-center justify-center text-base transition-colors hover:opacity-80" style={{ borderColor: "#E8C99A", color: "#4A3728", background: "#FEFAE0" }}>−</button>
                    <span className="text-sm font-semibold w-5 text-center" style={{ color: "#4A3728" }}>{item.qty}</span>
                    <button onClick={() => changeQty(item.book.id, 1)} className="w-7 h-7 rounded-md border flex items-center justify-center text-base transition-colors hover:opacity-80" style={{ borderColor: "#E8C99A", color: "#4A3728", background: "#FEFAE0" }}>+</button>
                    <span className="text-xs ml-1" style={{ color: "#6B5344", opacity: 0.7 }}>{fmt(item.book.price)} c/u</span>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.book.id)} className="flex-shrink-0 p-1.5 rounded transition-colors hover:opacity-80" style={{ color: "#C0392B" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="px-6 py-5 border-t" style={{ borderColor: "#E8C99A" }}>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm" style={{ color: "#6B5344" }}>
                <span>Subtotal ({totalQty} ítems)</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm" style={{ color: "#6B5344" }}>
                <span>Envío</span><span>A calcular</span>
              </div>
              <div className="flex justify-between pt-3 border-t font-bold text-base" style={{ borderColor: "#E8C99A", color: "#4A3728" }}>
                <span>Total</span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18 }}>{fmt(subtotal)}</span>
              </div>
            </div>
            <button onClick={() => { closeCart(); onCheckout(); }}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "#4A3728", color: "#FEFAE0" }}>
              Proceder al pago →
            </button>
            <button onClick={closeCart} className="w-full py-2.5 mt-2 rounded-xl text-sm font-medium border transition-colors hover:opacity-80" style={{ borderColor: "#D4A373", color: "#4A3728" }}>
              Seguir comprando
            </button>
          </div>
        )}
      </div>
    </>
  );
}
