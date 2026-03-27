import { useState, useRef, useEffect } from "react";
import { useShop, BOOKS, fmt } from "../../store/ShopContext";
import type { Book } from "../../store/shopTypes";

const CATEGORIES = ["Todos", "Ficción", "Ciencia", "Historia", "Filosofía", "Arte", "Poesía"];

// M6-HU4: Opciones de ordenamiento
const SORT_OPTIONS = [
  { value: "relevance", label: "Relevancia" },
  { value: "title_az", label: "Título A-Z" },
  { value: "title_za", label: "Título Z-A" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "rating_desc", label: "Mejor valorados" },
  { value: "newest", label: "Más recientes" },
];

// M6-HU6: Máximo 8 sugerencias agrupadas (Títulos, Autores, Categorías)
function getSuggestions(query: string): { type: "title" | "author" | "category"; text: string; book?: Book }[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const results: ReturnType<typeof getSuggestions> = [];

  // Títulos
  BOOKS.filter(b => b.title.toLowerCase().includes(q)).slice(0, 3).forEach(b =>
    results.push({ type: "title", text: b.title, book: b })
  );
  // Autores
  const authorsAdded = new Set<string>();
  BOOKS.filter(b => b.author.toLowerCase().includes(q)).forEach(b => {
    if (!authorsAdded.has(b.author) && results.filter(r => r.type === "author").length < 3) {
      authorsAdded.add(b.author);
      results.push({ type: "author", text: b.author });
    }
  });
  // Categorías
  const catMatches = CATEGORIES.filter(c => c !== "Todos" && c.toLowerCase().includes(q)).slice(0, 2);
  catMatches.forEach(cat => results.push({ type: "category", text: cat }));

  return results.slice(0, 8);
}

function sortBooks(books: Book[], sort: string): Book[] {
  const copy = [...books];
  switch (sort) {
    case "title_az": return copy.sort((a, b) => a.title.localeCompare(b.title, "es"));
    case "title_za": return copy.sort((a, b) => b.title.localeCompare(a.title, "es"));
    case "price_asc": return copy.sort((a, b) => a.price - b.price);
    case "price_desc": return copy.sort((a, b) => b.price - a.price);
    case "rating_desc": return copy.sort((a, b) => b.rating - a.rating);
    case "newest": return copy.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    default: return copy;
  }
}

