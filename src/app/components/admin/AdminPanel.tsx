import { useState } from "react";
import { Link } from "react-router";
import { useShop, fmt } from "../../store/ShopContext";
import type { Book } from "../../store/shopTypes";

// M1-HU4: Categoría especial para libros sin stock
const CATEGORIA_AGOTADO = "Histórico Agotado";

const GENRES = [
  "Ficción","No Ficción","Ciencia","Historia","Arte",
  "Filosofía","Poesía","Tecnología","Infantil","Novela Gráfica",
];
const LANGUAGES = ["Español","Inglés","Francés","Alemán","Portugués","Italiano"];

// BookForm usa categories[] (multi-selección) y persiste publisher/publishDate/pages
interface BookForm {
  title: string;
  author: string;
  categories: string[];   // multi-categoría
  price: number;
  stock: number;
  cover: string;
  isbn: string;
  year: number;
  pages: number;
  publisher: string;
  language: string;
  publishDate: string;
  status: "new" | "used";
}

const emptyForm: BookForm = {
  title: "", author: "", categories: [], price: 0, stock: 0,
  cover: "", isbn: "",
  year: new Date().getFullYear(), pages: 0, publisher: "",
  language: "Español", publishDate: "", status: "new",
};

function validate(f: BookForm, isEditing = false): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.title.trim())              e.title      = "El título es obligatorio";
  if (!f.author.trim())             e.author     = "El autor es obligatorio";
  if (!f.isbn.trim())               e.isbn       = "El ISBN es obligatorio";
  else if (!/^\d{10,13}$/.test(f.isbn.replace(/-/g, "")))
                                    e.isbn       = "ISBN debe tener 10 o 13 dígitos";
  if (f.categories.length === 0)    e.categories = "Selecciona al menos una categoría";
  if (!f.price || f.price < 0)      e.price      = "El precio es obligatorio";
  if (f.stock < 0)                  e.stock      = "El stock no puede ser negativo";
  // Campos de detalle: obligatorios al registrar, opcionales al editar
  if (!isEditing) {
    if (!f.year || f.year < 1000 || f.year > new Date().getFullYear())
                                    e.year       = "Año inválido";
    if (!f.pages || f.pages < 1)    e.pages      = "Número de páginas inválido";
    if (!f.publisher.trim())        e.publisher  = "La editorial es obligatoria";
    if (!f.language)                e.language   = "Selecciona un idioma";
    if (!f.publishDate)             e.publishDate = "La fecha de publicación es obligatoria";
  }
  return e;
}

// ── Modal de gestión de stock (HU3 y HU4) ─────────────────────────────────
interface StockModalState {
  book: Book;
  mode: "descuento" | "actualizar"; // HU3 = descuento, HU4 = actualizar
}

