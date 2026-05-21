# Biblion — Iteración 3

Cambios aplicados sobre el sprint anterior. Cubre los módulos
**M1 (Administración de Libros)** y **M2 (Compra y Reserva de Libros)**.

---

## 📦 Instalación

Nuevas dependencias añadidas — **ejecutar antes de correr el proyecto:**

```bash
npm install
```

Se añaden:

- **`leaflet@1.9.4`** + **`react-leaflet@4.2.1`** — mapa interactivo (HU10)
- **`@types/leaflet`** — tipos TypeScript
- **`vitest@1.6.0`** + **`@testing-library/react`** + **`jsdom`** — suite de tests
- **`@testing-library/jest-dom`** + **`@testing-library/user-event`**

---

## 🚀 Scripts disponibles

```bash
npm run dev            # Iniciar app en desarrollo
npm run build          # Build de producción
npm run test           # Suite de tests en modo watch
npm run test:run       # Suite de tests en modo CI (one-shot)
npm run test:coverage  # Reporte de cobertura (v8)
```

---

## 🆕 Historias de Usuario implementadas (Iteración 3)

### Módulo 1 — Administración de Libros

| HU | Nombre | Implementación |
|----|--------|----------------|
| **HU5** | Publicar noticia automática por nuevo libro | `news/NewsFeed.tsx` + `addBook()` ahora publica una noticia tras crear un libro. Si falla, queda **pending** con botón de reproceso solo visible para admin/root. |
| **HU7** | Gestionar inventario por tienda física | `admin/StoreInventoryPanel.tsx` con flujo de autenticación por código (cada tienda = "usuario" `role: "sucursal"` en `localStorage`). |

### Módulo 2 — Compra y Reserva

| HU | Nombre | Implementación |
|----|--------|----------------|
| **HU7** | Devolución con QR (8 días) | Ya estaba en `ReturnModal.tsx` — confirmada y cubierta por tests. |
| **HU10** | Visualización de tiendas en mapa | `shop/StoreMap.tsx` con **Leaflet + OpenStreetMap**. 3 marcadores reales en Pereira. Integrado en `CheckoutModal` al elegir "Recoger en tienda". |
| **HU11** | Cálculo de tienda más cercana | `nearestStoreWithStock()` en `ShopContext` usando **Haversine** real. Visible como badge "⭐ Tienda más cercana" en el popup del marcador. |

---

## 🔒 Cambios solicitados (mejoras Iteración 3)

### 1. Bloqueo de campos en edición de libro

En modo edición, **solo son editables**:

- ✏️ **Datos comerciales:** precio, stock, estado (nuevo/usado)
- ✏️ **Categorías** (multi-selección)
- ✏️ **URL de portada** (ver punto 3)

Quedan **bloqueados** con badge "🔒 No editable":

- 🔒 Título, autor, ISBN
- 🔒 Año de publicación, número de páginas, editorial, fecha de publicación
- 🔒 Idioma

### 2. Bug fix — Editorial y año de publicación se preservan

Antes: al editar un libro, `year` y `language` se reseteaban a defaults porque
no formaban parte del tipo `Book`. Ahora:

- `Book.year` y `Book.language` añadidos al tipo
- `handleEdit` carga los valores reales del libro
- `handleSubmit` (`updateBook`) los persiste
- Los 12 libros semilla fueron actualizados con `year` y `language` reales

### 3. URL de portada — editable pero obligatoria

En cualquier modo (registro o edición), la URL de portada NO puede quedar
vacía. La validación se activa al guardar:

```ts
if (!f.cover || !f.cover.trim()) e.cover = "La URL de la portada es obligatoria";
```

---

## 🧪 Suite de Pruebas

**113 tests** distribuidos en 9 archivos, cubriendo M1, M2, M3, M7, M8.

### Estructura

```
tests/
├── setup.ts                            # Setup global (jsdom, jest-dom, localStorage clean)
├── test-utils.tsx                      # Helpers: renderWithShop, captureContext, seedUsersStorage
├── unit/
│   ├── helpers.test.ts                # ✓ haversineKm, fmt, constantes de negocio
│   ├── admin-books.test.tsx           # ✓ HU1, HU2 (bug fix), HU3, HU4, HU6
│   ├── store-inventory.test.tsx       # ✓ HU7: setStoreStock, validateStoreCode, nearestStoreWithStock
│   ├── news.test.tsx                  # ✓ HU5: addBook publica noticia, reproceso, persistencia
│   ├── shop-cart-reservation.test.tsx # ✓ Carrito, reservas (RF-CR-03/04), devolución
│   └── auth-financial.test.tsx        # ✓ Login (M3), registro, createAdmin (M3-HU9), updateBalance (M8)
├── integration/
│   ├── admin-panel.test.tsx           # ✓ Bloqueo de campos en edición + readOnly + badges
│   ├── news-feed.test.tsx             # ✓ Renderizado del feed + filtros + reproceso solo admin
│   └── store-inventory.test.tsx       # ✓ Flujo UX: lista → código → desbloqueo → editar
```

### Ejecución

```bash
npm run test:run        # Una sola corrida (CI)
npm run test:coverage   # Con reporte de cobertura en ./coverage/
```

---

## 🔐 Credenciales de prueba (DEMO_USERS)

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Root | `root` | `Root1234*` |
| Admin | `admin@biblion.co` | `admin1234` |
| Cliente | `juan.perez@correo.com` | `12345678` |
| Sucursal Pereira Plaza | `suc.pereiraplaza` | `PereiraPlaza2026` |
| Sucursal Unicentro | `suc.unicentro` | `Unicentro2026` |
| Sucursal Bolívar Plaza | `suc.bolivarplaza` | `BolivarPlaza2026` |

---

## 🗂️ Archivos modificados / creados

### Creados
- `src/app/components/admin/StoreInventoryPanel.tsx` *(HU7 Admin)*
- `src/app/components/news/NewsFeed.tsx` *(HU5 Admin)*
- `src/app/components/shop/StoreMap.tsx` *(HU10/HU11 Compra)*
- `tests/setup.ts`
- `tests/test-utils.tsx`
- `tests/unit/*.test.ts*` (6 archivos)
- `tests/integration/*.test.tsx` (3 archivos)
- `vitest.config.ts`
- `CHANGELOG_iter3.md`

### Modificados
- `src/app/store/shopTypes.ts` — `Book.year`, `Book.language`, `Store`, `StoreInventory`, `News`
- `src/app/store/ShopContext.tsx` — rol `sucursal`, 3 sucursales, `STORES` con coords reales, `haversineKm`, news + storeInventory state/funcs
- `src/app/components/admin/AdminPanel.tsx` — `bibLocked`, `LockedBadge`, validate cover obligatoria
- `src/app/components/shop/CheckoutModal.tsx` — usa `storeInventory` real + `StoreMap` integrado
- `src/app/components/dashboards/AdminCatalog.tsx` — tabs: Libros / Inventario por Tienda / Noticias
- `src/app/routes.ts` — ruta `/news`
- `package.json` — deps y scripts de test
- `tsconfig.json` — incluye `tests/`
