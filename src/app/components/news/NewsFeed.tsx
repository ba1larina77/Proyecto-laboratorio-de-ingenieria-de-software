/**
 * M1-HU5 — Noticias automáticas por nuevo libro
 *
 * Como sistema, al registrar un libro se publica una noticia con título,
 * autor, género, precio y fecha de ingreso. Si la publicación falla, queda
 * pendiente con un mecanismo de reproceso.
 *
 * Este componente es de SOLO LECTURA para clientes/visitantes y muestra
 * controles de reproceso para administradores/root.
 */
import { useMemo, useState } from "react";
import { useShop, fmt } from "../../store/ShopContext";
import type { News } from "../../store/shopTypes";

function fmtDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-CO", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function fmtTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("es-CO", {
    hour: "2-digit", minute: "2-digit",
  });
}

interface NewsCardProps {
  item: News;
  isAdmin: boolean;
}

function NewsCard({ item, isAdmin }: NewsCardProps) {
  const isPending = item.status === "pending";
  return (
    <article
      className="rounded-2xl p-5 transition-all"
      style={{
        background: isPending ? "#FFF8E1" : "#FEFAE0",
        border: `1.5px solid ${isPending ? "#E0A800" : "#E8C99A"}`,
        boxShadow: "0 2px 8px rgba(74,55,40,0.06)",
      }}
    >
      {/* Status badge */}
      <div className="flex justify-between items-start mb-2.5">
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide"
          style={{
            background: isPending ? "rgba(224,168,0,0.18)" : "rgba(96,108,56,0.15)",
            color: isPending ? "#8A6500" : "#606C38",
          }}
        >
          {isPending ? "⏳ Pendiente de publicación" : "✓ Publicado"}
        </span>
        <span className="text-[11px]" style={{ color: "#6B5344" }}>
          {fmtDate(item.publishedAt)} · {fmtTime(item.publishedAt)}
        </span>
      </div>

      {/* Title */}
      <h3
        className="text-lg font-bold mb-2 leading-snug"
        style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}
      >
        {item.title}
      </h3>

      {/* Body */}
      <p className="text-sm mb-3 leading-relaxed" style={{ color: "#4A3728" }}>
        {item.body}
      </p>

      {/* Book details strip */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl text-xs"
        style={{ background: "rgba(212,163,115,0.12)" }}
      >
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#6B5344" }}>
            Título
          </div>
          <div className="font-medium" style={{ color: "#4A3728" }}>{item.bookTitle}</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#6B5344" }}>
            Autor
          </div>
          <div className="font-medium" style={{ color: "#4A3728" }}>{item.bookAuthor}</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#6B5344" }}>
            Género
          </div>
          <div className="font-medium" style={{ color: "#4A3728" }}>{item.bookCategory}</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#6B5344" }}>
            Precio
          </div>
          <div className="font-bold" style={{ color: "#606C38" }}>{fmt(item.bookPrice)}</div>
        </div>
      </div>

      {/* Error info (admin only, on pending) */}
      {isAdmin && isPending && item.lastError && (
        <div
          className="mt-3 px-3 py-2 rounded-lg text-xs font-mono"
          style={{ background: "rgba(192,57,43,0.10)", color: "#9B3C2F" }}
        >
          ⚠️ Último error: {item.lastError} (intentos: {item.retries ?? 0})
        </div>
      )}
    </article>
  );
}

export function NewsFeed() {
  const { user, news, retryPendingNews, showToast } = useShop();
  const [filter, setFilter] = useState<"all" | "published" | "pending">("all");

  const isAdmin = user?.role === "admin" || user?.role === "root";

  const filtered = useMemo(() => {
    if (filter === "all") return news;
    return news.filter(n => n.status === filter);
  }, [news, filter]);

  const stats = useMemo(() => ({
    total: news.length,
    published: news.filter(n => n.status === "published").length,
    pending: news.filter(n => n.status === "pending").length,
  }), [news]);

  function handleRetry() {
    const { recovered, stillFailing } = retryPendingNews();
    if (recovered === 0 && stillFailing === 0) {
      showToast("No hay noticias pendientes", "info");
    } else if (recovered > 0) {
      showToast(`✓ ${recovered} noticia(s) publicada(s) en reproceso`, "success");
    } else {
      showToast(`${stillFailing} noticia(s) siguen pendientes`, "warning");
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
          📰 Noticias y Novedades
        </h1>
        <p className="text-sm" style={{ color: "#6B5344" }}>
          {isAdmin
            ? "Publicaciones automáticas al registrar libros nuevos. Las noticias pendientes pueden reprocesarse."
            : "Mantente al día con las últimas novedades del catálogo."}
        </p>
      </div>

      {/* Stats + filter bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between mb-6 p-4 rounded-2xl"
           style={{ background: "#FEFAE0", border: "1.5px solid #E8C99A" }}>
        <div className="flex flex-wrap gap-4 text-sm">
          <span style={{ color: "#4A3728" }}>
            <strong>{stats.total}</strong> total
          </span>
          <span style={{ color: "#606C38" }}>
            <strong>{stats.published}</strong> publicadas
          </span>
          {stats.pending > 0 && (
            <span style={{ color: "#E0A800" }}>
              <strong>{stats.pending}</strong> pendientes
            </span>
          )}
        </div>

        <div className="flex gap-2 items-center">
          {/* Filter buttons */}
          {(["all", "published", "pending"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{
                background: filter === f ? "#606C38" : "transparent",
                color: filter === f ? "#FEFAE0" : "#4A3728",
                border: `1.5px solid ${filter === f ? "#606C38" : "#E8C99A"}`,
              }}
            >
              {f === "all" ? "Todas" : f === "published" ? "Publicadas" : "Pendientes"}
            </button>
          ))}

          {/* Retry button — admin only */}
          {isAdmin && stats.pending > 0 && (
            <button
              onClick={handleRetry}
              className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all hover:opacity-80"
              style={{ background: "#C0392B", color: "#FEFAE0", border: "1.5px solid #C0392B" }}
            >
              🔄 Reprocesar ({stats.pending})
            </button>
          )}
        </div>
      </div>

      {/* News list */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl"
          style={{ background: "#FEFAE0", border: "1.5px dashed #D4A373", color: "#6B5344" }}
        >
          <div className="text-5xl mb-3">📭</div>
          <p className="font-medium">
            {filter === "pending"
              ? "No hay noticias pendientes"
              : filter === "published"
                ? "Aún no se han publicado noticias"
                : "Aún no hay noticias. Al registrar un nuevo libro se publicará automáticamente."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(n => (
            <NewsCard key={n.id} item={n} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}