export function Catalog() {
  const { addToCart, addReservation } = useShop();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState("relevance");
  const [isGrid, setIsGrid] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // M6-HU1, M6-HU6: Sugerencias dinámicas
  const suggestions = getSuggestions(search);

  // Cerrar sugerencias al clic fuera
  useEffect(() => {
    function onClickOut(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onClickOut);
    return () => document.removeEventListener("mousedown", onClickOut);
  }, []);

  // CU-CR-001: Búsqueda por título, autor, ISBN, editorial, idioma
  const filtered = BOOKS.filter(b => {
    const matchCat = category === "Todos" || b.category === category;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.isbn.includes(q);
    return matchCat && matchSearch;
  });

  // M6-HU4: Aplicar ordenamiento
  const sorted = sortBooks(filtered, sortBy);

  function applySuggestion(s: ReturnType<typeof getSuggestions>[0]) {
    if (s.type === "category") {
      setCategory(s.text);
      setSearch("");
    } else {
      setSearch(s.text);
    }
    setShowSuggestions(false);
  }

  const typeLabel = { title: "Título", author: "Autor", category: "Categoría" };
  const typeColor = { title: "#4A3728", author: "#606C38", category: "#2980B9" };
  const typeIcon = { title: "📖", author: "✍️", category: "🏷️" };

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>Catálogo de libros</h1>
        <p className="text-sm" style={{ color: "#6B5344", opacity: 0.8 }}>Explora, reserva o compra — más de 10,000 títulos disponibles</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center mb-4">

        {/* M6-HU1 + M6-HU6: Barra de búsqueda con sugerencias dinámicas */}
        <div className="relative flex-1 min-w-52" ref={searchRef}>
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" style={{ color: "#D4A373" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </span>
          <input
            type="text" value={search}
            onChange={e => { setSearch(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Buscar título, autor, ISBN…"
            className="w-full pl-10 pr-10 py-2.5 rounded-full text-sm outline-none transition-all"
            style={{ border: "1.5px solid #E8C99A", background: "#FEFAE0", color: "#4A3728" }}
          />
          {search && (
            <button onClick={() => { setSearch(""); setShowSuggestions(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#D4A373" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
          {/* Dropdown de sugerencias dinámicas (M6-HU6) */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl z-50 overflow-hidden"
              style={{ background: "#fff", boxShadow: "0 8px 32px rgba(74,55,40,0.18)", border: "1px solid #E8C99A" }}>
              {["title", "author", "category"].map(type => {
                const group = suggestions.filter(s => s.type === type);
                if (!group.length) return null;
                return (
                  <div key={type}>
                    <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: typeColor[type as keyof typeof typeColor], background: "#F5EDD3" }}>
                      {typeIcon[type as keyof typeof typeIcon]} {typeLabel[type as keyof typeof typeLabel]}s
                    </p>
                    {group.map((s, i) => (
                      <button key={i} onClick={() => applySuggestion(s)}
                        className="w-full text-left px-5 py-2.5 text-sm flex items-center gap-3 transition-all hover:opacity-80"
                        style={{ background: "#fff", color: "#4A3728" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#F5EDD3")}
                        onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
                        {s.book && (
                          <img src={s.book.cover} alt="" className="w-7 h-9 rounded object-cover flex-shrink-0"
                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        )}
                        <span>{s.text}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
          {/* CU-CR-001 Alterno A: no hay resultados */}
          {showSuggestions && search.length >= 2 && suggestions.length === 0 && !filtered.length && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl z-50 px-4 py-3"
              style={{ background: "#fff", boxShadow: "0 8px 32px rgba(74,55,40,0.18)", border: "1px solid #E8C99A" }}>
              <p className="text-sm" style={{ color: "#6B5344" }}>No se encontraron sugerencias para <strong>"{search}"</strong></p>
            </div>
          )}
        </div>

        {/* M6-HU4: Ordenar por */}
        <div className="relative">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="pl-3 pr-8 py-2.5 rounded-full text-xs font-medium outline-none appearance-none cursor-pointer"
            style={{ border: "1.5px solid #E8C99A", background: "#fff", color: "#4A3728" }}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <svg width="12" height="12" className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="#D4A373" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>

        {/* Vista grid/lista */}
        <div className="flex gap-1 rounded-lg p-1" style={{ background: "#F5EDD3" }}>
          {[true, false].map(grid => (
            <button key={String(grid)} onClick={() => setIsGrid(grid)}
              className="w-8 h-8 rounded-md flex items-center justify-center transition-all"
              style={isGrid === grid ? { background: "#fff", color: "#4A3728", boxShadow: "0 1px 4px rgba(74,55,40,0.15)" } : { color: "#6B5344" }}>
              {grid
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>}
            </button>
          ))}
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
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

      {/* Results count + sort info */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs" style={{ color: "#6B5344" }}>
          {sorted.length} {sorted.length === 1 ? "resultado" : "resultados"}
          {search ? ` para "${search}"` : ""}
          {category !== "Todos" ? ` en ${category}` : ""}
        </p>
        <p className="text-xs" style={{ color: "#6B5344", opacity: 0.7 }}>
          Ordenado por: {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
        </p>
      </div>

      {/* CU-CR-001 Alterno A: Sin resultados */}
      {sorted.length === 0 && (
        <div className="rounded-2xl p-12 text-center" style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="mx-auto mb-3" style={{ color: "#D4A373" }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <p className="font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>No se encontraron resultados</p>
          <p className="text-sm mb-4" style={{ color: "#6B5344" }}>No hay libros que coincidan con los criterios ingresados.</p>
          <button onClick={() => { setSearch(""); setCategory("Todos"); setSortBy("relevance"); }}
            className="px-5 py-2 rounded-xl text-sm font-medium"
            style={{ background: "#4A3728", color: "#FEFAE0" }}>
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Grid / List */}
      {sorted.length > 0 && (
        isGrid ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sorted.map(book => (
              <div key={book.id}
                className="rounded-2xl overflow-hidden transition-all hover:shadow-lg cursor-pointer group"
                style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}
                onClick={() => setSelectedBook(book)}>
                <div className="relative h-52 overflow-hidden">
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=450&fit=crop"; }} />
                  {book.isNew && (
                    <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "#606C38", color: "#fff" }}>Nuevo</span>
                  )}
                  {!book.available && (
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.45)" }}>
                      <span className="text-xs font-bold text-white px-2 py-1 rounded-lg" style={{ background: "rgba(192,57,43,0.9)" }}>Agotado</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold leading-tight mb-0.5 line-clamp-2"
                    style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>{book.title}</p>
                  <p className="text-xs mb-2" style={{ color: "#6B5344", opacity: 0.75 }}>{book.author}</p>
                  <div className="flex items-center gap-1 mb-3">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#D4A373" stroke="#D4A373" strokeWidth="1">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    <span className="text-xs font-medium" style={{ color: "#6B5344" }}>{book.rating}</span>
                  </div>
                  <p className="font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: "#4A3728" }}>{fmt(book.price)}</p>
                  {book.available ? (
                    <div className="flex gap-1.5">
                      <button onClick={e => { e.stopPropagation(); addToCart(book.id); }}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                        style={{ background: "#4A3728", color: "#FEFAE0" }}>
                        Comprar
                      </button>
                      <button onClick={e => { e.stopPropagation(); addReservation(book.id); }}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:opacity-80"
                        style={{ borderColor: "#D4A373", color: "#4A3728" }}>
                        Reservar
                      </button>
                    </div>
                  ) : (
                    <button disabled className="w-full py-1.5 rounded-lg text-xs font-semibold opacity-40"
                      style={{ background: "#F5EDD3", color: "#6B5344" }}>No disponible</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map(book => (
              <div key={book.id}
                className="flex gap-4 p-4 rounded-2xl transition-all hover:shadow-md cursor-pointer"
                style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}
                onClick={() => setSelectedBook(book)}>
                <div className="w-16 h-22 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=450&fit=crop"; }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-base leading-tight mb-0.5"
                        style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>{book.title}</p>
                      <p className="text-sm mb-1" style={{ color: "#6B5344" }}>{book.author}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "#F5EDD3", color: "#4A3728" }}>{book.category}</span>
                        {book.isNew && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "#606C38", color: "#fff" }}>Nuevo</span>}
                        <span className="flex items-center gap-1 text-xs" style={{ color: "#6B5344" }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="#D4A373" stroke="#D4A373" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                          {book.rating}
                        </span>
                        <span className="text-xs" style={{ color: "#6B5344", opacity: 0.6 }}>ISBN: {book.isbn}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>{fmt(book.price)}</p>
                      <p className="text-xs mt-1" style={{ color: book.available ? "#606C38" : "#C0392B" }}>
                        {book.available ? `${book.stock} en stock` : "Agotado"}
                      </p>
                    </div>
                  </div>
                  {book.available && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={e => { e.stopPropagation(); addToCart(book.id); }}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                        style={{ background: "#4A3728", color: "#FEFAE0" }}>
                        Añadir al carrito
                      </button>
                      <button onClick={e => { e.stopPropagation(); addReservation(book.id); }}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:opacity-80"
                        style={{ borderColor: "#D4A373", color: "#4A3728" }}>
                        Reservar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Book detail modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4"
          style={{ background: "rgba(74,55,40,0.5)" }}
          onClick={() => setSelectedBook(null)}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: "#fff", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(74,55,40,0.3)" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex gap-5 p-6">
              <img src={selectedBook.cover} alt={selectedBook.title}
                className="w-32 h-44 rounded-xl object-cover flex-shrink-0"
                onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=450&fit=crop"; }} />
              <div className="flex-1">
                <p className="text-2xl font-bold mb-1 leading-tight"
                  style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>{selectedBook.title}</p>
                <p className="text-sm mb-3" style={{ color: "#6B5344" }}>{selectedBook.author}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F5EDD3", color: "#4A3728" }}>{selectedBook.category}</span>
                  {selectedBook.isNew && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "#606C38", color: "#fff" }}>Nuevo</span>}
                </div>
                <p className="font-bold text-2xl mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>{fmt(selectedBook.price)}</p>
                <p className="text-xs mb-4" style={{ color: selectedBook.available ? "#606C38" : "#C0392B" }}>
                  {selectedBook.available ? `✓ ${selectedBook.stock} ejemplar(es) disponibles` : "✗ No disponible"}
                </p>
                <p className="text-xs mb-4" style={{ color: "#6B5344" }}>ISBN: {selectedBook.isbn}</p>
                {selectedBook.available && (
                  <div className="flex gap-2">
                    <button onClick={() => { addToCart(selectedBook.id); setSelectedBook(null); }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
                      style={{ background: "#4A3728", color: "#FEFAE0" }}>
                      Añadir al carrito
                    </button>
                    <button onClick={() => { addReservation(selectedBook.id); setSelectedBook(null); }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold border hover:opacity-80"
                      style={{ borderColor: "#D4A373", color: "#4A3728" }}>
                      Reservar
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 pb-6">
              <button onClick={() => setSelectedBook(null)}
                className="w-full py-2 rounded-xl text-sm text-center" style={{ color: "#6B5344" }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
