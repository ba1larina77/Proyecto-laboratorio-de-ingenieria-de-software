import { useState } from "react";
import type { AdminBook } from "../../store/shopTypes";

function fmt(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
}

function generateBookId(existing: AdminBook[]): string {
  // M1-HU6: ID único generado automáticamente, verificando que no exista
  let id: string;
  do {
    const prefix = "LIB";
    const num = Math.floor(100000 + Math.random() * 900000);
    id = `${prefix}-${num}`;
  } while (existing.find(b => b.id === id));
  return id;
}

const GENRES = ["Ficción", "No Ficción", "Ciencia", "Historia", "Arte", "Filosofía", "Poesía", "Tecnología", "Infantil", "Novela Gráfica"];
const LANGUAGES = ["Español", "Inglés", "Francés", "Alemán", "Portugués", "Italiano"];

const INITIAL_BOOKS: AdminBook[] = [
  { id: "LIB-100001", title: "Cien Años de Soledad", author: "Gabriel García Márquez", isbn: "978-84-376-0494-7", year: 1967, genre: "Ficción", pages: 432, publisher: "Editorial Sudamericana", language: "Español", publishDate: "1967-05-30", status: "new", price: 28900, stock: 3, cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop" },
  { id: "LIB-100002", title: "El Principito", author: "Antoine de Saint-Exupéry", isbn: "978-84-261-1998-5", year: 1943, genre: "Ficción", pages: 96, publisher: "Salamandra", language: "Español", publishDate: "1943-04-06", status: "new", price: 18500, stock: 8, cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=450&fit=crop" },
];

const emptyForm = {
  title: "", author: "", isbn: "", year: new Date().getFullYear(),
  genre: "", pages: 0, publisher: "", language: "Español",
  publishDate: "", status: "new" as "new" | "used", price: 0, stock: 0, cover: ""
};

function validate(f: typeof emptyForm & { id?: string }, isNew: boolean): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.title.trim()) e.title = "El título es obligatorio";
  if (!f.author.trim()) e.author = "El autor es obligatorio";
  if (!/^\d{13}(-\d)?$/.test(f.isbn.replace(/-/g, "").padEnd(13,"0")) && f.isbn.trim())
    e.isbn = "ISBN inválido (debe tener 13 dígitos)";
  if (!f.isbn.trim()) e.isbn = "El ISBN es obligatorio";
  if (!f.year || f.year < 1000 || f.year > new Date().getFullYear()) e.year = "Año inválido";
  if (!f.genre) e.genre = "Selecciona un género";
  if (!f.pages || f.pages < 1) e.pages = "Número de páginas inválido";
  if (!f.publisher.trim()) e.publisher = "La editorial es obligatoria";
  if (!f.language) e.language = "Selecciona un idioma";
  if (!f.publishDate) e.publishDate = "La fecha de publicación es obligatoria";
  if (!f.price || f.price < 0) e.price = "El precio es obligatorio";
  if (f.stock < 0) e.stock = "El stock no puede ser negativo";
  return e;
}

