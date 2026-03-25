import { useState } from "react";
import { useShop, BOOKS, fmt } from "../../store/ShopContext";

const CATEGORIES = ["Todos", "Ficción", "Ciencia", "Historia", "Filosofía", "Arte", "Poesía"];

export function Catalog() {
  const { addToCart, addReservation } = useShop();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [isGrid, setIsGrid] = useState(true);

  const filtered = BOOKS.filter(b => {
    const matchCat = category === "Todos" || b.category === category;
    const q = search.toLowerCase();
    const matchSearch = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>Catálogo de libros</h1>
        <p className="text-sm" style={{ color: "#6B5344", opacity: 0.8 }}>Explora, reserva o compra — más de 10,000 títulos disponibles</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#D4A373" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </span>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar título, autor o ISBN…"
            className="w-full pl-10 pr-4 py-2.5 rounded-full text-sm outline-none transition-all"
            style={{ border: "1.5px solid #E8C99A", background: "#FEFAE0", color: "#4A3728" }}
            onFocus={e => e.target.style.borderColor = "#D4A373"}
            onBlur={e => e.target.style.borderColor = "#E8C99A"}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className="px-4 py-2 rounded-full text-xs font-semibold border transition-all"
              style={category === cat
                ? { background: "#4A3728", borderColor: "#4A3728", color: "#FEFAE0" }
                : { background: "#fff", borderColor: "#E8C99A", color: "#6B5344" }}>
              {cat}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg p-1" style={{ background: "#F5EDD3" }}>
          {[true, false].map((grid) => (
            <button key={String(grid)} onClick={() => setIsGrid(grid)}
              className="w-8 h-8 rounded-md flex items-center justify-center transition-all"
              style={isGrid === grid ? { background: "#fff", color: "#4A3728", boxShadow: "0 1px 4px rgba(74,55,40,0.15)" } : { color: "#6B5344" }}>
              {grid
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              }
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: "#6B5344", opacity: 0.6 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="mx-auto mb-3"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          <p className="text-sm">No se encontraron libros</p>
        </div>
      ) : isGrid ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {filtered.map(book => (
            <div key={book.id} className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer group" style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.10)", border: "1px solid transparent" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#E8C99A")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "transparent")}>
              <div className="relative overflow-hidden" style={{ aspectRatio: "2/3" }}>
                <img src={book.cover} alt={book.title} className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
                  onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=450&fit=crop"; }} />
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {book.isNew && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#606C38", color: "#fff" }}>✦ Nuevo</span>}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,.9)", color: book.available ? "#606C38" : "#C0392B" }}>
                    {book.available ? "Disponible" : "Sin stock"}
                  </span>
                </div>
              </div>
              <div className="p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(212,163,115,0.2)", color: "#4A3728" }}>{book.category}</span>
                  <span className="text-xs" style={{ color: "#6B5344" }}>⭐ {book.rating}</span>
                </div>
                <p className="text-sm font-semibold leading-tight mb-0.5 line-clamp-2" style={{ color: "#4A3728" }}>{book.title}</p>
                <p className="text-xs mb-2" style={{ color: "#6B5344", opacity: 0.75 }}>{book.author}</p>
                <p className="font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#4A3728" }}>{fmt(book.price)}</p>
                {book.available ? (
                  <div className="flex gap-1.5">
                    <button onClick={() => addReservation(book.id)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:opacity-80"
                      style={{ borderColor: "#D4A373", color: "#4A3728", background: "transparent" }}>
                      Reservar
                    </button>
                    <button onClick={() => addToCart(book.id)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                      style={{ background: "#4A3728", color: "#FEFAE0" }}>
                      Añadir
                    </button>
                  </div>
                ) : (
                  <button disabled className="w-full py-1.5 rounded-lg text-xs font-semibold border opacity-40 cursor-not-allowed" style={{ borderColor: "#D4A373", color: "#4A3728" }}>Sin stock</button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(book => (
            <div key={book.id} className="flex gap-4 rounded-2xl overflow-hidden transition-all hover:shadow-md" style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.08)", height: 140 }}>
              <div className="w-24 flex-shrink-0 overflow-hidden">
                <img src={book.cover} alt={book.title} className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=450&fit=crop"; }} />
              </div>
              <div className="flex-1 py-4 pr-4 flex flex-col justify-between">
                <div>
                  <p className="text-sm font-semibold leading-tight mb-0.5" style={{ color: "#4A3728" }}>{book.title}</p>
                  <p className="text-xs mb-1.5" style={{ color: "#6B5344", opacity: 0.75 }}>{book.author}</p>
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(212,163,115,0.2)", color: "#4A3728" }}>{book.category}</span>
                    <span className="text-xs" style={{ color: "#6B5344" }}>⭐ {book.rating}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold" style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#4A3728" }}>{fmt(book.price)}</span>
                  {book.available ? (
                    <div className="flex gap-2">
                      <button onClick={() => addReservation(book.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:opacity-80" style={{ borderColor: "#D4A373", color: "#4A3728" }}>Reservar</button>
                      <button onClick={() => addToCart(book.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90" style={{ background: "#4A3728", color: "#FEFAE0" }}>Añadir al carrito</button>
                    </div>
                  ) : <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B" }}>Sin stock</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
