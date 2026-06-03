import { useEffect, useRef } from "react";
import { Sparkles, Star, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useShop, fmt } from "../../store/ShopContext";

interface Props {
  /** En "catalog" la sección aparece contraída dentro del catálogo;
   *  en "home" aparece expandida con título más prominente. */
  context?: "catalog" | "home";
  onAddToCart?: (bookId: number) => void;
}

export function RecommendedBooks({ context = "catalog", onAddToCart }: Props) {
  const {
    user, recommendations, recommendationsLoading,
    refreshRecommendations, addToCart,
  } = useShop();

  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" });
  };

  // Recalcular cuando el usuario abre la sección
  useEffect(() => {
    if (user?.role === "cliente") refreshRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleAdd = (bookId: number) => {
    if (onAddToCart) onAddToCart(bookId);
    else addToCart(bookId);
  };

  if (!user || user.role !== "cliente") return null;

  return (
    <section className="mb-8">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #4A3728, #D4A373)" }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2
              className={context === "home" ? "text-xl font-bold" : "text-base font-bold"}
              style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}
            >
              Recomendados Para Ti
            </h2>
            {context === "home" && (
              <p className="text-xs mt-0.5" style={{ color: "#6B5344" }}>
                Basado en tus compras, calificaciones y búsquedas
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!recommendationsLoading && recommendations.length > 0 && (
            <>
              <button
                onClick={() => scroll("left")}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                style={{ background: "#F5EDD3", color: "#4A3728" }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                style={{ background: "#F5EDD3", color: "#4A3728" }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={refreshRecommendations}
            disabled={recommendationsLoading}
            title="Actualizar recomendaciones"
            className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-70 disabled:opacity-30"
            style={{ background: "#F5EDD3", color: "#4A3728" }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recommendationsLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Estado de carga */}
      {recommendationsLoading && (
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="flex-shrink-0 rounded-2xl animate-pulse"
              style={{ width: 160, height: 260, background: "#F5EDD3" }}
            />
          ))}
        </div>
      )}

      {/* Sin recomendaciones todavía */}
      {!recommendationsLoading && recommendations.length === 0 && (
        <div
          className="rounded-2xl p-6 text-center text-sm"
          style={{ background: "#F7F9F3", border: "1.5px dashed #D4A373", color: "#6B5344" }}
        >
          <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-40" style={{ color: "#D4A373" }} />
          <p className="font-medium" style={{ color: "#4A3728" }}>Aún no hay recomendaciones</p>
          <p className="text-xs mt-1 opacity-70">
            Realiza una compra, busca libros o califica títulos para comenzar a recibir sugerencias personalizadas.
          </p>
        </div>
      )}

      {/* Carrusel horizontal */}
      {!recommendationsLoading && recommendations.length > 0 && (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {recommendations.map(({ book, reason }) => (
            <RecommendationCard
              key={book.id}
              book={book}
              reason={reason}
              onAdd={() => handleAdd(book.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Tarjeta individual ────────────────────────────────────────
interface CardProps {
  book: {
    id: number;
    title: string;
    author: string;
    cover: string;
    price: number;
    rating: number;
    available: boolean;
    categories?: string[];
  };
  reason: string;
  onAdd: () => void;
}

function RecommendationCard({ book, reason, onAdd }: CardProps) {
  return (
    <div
      className="flex-shrink-0 rounded-2xl overflow-hidden group transition-all hover:shadow-lg"
      style={{
        width: 160,
        background: "#fff",
        boxShadow: "0 2px 12px rgba(74,55,40,0.08)",
        border: "1px solid #F5EDD3",
      }}
    >
      {/* Portada */}
      <div className="relative overflow-hidden" style={{ height: 140 }}>
        <img
          src={book.cover.includes("unsplash") ? `${book.cover}&w=320&q=70` : book.cover}
          alt={book.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=320&q=60";
          }}
        />
        {/* Badge de rating */}
        <div
          className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
          style={{ background: "rgba(74,55,40,0.85)", color: "#D4A373" }}
        >
          <Star className="w-2.5 h-2.5" fill="#D4A373" stroke="none" />
          {book.rating.toFixed(1)}
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5">
        {/* Motivo — badge de recomendación */}
        <div
          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full mb-1.5 line-clamp-2 leading-tight"
          style={{ background: "rgba(212,163,115,0.18)", color: "#7A5C35" }}
        >
          ✦ {reason}
        </div>

        <p
          className="text-xs font-semibold leading-tight line-clamp-2 mb-0.5"
          style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}
        >
          {book.title}
        </p>
        <p className="text-[10px] mb-2 truncate" style={{ color: "#6B5344", opacity: 0.8 }}>
          {book.author}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold" style={{ color: "#4A3728" }}>
            {fmt(book.price)}
          </span>
          {book.available ? (
            <button
              onClick={onAdd}
              className="text-[10px] font-semibold px-2 py-1 rounded-lg transition-opacity hover:opacity-80"
              style={{ background: "#4A3728", color: "#D4A373" }}
            >
              + Carrito
            </button>
          ) : (
            <span className="text-[9px] px-1.5 py-0.5 rounded-lg" style={{ background: "rgba(192,57,43,0.1)", color: "#C0392B" }}>
              Agotado
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