function StockModal({
  state, onClose, onConfirm,
}: {
  state: StockModalState;
  onClose: () => void;
  onConfirm: (newStock: number) => void;
}) {
  const [value, setValue] = useState<number>(0);
  const [error, setError] = useState("");
  const { book, mode } = state;

  const isDescuento = mode === "descuento";

  function handleConfirm() {
    if (isNaN(value) || value < 0) {
      setError("Ingresa un número válido mayor o igual a 0");
      return;
    }
    if (isDescuento) {
      // M1-HU3: cantidad a eliminar no puede superar stock actual
      if (value <= 0) {
        setError("Ingresa al menos 1 ejemplar a descontar");
        return;
      }
      if (value > book.stock) {
        setError(
          `No puedes eliminar más ejemplares de los disponibles. Stock actual: ${book.stock}`
        );
        return;
      }
      onConfirm(book.stock - value);
    } else {
      // M1-HU4: actualizar a cualquier valor
      if (value < 0) {
        setError("El stock no puede ser negativo");
        return;
      }
      onConfirm(value);
    }
  }

  const resultStock = isDescuento ? book.stock - (value || 0) : (value || 0);

  return (
    <div
      className="fixed inset-0 z-[700] flex items-center justify-center p-4"
      style={{ background: "rgba(74,55,40,0.55)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-7"
        style={{ background: "#fff", boxShadow: "0 24px 80px rgba(74,55,40,0.3)" }}
      >
        {/* Header */}
        <h3
          className="text-xl font-bold mb-1"
          style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}
        >
          {isDescuento ? "Eliminar ejemplares" : "Actualizar existencias"}
        </h3>
        <p className="text-sm mb-5" style={{ color: "#6B5344" }}>
          <strong>{book.title}</strong>
        </p>

        {/* Info actual */}
        <div
          className="rounded-xl p-4 mb-5 flex items-center justify-between"
          style={{ background: "#F5EDD3" }}
        >
          <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: "#6B5344" }}>Stock actual</p>
            <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
              {book.stock}
            </p>
          </div>
          {value > 0 && !error && (
            <div className="text-right">
              <p className="text-xs font-medium mb-0.5" style={{ color: "#6B5344" }}>
                {isDescuento ? "Stock resultante" : "Nuevo stock"}
              </p>
              <p
                className="text-2xl font-bold"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: resultStock === 0 ? "#C0392B" : "#606C38",
                }}
              >
                {resultStock}
              </p>
              {resultStock === 0 && (
                <p className="text-xs mt-0.5 font-semibold" style={{ color: "#C0392B" }}>
                  → Histórico Agotado
                </p>
              )}
            </div>
          )}
        </div>

        {/* Campo numérico */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5" style={{ color: "#4A3728" }}>
            {isDescuento
              ? "Cantidad a eliminar *"
              : "Nueva cantidad de existencias *"}
          </label>
          <input
            type="number"
            min={0}
            max={isDescuento ? book.stock : undefined}
            value={value}
            onChange={e => {
              setValue(Number(e.target.value));
              setError("");
            }}
            autoFocus
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none text-center text-xl font-bold"
            style={{
              border: `1.5px solid ${error ? "#C0392B" : "#E8C99A"}`,
              background: "#FEFAE0",
              color: "#4A3728",
            }}
          />
          {error && (
            <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "#C0392B" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </p>
          )}
        </div>

        {/* Advertencia si HU4 y stock = 0 */}
        {!isDescuento && value === 0 && (
          <div
            className="rounded-lg p-3 mb-4 flex items-start gap-2 text-xs"
            style={{ background: "rgba(192,57,43,0.08)", border: "1px solid #C0392B" }}
          >
            <span>⚠️</span>
            <p style={{ color: "#C0392B" }}>
              Al establecer stock en 0, el libro quedará marcado como <strong>Agotado</strong>.
              Sus categorías originales se conservarán.
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium border"
            style={{ borderColor: "#D4A373", color: "#4A3728" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
            style={{
              background: isDescuento ? "#C0392B" : "#606C38",
              color: "#fff",
            }}
          >
            {isDescuento ? "Descontar ejemplares" : "Actualizar stock"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
export function AdminPanel() {
  const { books, addBook, updateBook, deleteBook, showToast } = useShop();

  const [tab, setTab]         = useState<"list" | "register" | "edit">("list");
  const [form, setForm]       = useState<BookForm>({ ...emptyForm });
  const [editId, setEditId]   = useState<number | null>(null);
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving]   = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [searchAdmin, setSearchAdmin] = useState("");

  // M1-HU3 y M1-HU4: estado del modal de gestión de stock
  const [stockModal, setStockModal] = useState<StockModalState | null>(null);
  const [expandedCopyIds, setExpandedCopyIds] = useState<number | null>(null);

  const previewId = editId ?? (books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    const numFields = ["year","pages","price","stock"];
    const updated = { ...form, [name]: numFields.includes(name) ? Number(value) : value };
    setForm(updated);
    if (touched[name]) {
      const errs = validate(updated, editId !== null);
      setErrors(prev => ({ ...prev, [name]: errs[name] || "" }));
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const errs = validate(form, editId !== null);
    setErrors(prev => ({ ...prev, [name]: errs[name] || "" }));
  }

  function handleEdit(book: Book) {
    setEditId(book.id);
    setForm({
      // Campos de Book — se pre-cargan con los valores actuales
      title:       book.title,
      author:      book.author,
      // Compatibilidad: si el libro antiguo tiene category (string), lo convertimos
      categories:  (book.categories ?? []).length > 0
                     ? book.categories
                     : (book as any).category ? [(book as any).category] : [],
      price:       book.price,
      stock:       book.stock,
      cover:       book.cover ?? "",
      isbn:        book.isbn ?? "",
      status:      book.isNew ? "new" : "used",
      // Campos de detalle — se recuperan si ya fueron guardados
      publisher:   book.publisher   ?? "",
      publishDate: book.publishDate ?? "",
      pages:       book.pages       ?? 0,
      // Idioma y año no se persisten aún; quedan en defaults
      year:        new Date().getFullYear(),
      language:    "Español",
    });
    setErrors({});
    setTouched({});
    setTab("edit");
  }

  function handleSubmit() {
    const allTouched: Record<string, boolean> = {};
    Object.keys(form).forEach(k => { allTouched[k] = true; });
    setTouched(allTouched);
    const errs = validate(form, editId !== null);
    setErrors(errs);
    if (Object.values(errs).some(v => v)) return;

    const isbnDup = books.find(b => b.isbn === form.isbn.trim() && b.id !== editId);
    if (isbnDup) { setErrors(p => ({ ...p, isbn: "Este ISBN ya está registrado" })); return; }

    setSaving(true);
    setTimeout(() => {
      // M1-HU4: las categorías reales siempre se mantienen; nunca se reemplaza con CATEGORIA_AGOTADO
      // El estado de agotado se refleja en `available` y `stock`, no en las categorías.
      const realCategories = form.categories.filter(c => c !== CATEGORIA_AGOTADO);

      if (editId !== null) {
        updateBook(editId, {
          title: form.title, author: form.author,
          categories: realCategories,
          price: form.price, stock: form.stock, cover: form.cover, isbn: form.isbn,
          available: form.stock > 0, isNew: form.status === "new",
          publisher:   form.publisher   || undefined,
          publishDate: form.publishDate || undefined,
          pages:       form.pages       || undefined,
        });
        setSuccessMsg(`✓ "${form.title}" actualizado correctamente`);
      } else {
        // M1-HU6: addBook genera ID único y copyIds automáticamente
        const created = addBook({
          title: form.title, author: form.author,
          categories: finalCategories,
          price: form.price, stock: form.stock, cover: form.cover,
          isbn: form.isbn || undefined,
          available: form.stock > 0,
          rating: 0,
          isNew: form.status === "new",
          publisher:   form.publisher   || undefined,
          publishDate: form.publishDate || undefined,
          pages:       form.pages       || undefined,
        });
        const copiesLabel = created.copyIds.length > 0
          ? ` · Ejemplares: ${created.copyIds.slice(0, 5).join(", ")}${created.copyIds.length > 5 ? `… (${created.copyIds.length} total)` : ""}`
          : "";
        setSuccessMsg(`✓ Libro registrado con ID: ${created.id}${copiesLabel} · ISBN: ${created.isbn}`);
      }
      setSaving(false);
      setForm({ ...emptyForm }); setEditId(null);
      setErrors({}); setTouched({});
      setTab("list");
      setTimeout(() => setSuccessMsg(""), 5000);
    }, 700);
  }

  function handleDelete(id: number) {
    deleteBook(id);
    setPendingDelete(null);
    setSuccessMsg("✓ Libro eliminado del inventario");
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  // M1-HU3: Descontar ejemplares (validado en el modal)
  // M1-HU4: Actualizar existencias a valor arbitrario
  function handleStockConfirm(newStock: number) {
    if (!stockModal) return;
    const { book } = stockModal;

    // M1-HU4: solo actualizar stock y disponibilidad; las categorías reales no se tocan.
    // El estado "agotado" queda reflejado en `available: false` y `stock: 0`.
    updateBook(book.id, {
      stock: newStock,
      available: newStock > 0,
    });

    const verb = stockModal.mode === "descuento"
      ? `Ejemplares descontados. Nuevo stock: ${newStock}`
      : `Stock actualizado a ${newStock}`;
    const extra = newStock === 0 ? " — El libro quedó sin existencias" : "";
    setSuccessMsg(`✓ ${verb}${extra}`);
    setTimeout(() => setSuccessMsg(""), 4000);
    setStockModal(null);
    showToast(`${verb}${extra}`, newStock === 0 ? "error" : "success");
  }

  const filteredBooks = books.filter(b =>
    !searchAdmin ||
    b.title.toLowerCase().includes(searchAdmin.toLowerCase()) ||
    b.author.toLowerCase().includes(searchAdmin.toLowerCase()) ||
    b.isbn.includes(searchAdmin) ||
    String(b.id).includes(searchAdmin)
  );

  const FieldErr = ({ name }: { name: string }) =>
    touched[name] && errors[name]
      ? <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#C0392B" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {errors[name]}
        </p>
      : null;

  const inputStyle = (name: string) => ({
    border: `1.5px solid ${touched[name] && errors[name] ? "#C0392B" : "#E8C99A"}`,
    background: "#FEFAE0", color: "#4A3728",
  });

  return (
    <div>
      {/* Modal de stock (HU3 y HU4) */}
      {stockModal && (
        <StockModal
          state={stockModal}
          onClose={() => setStockModal(null)}
          onConfirm={handleStockConfirm}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-start mb-7">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
            Administración de Libros
          </h1>
          <p className="text-sm" style={{ color: "#6B5344", opacity: 0.8 }}>
            {books.length} libros en el inventario · Los cambios se reflejan en el catálogo del cliente en tiempo real
          </p>
        </div>
        {tab === "list" && (
          <div className="flex gap-2">
            <Link to="/profile" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90" style={{ background: "#D4A373", color: "#4A3728" }}>
              Editar Perfil
            </Link>
            <button
              onClick={() => { setForm({ ...emptyForm }); setEditId(null); setErrors({}); setTouched({}); setTab("register"); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
              style={{ background: "#4A3728", color: "#FEFAE0" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Registrar libro
            </button>
          </div>
        )}
      </div>

      {/* Mensaje de éxito */}
      {successMsg && (
        <div className="rounded-xl px-5 py-3.5 mb-5 flex items-center gap-3"
          style={{ background: "rgba(96,108,56,0.1)", border: "1.5px solid #606C38" }}>
          <p className="text-sm font-medium" style={{ color: "#606C38" }}>{successMsg}</p>
        </div>
      )}

      {/* ── LISTA ── */}
      {tab === "list" && (
        <div>
          <div className="relative mb-4">
            <svg width="16" height="16" className="absolute left-3.5 top-1/2 -translate-y-1/2"
              viewBox="0 0 24 24" fill="none" stroke="#D4A373" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input value={searchAdmin} onChange={e => setSearchAdmin(e.target.value)}
              placeholder="Buscar por título, autor, ISBN o ID…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: "1.5px solid #E8C99A", background: "#FEFAE0", color: "#4A3728" }} />
          </div>

          <div className="rounded-2xl overflow-x-auto" style={{ boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}>
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr style={{ background: "#4A3728", color: "#FEFAE0" }}>
                  {["ID","Título","Autor","Categoría","ISBN","Precio","Stock","Estado","Acciones"].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredBooks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-sm" style={{ color: "#6B5344" }}>
                      {searchAdmin ? "Sin resultados para esa búsqueda" : "No hay libros registrados"}
                    </td>
                  </tr>
                ) : filteredBooks.map((b, i) => (
                  <tr key={b.id} style={{ background: i % 2 === 0 ? "#fff" : "#FEFAE0" }}>
                    <td className="px-3 py-3">
                      {/* Botón ID — clic para expandir/colapsar ejemplares */}
                      <button
                        onClick={() => setExpandedCopyIds(expandedCopyIds === b.id ? null : b.id)}
                        className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-lg hover:opacity-75 transition-opacity"
                        style={{ background: "#F5EDD3", color: "#4A3728" }}
                        title="Ver IDs de ejemplares"
                      >
                        <span className="font-bold">{b.id}</span>
                        <svg
                          width="9" height="9" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5"
                          style={{ transform: expandedCopyIds === b.id ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                        >
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </button>

                      {/* Desplegable de IDs de ejemplares */}
                      {expandedCopyIds === b.id && (
                        <div className="mt-1.5 rounded-lg p-2"
                          style={{ background: "rgba(74,55,40,0.06)", border: "1px solid #E8C99A", minWidth: 120, maxWidth: 180 }}>
                          <p className="text-[10px] font-semibold mb-1.5" style={{ color: "#6B5344" }}>
                            Ejemplares ({(b.copyIds ?? []).length})
                          </p>
                          {!b.copyIds || b.copyIds.length === 0 ? (
                            <p className="text-[10px] italic" style={{ color: "#C0392B" }}>Sin ejemplares en stock</p>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {b.copyIds.map(cid => (
                                <span key={cid}
                                  className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                                  style={{ background: "#fff", border: "1px solid #D4A373", color: "#4A3728" }}>
                                  {cid}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 font-medium max-w-[140px] truncate" style={{ color: "#4A3728" }}>
                      {b.title}
                    </td>
                    <td className="px-3 py-3 text-xs" style={{ color: "#6B5344" }}>{b.author}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                      {(b.categories ?? []).filter(cat => cat !== CATEGORIA_AGOTADO).map(cat => (
                        <span key={cat} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "#F5EDD3", color: "#4A3728" }}>
                          {cat}
                        </span>
                      ))}
                      {(b.categories ?? []).filter(cat => cat !== CATEGORIA_AGOTADO).length === 0 && (
                        <span className="text-xs italic" style={{ color: "#C0392B" }}>Sin categoría</span>
                      )}
                    </div>
                    </td>
                    <td className="px-3 py-3 text-xs font-mono" style={{ color: "#6B5344" }}>{b.isbn}</td>
                    <td className="px-3 py-3 text-xs font-semibold"
                      style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
                      {fmt(b.price)}
                    </td>
                    <td className="px-3 py-3 text-xs font-bold" style={{ color: b.stock > 0 ? "#606C38" : "#C0392B" }}>
                      {b.stock}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: b.available ? "rgba(96,108,56,0.1)" : "rgba(192,57,43,0.1)",
                          color: b.available ? "#606C38" : "#C0392B",
                        }}>
                        {b.available ? "Disponible" : "Agotado"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {pendingDelete === b.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleDelete(b.id)}
                            className="px-2 py-1 rounded-lg text-xs font-semibold"
                            style={{ background: "#C0392B", color: "#fff" }}>
                            Confirmar
                          </button>
                          <button onClick={() => setPendingDelete(null)}
                            className="px-2 py-1 rounded-lg text-xs font-semibold border"
                            style={{ borderColor: "#D4A373", color: "#4A3728" }}>
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1 flex-wrap">
                          {/* Editar (HU2 — ya implementado) */}
                          <button onClick={() => handleEdit(b)}
                            className="px-2 py-1 rounded-lg text-xs font-semibold hover:opacity-80"
                            style={{ background: "#F5EDD3", color: "#4A3728" }}>
                            Editar
                          </button>
                          {/* M1-HU3: Descontar ejemplares */}
                          <button
                            onClick={() => setStockModal({ book: b, mode: "descuento" })}
                            disabled={b.stock === 0}
                            title="Descontar ejemplares del inventario (M1-HU3)"
                            className="px-2 py-1 rounded-lg text-xs font-semibold hover:opacity-80 disabled:opacity-30"
                            style={{ background: "rgba(212,163,115,0.2)", color: "#8B6914" }}>
                            − Ejemp.
                          </button>
                          {/* M1-HU4: Actualizar existencias */}
                          <button
                            onClick={() => setStockModal({ book: b, mode: "actualizar" })}
                            title="Actualizar cantidad de existencias (M1-HU4)"
                            className="px-2 py-1 rounded-lg text-xs font-semibold hover:opacity-80"
                            style={{ background: "rgba(96,108,56,0.12)", color: "#606C38" }}>
                            Stock
                          </button>
                          {/* Eliminar registro completo */}
                          <button onClick={() => setPendingDelete(b.id)}
                            className="px-2 py-1 rounded-lg text-xs font-semibold hover:opacity-80"
                            style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B" }}>
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Leyenda de acciones */}
          <div className="flex flex-wrap gap-3 mt-3 text-xs" style={{ color: "#6B5344" }}>
            <span><span className="font-semibold" style={{ color: "#4A3728" }}>Editar:</span> Modificar datos del libro (HU2)</span>
            <span>·</span>
            <span><span className="font-semibold" style={{ color: "#8B6914" }}>− Ejemp.:</span> Descontar ejemplares (HU3)</span>
            <span>·</span>
            <span><span className="font-semibold" style={{ color: "#606C38" }}>Stock:</span> Actualizar existencias / auto-Histórico Agotado (HU4)</span>
          </div>
        </div>
      )}

      {/* ── FORMULARIO: Registrar / Editar ── */}
      {(tab === "register" || tab === "edit") && (
        <div className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}>
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => { setTab("list"); setErrors({}); setTouched({}); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "#F5EDD3", color: "#4A3728" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
            <h2 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
              {tab === "register" ? "Registrar nuevo libro" : `Editar: ${form.title}`}
            </h2>
          </div>

          {/* M1-HU6: ID del sistema — visible, solo lectura */}
          <div className="rounded-xl p-4 mb-6 flex items-center gap-4"
            style={{ background: "rgba(212,163,115,0.1)", border: "1.5px solid #E8C99A" }}>
            <div>
              <p className="text-xs font-medium mb-0.5" style={{ color: "#6B5344" }}>ID del Sistema (M1-HU6)</p>
              <p className="text-lg font-bold font-mono" style={{ color: "#4A3728" }}>
                {editId !== null ? editId : previewId}
              </p>
            </div>
            <p className="text-xs" style={{ color: "#6B5344", opacity: 0.75 }}>
              {tab === "register"
                ? "Se genera automáticamente al registrar. Se verifica unicidad antes de asignar."
                : "Identificador único — no modificable"}
            </p>
          </div>

          {/* Datos Bibliográficos */}
          <h3 className="text-sm font-bold mb-4 pb-2 border-b" style={{ color: "#4A3728", borderColor: "#E8C99A" }}>
            Datos Bibliográficos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {([
              ["title",       "Título *",                   "text",   "Título del libro"],
              ["author",      "Autor *",                    "text",   "Nombre del autor"],
              ["isbn",        "ISBN *",                     "text",   "9780000000000"],
              ["year",        "Año de publicación *",       "number", "2024"],
              ["pages",       "Número de páginas *",        "number", "320"],
              ["publisher",   "Editorial *",                "text",   "Nombre editorial"],
              ["publishDate", "Fecha de publicación *",     "date",   ""],
            ] as [keyof BookForm, string, string, string][]).map(([name, label, type, placeholder]) => (
              <div key={name}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>{label}</label>
                <input name={name} type={type}
                  value={String(form[name])}
                  onChange={handleChange} onBlur={handleBlur as any}
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle(name)} />
                <FieldErr name={name} />
              </div>
            ))}

            {/* Categorías — multi-selección con checkboxes */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-2" style={{ color: "#4A3728" }}>Categorías * (puede elegir varias)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {GENRES.map(g => {
                  const checked = form.categories.includes(g);
                  return (
                    <label key={g}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer select-none transition-all"
                      style={{
                        border: `1.5px solid ${checked ? "#4A3728" : "#E8C99A"}`,
                        background: checked ? "rgba(74,55,40,0.07)" : "#FEFAE0",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? form.categories.filter(c => c !== g)
                            : [...form.categories, g];
                          setForm(prev => ({ ...prev, categories: next }));
                          if (touched.categories) {
                            setErrors(prev => ({ ...prev, categories: next.length === 0 ? "Selecciona al menos una categoría" : "" }));
                          }
                        }}
                        className="accent-current"
                        style={{ accentColor: "#4A3728", width: 14, height: 14 }}
                      />
                      <span className="text-xs" style={{ color: checked ? "#4A3728" : "#6B5344", fontWeight: checked ? 600 : 400 }}>{g}</span>
                    </label>
                  );
                })}
              </div>
              {touched.categories && errors.categories && (
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "#C0392B" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {errors.categories}
                </p>
              )}
            </div>

            {/* Idioma */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>Idioma *</label>
              <select name="language" value={form.language} onChange={handleChange} onBlur={handleBlur as any}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none appearance-none"
                style={inputStyle("language")}>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <FieldErr name="language" />
            </div>
          </div>

          {/* Datos Comerciales */}
          <h3 className="text-sm font-bold mb-4 pb-2 border-b" style={{ color: "#4A3728", borderColor: "#E8C99A" }}>
            Datos Comerciales e Inventario
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>Precio (COP) *</label>
              <input name="price" type="number" value={form.price} min={0}
                onChange={handleChange} onBlur={handleBlur as any}
                placeholder="29900"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle("price")} />
              <FieldErr name="price" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>
                Cantidad de ejemplares *
              </label>
              <input name="stock" type="number" value={form.stock} min={0}
                onChange={handleChange} onBlur={handleBlur as any}
                placeholder="1"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle("stock")} />
              <FieldErr name="stock" />
              {form.stock === 0 && (
                <p className="text-xs mt-1 font-semibold" style={{ color: "#C0392B" }}>
                  ⚠️ El libro quedará sin existencias (Agotado)
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>Estado</label>
              <select name="status" value={form.status} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none appearance-none"
                style={{ border: "1.5px solid #E8C99A", background: "#FEFAE0", color: "#4A3728" }}>
                <option value="new">Nuevo</option>
                <option value="used">Usado</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>
              URL de portada
            </label>
            <input name="cover" type="url" value={form.cover}
              onChange={handleChange}
              placeholder="https://ejemplo.com/portada.jpg"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: "1.5px solid #E8C99A", background: "#FEFAE0", color: "#4A3728" }} />
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setTab("list"); setErrors({}); setTouched({}); }}
              className="px-6 py-2.5 rounded-xl text-sm font-medium border"
              style={{ borderColor: "#D4A373", color: "#4A3728" }}>
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 hover:opacity-90"
              style={{ background: "#606C38", color: "#fff" }}>
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando…</>
                : tab === "register" ? "Registrar Libro" : "Guardar Cambios"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