export function AdminPanel() {
  const [books, setBooks] = useState<AdminBook[]>(INITIAL_BOOKS);
  const [tab, setTab] = useState<"list" | "register" | "edit">("list");
  const [form, setForm] = useState({ ...emptyForm });
  const [editId, setEditId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [searchAdmin, setSearchAdmin] = useState("");

  const generatedId = tab === "register" ? generateBookId(books) : (editId || "");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    const updated = { ...form, [name]: name === "year" || name === "pages" || name === "price" || name === "stock" ? Number(value) : value };
    setForm(updated);
    if (touched[name]) {
      const errs = validate(updated, !editId);
      setErrors(p => ({ ...p, [name]: errs[name] || "" }));
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name } = e.target;
    setTouched(p => ({ ...p, [name]: true }));
    const errs = validate(form, !editId);
    setErrors(p => ({ ...p, [name]: errs[name] || "" }));
  }

  function handleEdit(book: AdminBook) {
    setEditId(book.id);
    setForm({ title: book.title, author: book.author, isbn: book.isbn, year: book.year, genre: book.genre, pages: book.pages, publisher: book.publisher, language: book.language, publishDate: book.publishDate, status: book.status, price: book.price, stock: book.stock, cover: book.cover });
    setErrors({}); setTouched({});
    setTab("edit");
  }

  function handleSubmit() {
    const allTouched: Record<string, boolean> = {};
    Object.keys(form).forEach(k => { allTouched[k] = true; });
    setTouched(allTouched);
    const errs = validate(form, !editId);
    setErrors(errs);
    if (Object.values(errs).some(v => v)) return;

    // Check duplicate ISBN (M1-HU1)
    const isbnDuplicate = books.find(b => b.isbn === form.isbn && b.id !== editId);
    if (isbnDuplicate) { setErrors(p => ({ ...p, isbn: "Este ISBN ya está registrado en el sistema" })); return; }

    setSaving(true);
    setTimeout(() => {
      if (editId) {
        // M1-HU2: Editar libro existente
        setBooks(prev => prev.map(b => b.id === editId ? { ...b, ...form } : b));
        setSuccessMsg(`✓ Libro "${form.title}" actualizado correctamente`);
      } else {
        // M1-HU1 + M1-HU6: Registrar libro con ID único
        const newId = generateBookId(books);
        setBooks(prev => [...prev, { id: newId, ...form }]);
        setSuccessMsg(`✓ Libro registrado con ID único: ${newId}`);
      }
      setSaving(false);
      setForm({ ...emptyForm });
      setEditId(null);
      setErrors({}); setTouched({});
      setTab("list");
      setTimeout(() => setSuccessMsg(""), 4000);
    }, 900);
  }

  function handleDelete(id: string) {
    setBooks(prev => prev.filter(b => b.id !== id));
    setPendingDelete(null);
    setSuccessMsg("✓ Libro eliminado del inventario");
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  const filteredBooks = books.filter(b =>
    !searchAdmin || b.title.toLowerCase().includes(searchAdmin.toLowerCase()) ||
    b.author.toLowerCase().includes(searchAdmin.toLowerCase()) ||
    b.isbn.includes(searchAdmin) || b.id.toLowerCase().includes(searchAdmin.toLowerCase())
  );

  const FieldError = ({ name }: { name: string }) =>
    touched[name] && errors[name] ? (
      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#C0392B" }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {errors[name]}
      </p>
    ) : null;

  return (
    <div>
      <div className="flex flex-wrap gap-4 justify-between items-start mb-7">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
            Administración de Libros
          </h1>
          <p className="text-sm" style={{ color: "#6B5344", opacity: 0.8 }}>
            M1-HU1: Registrar · M1-HU2: Editar · M1-HU6: ID único automático
          </p>
        </div>
        {tab === "list" && (
          <button onClick={() => { setForm({ ...emptyForm }); setEditId(null); setErrors({}); setTouched({}); setTab("register"); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "#4A3728", color: "#FEFAE0" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Registrar libro
          </button>
        )}
      </div>

      {successMsg && (
        <div className="rounded-xl px-5 py-3.5 mb-5 flex items-center gap-3"
          style={{ background: "rgba(96,108,56,0.1)", border: "1.5px solid #606C38" }}>
          <span style={{ color: "#606C38" }}>✓</span>
          <p className="text-sm font-medium" style={{ color: "#606C38" }}>{successMsg}</p>
        </div>
      )}

      {/* BOOK LIST */}
      {tab === "list" && (
        <div>
          <div className="relative mb-4">
            <svg width="16" height="16" className="absolute left-3.5 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="#D4A373" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={searchAdmin} onChange={e => setSearchAdmin(e.target.value)}
              placeholder="Buscar por título, autor, ISBN o ID…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: "1.5px solid #E8C99A", background: "#FEFAE0", color: "#4A3728" }} />
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#4A3728", color: "#FEFAE0" }}>
                  {["ID Sistema", "Título", "Autor", "ISBN", "Género", "Precio", "Stock", "Acciones"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredBooks.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-sm" style={{ color: "#6B5344" }}>No hay libros registrados</td></tr>
                ) : filteredBooks.map((b, i) => (
                  <tr key={b.id} style={{ background: i % 2 === 0 ? "#fff" : "#FEFAE0" }}>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono px-2 py-0.5 rounded-lg" style={{ background: "#F5EDD3", color: "#4A3728" }}>{b.id}</span>
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: "#4A3728", maxWidth: 160 }}>{b.title}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6B5344" }}>{b.author}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "#6B5344" }}>{b.isbn}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F5EDD3", color: "#4A3728" }}>{b.genre}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-xs" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>{fmt(b.price)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: b.stock > 0 ? "rgba(96,108,56,0.1)" : "rgba(192,57,43,0.1)", color: b.stock > 0 ? "#606C38" : "#C0392B" }}>
                        {b.stock > 0 ? b.stock : "Agotado"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(b)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                          style={{ background: "#F5EDD3", color: "#4A3728" }}>Editar</button>
                        {pendingDelete === b.id ? (
                          <div className="flex gap-1">
                            <button onClick={() => handleDelete(b.id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#C0392B", color: "#fff" }}>Sí</button>
                            <button onClick={() => setPendingDelete(null)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: "#D4A373", color: "#4A3728" }}>No</button>
                          </div>
                        ) : (
                          <button onClick={() => setPendingDelete(b.id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                            style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B" }}>Eliminar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FORM: Register / Edit */}
      {(tab === "register" || tab === "edit") && (
        <div className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}>
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => { setTab("list"); setErrors({}); setTouched({}); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F5EDD3", color: "#4A3728" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <h2 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
              {tab === "register" ? "Registrar nuevo libro" : `Editar: ${form.title}`}
            </h2>
          </div>

          {/* M1-HU6: ID único visible y solo lectura */}
          <div className="rounded-xl p-4 mb-6 flex items-center gap-4"
            style={{ background: "rgba(212,163,115,0.1)", border: "1.5px solid #E8C99A" }}>
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: "#6B5344" }}>ID del Sistema (M1-HU6)</p>
              <p className="text-lg font-bold font-mono" style={{ color: "#4A3728" }}>{generatedId}</p>
            </div>
            <p className="text-xs" style={{ color: "#6B5344", opacity: 0.75 }}>
              {tab === "register" ? "Generado automáticamente al registrar" : "No modificable"}
            </p>
          </div>

          {/* Datos Bibliográficos */}
          <h3 className="text-sm font-bold mb-4 pb-2 border-b" style={{ color: "#4A3728", borderColor: "#E8C99A" }}>Datos Bibliográficos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[
              { name: "title", label: "Título *", placeholder: "Título del libro", type: "text" },
              { name: "author", label: "Autor *", placeholder: "Nombre del autor", type: "text" },
              { name: "isbn", label: "ISBN *", placeholder: "978-XXXXXXXXXX", type: "text" },
              { name: "year", label: "Año de publicación *", placeholder: "2024", type: "number" },
              { name: "pages", label: "Número de páginas *", placeholder: "320", type: "number" },
              { name: "publisher", label: "Editorial *", placeholder: "Nombre de la editorial", type: "text" },
              { name: "publishDate", label: "Fecha de publicación *", placeholder: "", type: "date" },
            ].map(({ name, label, placeholder, type }) => (
              <div key={name}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>{label}</label>
                <input name={name} type={type} value={String((form as any)[name])}
                  onChange={handleChange} onBlur={handleBlur as any}
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: `1.5px solid ${touched[name] && errors[name] ? "#C0392B" : "#E8C99A"}`, background: "#FEFAE0", color: "#4A3728" }} />
                <FieldError name={name} />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>Género *</label>
              <select name="genre" value={form.genre} onChange={handleChange} onBlur={handleBlur as any}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none appearance-none"
                style={{ border: `1.5px solid ${touched.genre && errors.genre ? "#C0392B" : "#E8C99A"}`, background: "#FEFAE0", color: "#4A3728" }}>
                <option value="">Seleccionar género…</option>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <FieldError name="genre" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>Idioma *</label>
              <select name="language" value={form.language} onChange={handleChange} onBlur={handleBlur as any}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none appearance-none"
                style={{ border: `1.5px solid ${touched.language && errors.language ? "#C0392B" : "#E8C99A"}`, background: "#FEFAE0", color: "#4A3728" }}>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <FieldError name="language" />
            </div>
          </div>

          {/* Datos Comerciales */}
          <h3 className="text-sm font-bold mb-4 pb-2 border-b" style={{ color: "#4A3728", borderColor: "#E8C99A" }}>Datos Comerciales</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>Precio (COP) *</label>
              <input name="price" type="number" value={form.price} onChange={handleChange} onBlur={handleBlur as any}
                placeholder="29900" min={0}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: `1.5px solid ${touched.price && errors.price ? "#C0392B" : "#E8C99A"}`, background: "#FEFAE0", color: "#4A3728" }} />
              <FieldError name="price" />
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
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>Cantidad de ejemplares</label>
              <input name="stock" type="number" value={form.stock} onChange={handleChange} onBlur={handleBlur as any}
                min={0} placeholder="1"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: `1.5px solid ${touched.stock && errors.stock ? "#C0392B" : "#E8C99A"}`, background: "#FEFAE0", color: "#4A3728" }} />
              <FieldError name="stock" />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>URL de portada</label>
            <input name="cover" type="url" value={form.cover} onChange={handleChange}
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
