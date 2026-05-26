import { useState } from "react";
import { Star, Send, MessageSquare, ShieldCheck, Lock } from "lucide-react";
import { useShop } from "../../store/ShopContext";

interface Props {
  bookId: number;
}

function StarRating({
  value,
  onChange,
  readonly = false,
  size = 18,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: number;
}) {
  const [hovered, setHovered] = useState(0);
  const display = readonly ? value : hovered || value;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={readonly ? "cursor-default" : "cursor-pointer transition-transform hover:scale-110"}
        >
          <Star
            width={size}
            height={size}
            fill={n <= display ? "#D4A373" : "none"}
            stroke={n <= display ? "#D4A373" : "#D4A373"}
            strokeWidth={1.5}
            opacity={n <= display ? 1 : 0.35}
          />
        </button>
      ))}
    </div>
  );
}

function AvgRating({ avg, total }: { avg: number; total: number }) {
  const full  = Math.floor(avg);
  const half  = avg - full >= 0.5;

  return (
    <div className="flex items-center gap-3 py-3 px-4 rounded-xl" style={{ background: "#F5EDD3" }}>
      <span className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
        {avg.toFixed(1)}
      </span>
      <div>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map(n => (
            <Star
              key={n}
              width={16}
              height={16}
              fill={n <= full ? "#D4A373" : n === full + 1 && half ? "url(#halfGrad)" : "none"}
              stroke="#D4A373"
              strokeWidth={1.5}
              opacity={n <= full || (n === full + 1 && half) ? 1 : 0.3}
            />
          ))}
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#6B5344" }}>
          {total} reseña{total !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}

export function BookReviews({ bookId }: Props) {
  const { user, getBookReviews, getBookAvgRating, submitReview, hasPurchasedBook, hasReviewedBook } = useShop();

  const bookReviews  = getBookReviews(bookId);
  const avg          = getBookAvgRating(bookId);
  const canReview    = hasPurchasedBook(bookId);
  const alreadyDone  = hasReviewedBook(bookId);

  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setFeedback(null);
    const result = await submitReview(bookId, rating, comment);
    setLoading(false);
    if (result.success) {
      setFeedback({ type: "ok", msg: "¡Reseña publicada con éxito!" });
      setRating(0);
      setComment("");
    } else {
      setFeedback({ type: "err", msg: result.error ?? "Error desconocido" });
    }
  };

  return (
    <div className="border-t pt-5 mt-2" style={{ borderColor: "#E8C99A" }}>
      {/* Título sección */}
      <h3 className="font-bold text-base mb-4 flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
        <MessageSquare className="w-4 h-4" style={{ color: "#D4A373" }} />
        Reseñas
      </h3>

      {/* Promedio */}
      {avg !== null && (
        <div className="mb-5">
          <AvgRating avg={avg} total={bookReviews.length} />
        </div>
      )}

      {/* ── Formulario condicional ── */}
      {!user ? (
        <div className="rounded-xl p-4 mb-5 text-sm flex items-center gap-2"
          style={{ background: "rgba(74,55,40,0.06)", color: "#6B5344", border: "1px solid #E8C99A" }}>
          <Lock className="w-4 h-4 flex-shrink-0" />
          Inicia sesión para escribir una reseña.
        </div>
      ) : alreadyDone ? (
        <div className="rounded-xl p-4 mb-5 text-sm flex items-center gap-2"
          style={{ background: "rgba(96,108,56,0.08)", color: "#606C38", border: "1px solid rgba(96,108,56,0.3)" }}>
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          Ya has enviado una reseña para este libro. ¡Gracias!
        </div>
      ) : canReview ? (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl p-4 space-y-3"
          style={{ background: "#F7F9F3", border: "1px solid #E8C99A" }}>
          <p className="text-xs font-semibold" style={{ color: "#4A3728" }}>Tu calificación</p>
          <StarRating value={rating} onChange={setRating} size={24} />

          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Escribe tu reseña aquí..."
            rows={3}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
            style={{ border: "1.5px solid #E8C99A", background: "#fff", color: "#4A3728" }}
          />

          {feedback && (
            <p className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{
                background: feedback.type === "ok" ? "rgba(96,108,56,0.1)" : "rgba(192,57,43,0.08)",
                color: feedback.type === "ok" ? "#606C38" : "#C0392B",
              }}>
              {feedback.msg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || rating === 0 || !comment.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 transition-opacity"
            style={{ background: "#4A3728", color: "#D4A373" }}
          >
            <Send className="w-3.5 h-3.5" />
            {loading ? "Publicando..." : "Publicar reseña"}
          </button>
        </form>
      ) : user.role === "cliente" ? (
        <div className="rounded-xl p-4 mb-5 text-sm flex items-center gap-2"
          style={{ background: "rgba(74,55,40,0.06)", color: "#6B5344", border: "1px solid #E8C99A" }}>
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          Solo puedes reseñar libros que hayas comprado y recibido.
        </div>
      ) : null}

      {/* ── Lista de reseñas ── */}
      {bookReviews.length === 0 ? (
        <p className="text-xs text-center py-4" style={{ color: "#9ca3af" }}>
          Aún no hay reseñas para este libro. ¡Sé el primero!
        </p>
      ) : (
        <div className="space-y-4">
          {bookReviews.map(r => (
            <div key={r.id} className="rounded-xl p-4" style={{ background: "#fff", border: "1px solid #F5EDD3" }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: "#4A3728", color: "#D4A373" }}
                  >
                    {r.userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "#4A3728" }}>{r.userName}</span>
                </div>
                <StarRating value={r.rating} readonly size={14} />
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#4A3728" }}>{r.comment}</p>
              <p className="text-[10px] mt-2 opacity-40">
                {new Date(r.createdAt).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
