/**
 * M1-HU7 — Gestión de Inventario por Tienda Física
 *
 * Flujo UX:
 * 1. Admin selecciona una tienda (Pereira Plaza / Unicentro / Bolívar Plaza)
 * 2. Sistema le pide el código de tienda (password de la sucursal)
 * 3. El componente valida contra localStorage (cuenta de tipo "sucursal")
 * 4. Si es correcto, despliega el formulario para editar el stock por libro
 *
 * Los códigos de tienda están almacenados en la misma estructura
 * `biblion_users_v1` donde guardamos las contraseñas de los usuarios,
 * con role: "sucursal" — cada tienda actúa como un "usuario" en la BD local.
 */
import { useMemo, useState } from "react";
import { useShop, STORES } from "../../store/ShopContext";

export function StoreInventoryPanel() {
  const {
    books, storeInventory, setStoreStock,
    validateStoreCode, showToast,
  } = useShop();

  // ── Estado del flujo de seguridad ─────────────────────────
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [unlockedStoreId, setUnlockedStoreId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCode, setShowCode] = useState(false);
  // Buffer local de ediciones (se aplican al pulsar Guardar)
  const [draftStocks, setDraftStocks] = useState<Record<number, number>>({});

  const selectedStore = STORES.find(s => s.id === selectedStoreId);
  const unlockedStore = STORES.find(s => s.id === unlockedStoreId);

  // Libros filtrados por búsqueda
  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return books;
    return books.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.isbn?.toLowerCase().includes(q)
    );
  }, [books, searchQuery]);

  function handleSelectStore(storeId: number) {
    setSelectedStoreId(storeId);
    setCodeInput("");
    setCodeError("");
    setShowCode(false);
  }

  function handleValidateCode() {
    if (selectedStoreId === null) return;
    if (!codeInput.trim()) {
      setCodeError("Ingresa el código de la tienda");
      return;
    }
    const ok = validateStoreCode(selectedStoreId, codeInput);
    if (!ok) {
      setCodeError("Código incorrecto. Verifica con la administración de la tienda.");
      return;
    }
    // Desbloqueado: cargar stock actual al buffer
    const currentStock: Record<number, number> = {};
    for (const b of books) {
      currentStock[b.id] = storeInventory?.[selectedStoreId]?.[b.id] ?? 0;
    }
    setDraftStocks(currentStock);
    setUnlockedStoreId(selectedStoreId);
    setCodeInput("");
    setCodeError("");
    showToast(`✓ Acceso autorizado a ${selectedStore?.name}`, "success");
  }

  function handleLock() {
    // Verifica si hay cambios sin guardar
    if (unlockedStoreId !== null) {
      const hasChanges = books.some(b => {
        const original = storeInventory?.[unlockedStoreId]?.[b.id] ?? 0;
        const draft = draftStocks[b.id] ?? 0;
        return original !== draft;
      });
      if (hasChanges && !confirm("Hay cambios sin guardar. ¿Salir de todos modos?")) return;
    }
    setUnlockedStoreId(null);
    setSelectedStoreId(null);
    setDraftStocks({});
    setSearchQuery("");
  }

  function handleStockChange(bookId: number, value: string) {
    const n = Math.max(0, parseInt(value, 10) || 0);
    setDraftStocks(prev => ({ ...prev, [bookId]: n }));
  }

  function handleSaveAll() {
    if (unlockedStoreId === null) return;
    let changes = 0;
    for (const b of books) {
      const original = storeInventory?.[unlockedStoreId]?.[b.id] ?? 0;
      const draft = draftStocks[b.id] ?? 0;
      if (original !== draft) {
        setStoreStock(unlockedStoreId, b.id, draft);
        changes++;
      }
    }
    if (changes === 0) {
      showToast("No hay cambios para guardar", "info");
    } else {
      showToast(`✓ ${changes} ajuste(s) de inventario guardado(s)`, "success");
    }
  }

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
          🏪 Inventario por Tienda Física
        </h2>
        <p className="text-sm" style={{ color: "#6B5344" }}>
          M1-HU7 · Cada tienda mantiene su stock independiente. Requiere código
          de tienda para desbloquear edición.
        </p>
      </div>

      {/* ── Vista: lista de tiendas (sin selección) ── */}
      {unlockedStoreId === null && selectedStoreId === null && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STORES.map(store => {
            const totalItems = Object.values(storeInventory?.[store.id] ?? {})
              .reduce((sum, qty) => sum + qty, 0);
            const distinctBooks = Object.values(storeInventory?.[store.id] ?? {})
              .filter(q => q > 0).length;
            return (
              <button
                key={store.id}
                onClick={() => handleSelectStore(store.id)}
                className="text-left rounded-2xl p-5 transition-all hover:scale-[1.02]"
                style={{
                  background: "#FEFAE0",
                  border: "1.5px solid #E8C99A",
                  boxShadow: "0 2px 8px rgba(74,55,40,0.06)",
                }}
              >
                <div className="text-3xl mb-2">🏪</div>
                <h3 className="font-bold mb-1" style={{ color: "#4A3728" }}>{store.name}</h3>
                <p className="text-xs mb-3" style={{ color: "#6B5344" }}>{store.address}</p>
                <div className="flex gap-3 text-xs pt-2 border-t" style={{ borderColor: "#E8C99A" }}>
                  <span style={{ color: "#606C38" }}>
                    <strong>{totalItems}</strong> ejemplares
                  </span>
                  <span style={{ color: "#6B5344" }}>
                    <strong>{distinctBooks}</strong> títulos
                  </span>
                </div>
                <div className="mt-3 text-xs font-medium" style={{ color: "#C0392B" }}>
                  🔒 Requiere código →
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Vista: pedir código ── */}
      {selectedStoreId !== null && unlockedStoreId === null && (
        <div
          className="max-w-md mx-auto rounded-2xl p-6"
          style={{ background: "#FEFAE0", border: "1.5px solid #E8C99A" }}
        >
          <button
            onClick={() => setSelectedStoreId(null)}
            className="text-sm mb-4 hover:opacity-70"
            style={{ color: "#6B5344" }}
          >
            ← Volver a tiendas
          </button>

          <div className="text-center mb-5">
            <div className="text-5xl mb-3">🔐</div>
            <h3 className="font-bold text-lg mb-1" style={{ color: "#4A3728" }}>
              {selectedStore?.name}
            </h3>
            <p className="text-xs" style={{ color: "#6B5344" }}>
              Ingresa el código de tienda para gestionar su inventario
            </p>
          </div>

          <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>
            Código de tienda *
          </label>
          <div className="relative mb-3">
            <input
              type={showCode ? "text" : "password"}
              value={codeInput}
              onChange={(e) => { setCodeInput(e.target.value); setCodeError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleValidateCode()}
              placeholder="••••••••"
              autoFocus
              className="w-full px-4 py-2.5 pr-10 rounded-xl text-sm outline-none"
              style={{
                border: `1.5px solid ${codeError ? "#C0392B" : "#E8C99A"}`,
                background: "#FFFEF7",
                color: "#4A3728",
              }}
            />
            <button
              type="button"
              onClick={() => setShowCode(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: "#6B5344" }}
            >
              {showCode ? "🙈" : "👁️"}
            </button>
          </div>
          {codeError && (
            <p className="text-xs mb-3 font-medium" style={{ color: "#C0392B" }}>
              ⚠️ {codeError}
            </p>
          )}

          <button
            onClick={handleValidateCode}
            className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: "#606C38", color: "#FEFAE0" }}
          >
            Desbloquear inventario
          </button>

          <p className="text-[11px] mt-4 text-center" style={{ color: "#6B5344", opacity: 0.8 }}>
            El código se valida contra la cuenta de sucursal almacenada en el sistema.
          </p>
        </div>
      )}

      {/* ── Vista: tienda desbloqueada — editar inventario ── */}
      {unlockedStoreId !== null && unlockedStore && (
        <div>
          {/* Header desbloqueado */}
          <div
            className="rounded-2xl p-4 mb-4 flex flex-wrap items-center justify-between gap-3"
            style={{ background: "rgba(96,108,56,0.10)", border: "1.5px solid #606C38" }}
          >
            <div>
              <div className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: "#606C38" }}>
                🔓 Tienda desbloqueada
              </div>
              <div className="font-bold" style={{ color: "#4A3728" }}>
                {unlockedStore.name}
              </div>
              <div className="text-xs" style={{ color: "#6B5344" }}>
                {unlockedStore.address}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveAll}
                className="text-xs px-4 py-2 rounded-lg font-bold transition-all hover:opacity-90"
                style={{ background: "#606C38", color: "#FEFAE0" }}
              >
                💾 Guardar todos los cambios
              </button>
              <button
                onClick={handleLock}
                className="text-xs px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90"
                style={{ background: "#FEFAE0", color: "#4A3728", border: "1.5px solid #E8C99A" }}
              >
                🔒 Cerrar
              </button>
            </div>
          </div>

          {/* Buscador */}
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar libro por título, autor o ISBN…"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: "1.5px solid #E8C99A", background: "#FEFAE0", color: "#4A3728" }}
            />
          </div>

          {/* Tabla / lista */}
          <div className="space-y-2">
            {filteredBooks.length === 0 ? (
              <div className="text-center py-12 text-sm" style={{ color: "#6B5344" }}>
                No hay libros que coincidan con la búsqueda.
              </div>
            ) : (
              filteredBooks.map(book => {
                const draft = draftStocks[book.id] ?? 0;
                const original = storeInventory?.[unlockedStoreId]?.[book.id] ?? 0;
                const changed = draft !== original;
                return (
                  <div
                    key={book.id}
                    className="rounded-xl p-3 flex items-center gap-3 transition-all"
                    style={{
                      background: changed ? "#FFF8E1" : "#FEFAE0",
                      border: `1.5px solid ${changed ? "#E0A800" : "#E8C99A"}`,
                    }}
                  >
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="w-12 h-16 object-cover rounded-md flex-shrink-0"
                      style={{ background: "#EDE0C4" }}
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate" style={{ color: "#4A3728" }}>
                        {book.title}
                      </div>
                      <div className="text-xs truncate" style={{ color: "#6B5344" }}>
                        {book.author} · ISBN {book.isbn}
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: "#6B5344", opacity: 0.8 }}>
                        Stock global: {book.stock} · Stock en tienda: <strong>{original}</strong>
                        {changed && (
                          <span className="ml-2 font-bold" style={{ color: "#E0A800" }}>
                            → {draft} (sin guardar)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleStockChange(book.id, String(Math.max(0, draft - 1)))}
                        className="w-7 h-7 rounded-md font-bold"
                        style={{ background: "#FEFAE0", color: "#4A3728", border: "1.5px solid #E8C99A" }}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={draft}
                        onChange={(e) => handleStockChange(book.id, e.target.value)}
                        className="w-14 px-2 py-1 text-center text-sm rounded-md outline-none"
                        style={{ border: "1.5px solid #E8C99A", background: "#FFFEF7", color: "#4A3728" }}
                      />
                      <button
                        onClick={() => handleStockChange(book.id, String(draft + 1))}
                        className="w-7 h-7 rounded-md font-bold"
                        style={{ background: "#FEFAE0", color: "#4A3728", border: "1.5px solid #E8C99A" }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
