/**
 * M2-HU10 — Visualización de tiendas en mapa (Leaflet + OpenStreetMap)
 * M2-HU11 — Cálculo de tienda más cercana con disponibilidad
 *
 * Mapa interactivo con marcadores de las 3 tiendas físicas de Pereira.
 * Al hacer clic en un marcador se muestra: nombre, dirección, horario,
 * y disponibilidad del libro consultado (si aplica).
 *
 * Uso:
 *  <StoreMap />                                            (modo solo display)
 *  <StoreMap bookId={3} qty={1} onStoreSelect={fn} />     (modo checkout)
 */
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  useShop, STORES, PEREIRA_CENTER, haversineKm,
} from "../../store/ShopContext";
import type { Store, Book } from "../../store/shopTypes";

// ── Fix de iconos Leaflet (default markers no cargan con bundlers) ──
// Reutilizamos los CDN oficiales para iconos en azul y verde (highlight)
const blueIcon = new L.Icon({
  iconUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Marcador distintivo (violeta) para la ubicación de residencia del usuario
const userIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
  shadowUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Forzar refresh del mapa al montar (Leaflet a veces queda mal-dimensionado
// dentro de contenedores que cambian de tamaño, como modales)
function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

interface StoreMapProps {
  /** Libro único a verificar (modo libro individual) */
  bookId?: number;
  /** Cantidad requerida para bookId (default: 1) */
  qty?: number;
  /** Ítems del carrito: verifica disponibilidad de TODOS los libros por tienda */
  cartItems?: { book: Book; qty: number }[];
  /** Callback al hacer clic en "Seleccionar" dentro de un popup */
  onStoreSelect?: (store: Store) => void;
  /** Tienda actualmente seleccionada (resaltada visualmente) */
  selectedStoreId?: number | null;
  /** Ubicación de residencia del usuario (marcador + cálculo de cercanía) */
  userLocation?: { lat: number; lng: number; label?: string } | null;
  /** Resolución de stock externa (para coincidir EXACTAMENTE con la lista del
   *  checkout, que aplica simulación cuando no hay inventario real). Recibe
   *  (storeId, book) y devuelve las existencias. Si no se pasa, se usa
   *  getStoreStock del contexto. */
  resolveStock?: (storeId: number, book: Book) => number;
  /** Altura del mapa */
  height?: number | string;
}

export function StoreMap({
  bookId,
  qty = 1,
  cartItems,
  onStoreSelect,
  selectedStoreId = null,
  userLocation = null,
  resolveStock,
  height = 400,
}: StoreMapProps) {
  const { getStoreStock, nearestStoreWithStock } = useShop();
  const mapRef = useRef<L.Map | null>(null);

  // Función efectiva de stock: la externa (coincide con la lista del checkout)
  // o la del contexto como fallback.
  const stockOf = (storeId: number, book: Book): number =>
    resolveStock ? resolveStock(storeId, book) : getStoreStock(storeId, book.id);

  // Origen para "tienda más cercana" y el centrado del mapa: la ubicación del
  // usuario si está disponible, si no el centro de Pereira.
  const origin = userLocation
    ? { lat: userLocation.lat, lng: userLocation.lng }
    : PEREIRA_CENTER;

  // ¿Hay algo que verificar? (modo libro individual o carrito)
  const isCheckingStock = typeof bookId === "number" || (cartItems !== undefined && cartItems.length > 0);

  // Construir lista de tiendas con metadatos (stock y disponibilidad)
  const storesWithMeta = useMemo(() => {
    return STORES.map(s => {
      let stock: number | null = null;
      let hasStock = true;

      if (typeof bookId === "number") {
        // Modo libro individual — usa la función efectiva de stock
        stock = resolveStock
          ? resolveStock(s.id, { id: bookId } as Book)
          : getStoreStock(s.id, bookId);
        hasStock = stock >= qty;
      } else if (cartItems && cartItems.length > 0) {
        // Modo carrito: todos los ítems deben tener stock suficiente
        hasStock = cartItems.every(item => stockOf(s.id, item.book) >= item.qty);
      }

      const distKm = haversineKm(origin, { lat: s.lat, lng: s.lng });
      return { store: s, stock, hasStock, distKm };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, cartItems, qty, getStoreStock, resolveStock, origin.lat, origin.lng]);

  // M2-HU11: tienda más cercana con disponibilidad (desde la ubicación del usuario si existe)
  const nearest = useMemo(() => {
    if (typeof bookId === "number") {
      return nearestStoreWithStock(bookId, qty, origin);
    }
    if (cartItems && cartItems.length > 0) {
      const available = storesWithMeta
        .filter(m => m.hasStock)
        .sort((a, b) => a.distKm - b.distKm);
      if (available.length === 0) return null;
      return { store: available[0].store, distanceKm: available[0].distKm };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, cartItems, qty, nearestStoreWithStock, storesWithMeta, origin.lat, origin.lng]);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1.5px solid #E8C99A", boxShadow: "0 2px 12px rgba(74,55,40,0.08)" }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between flex-wrap gap-2"
        style={{ background: "#FEFAE0", borderBottom: "1.5px solid #E8C99A" }}
      >
        <div>
          <div className="font-bold text-sm" style={{ color: "#4A3728" }}>
            📍 Tiendas físicas en Pereira
          </div>
          <div className="text-xs" style={{ color: "#6B5344" }}>
            {isCheckingStock
              ? "Marcadores verdes: con stock disponible · Rojos: sin stock"
              : "Haz clic en un marcador para ver detalles"}
            {userLocation && " · El marcador violeta es tu dirección"}
          </div>
        </div>
        {nearest && (
          <div
            className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ background: "rgba(96,108,56,0.15)", color: "#606C38" }}
          >
            ✓ Tienda más cercana: <strong>{nearest.store.name}</strong> ·{" "}
            {nearest.distanceKm.toFixed(2)} km
          </div>
        )}
      </div>

      {/* Mapa */}
      <div style={{ height, width: "100%" }}>
        <MapContainer
          center={[origin.lat, origin.lng]}
          zoom={userLocation ? 13 : 14}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapResizeHandler />

          {/* Marcador de la ubicación de residencia del usuario */}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
              <Popup>
                <div style={{ minWidth: 160, fontFamily: "system-ui" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: "#4A3728" }}>
                    📍 Tu ubicación
                  </div>
                  <div style={{ fontSize: 11, color: "#6B5344" }}>
                    {userLocation.label ?? "Dirección de entrega"}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {storesWithMeta.map(({ store, stock, hasStock, distKm }) => {
            const isSelected = selectedStoreId === store.id;
            const isNearest = nearest?.store.id === store.id;
            const icon = isCheckingStock
              ? (hasStock ? greenIcon : redIcon)
              : (isSelected || isNearest ? greenIcon : blueIcon);
            return (
              <Marker key={store.id} position={[store.lat, store.lng]} icon={icon}>
                <Popup>
                  <div style={{ minWidth: 200, fontFamily: "system-ui" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: "#4A3728" }}>
                      {store.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#6B5344", marginBottom: 4 }}>
                      {store.address}
                    </div>
                    {store.hours && (
                      <div style={{ fontSize: 11, color: "#6B5344", marginBottom: 6 }}>
                        🕒 {store.hours}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "#6B5344", marginBottom: 6 }}>
                      📏 {distKm.toFixed(2)} km {userLocation ? "de tu ubicación" : "del centro"}
                    </div>

                    {isCheckingStock && (
                      <div
                        style={{
                          padding: "6px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          marginBottom: 8,
                          background: hasStock ? "rgba(96,108,56,0.15)" : "rgba(192,57,43,0.12)",
                          color: hasStock ? "#606C38" : "#9B3C2F",
                          fontWeight: 600,
                        }}
                      >
                        {typeof bookId === "number"
                          ? (hasStock
                              ? `✓ Disponible: ${stock} ejemplar(es)`
                              : `✗ Sin stock (disponibles: ${stock ?? 0})`)
                          : (hasStock
                              ? "✓ Todos los libros disponibles"
                              : "✗ Stock insuficiente para este pedido")}
                      </div>
                    )}

                    {isNearest && (
                      <div
                        style={{
                          padding: "4px 6px",
                          borderRadius: 4,
                          fontSize: 10,
                          marginBottom: 6,
                          background: "#606C38",
                          color: "#FEFAE0",
                          fontWeight: 700,
                          textAlign: "center",
                        }}
                      >
                        ⭐ Tienda más cercana con disponibilidad
                      </div>
                    )}

                    {onStoreSelect && hasStock && (
                      <button
                        onClick={() => onStoreSelect(store)}
                        style={{
                          width: "100%",
                          padding: "6px 12px",
                          borderRadius: 6,
                          background: isSelected ? "#606C38" : "#D4A373",
                          color: "#FEFAE0",
                          border: "none",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {isSelected ? "✓ Seleccionada" : "Seleccionar tienda"}
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
