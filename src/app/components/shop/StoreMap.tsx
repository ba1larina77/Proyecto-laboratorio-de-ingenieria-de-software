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
import type { Store } from "../../store/shopTypes";

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
  /** Si se proporciona, los marcadores se colorean según disponibilidad */
  bookId?: number;
  /** Cantidad requerida (default: 1) */
  qty?: number;
  /** Callback al hacer clic en "Seleccionar" dentro de un popup */
  onStoreSelect?: (store: Store) => void;
  /** Tienda actualmente seleccionada (resaltada visualmente) */
  selectedStoreId?: number | null;
  /** Altura del mapa */
  height?: number | string;
}

export function StoreMap({
  bookId,
  qty = 1,
  onStoreSelect,
  selectedStoreId = null,
  height = 400,
}: StoreMapProps) {
  const { getStoreStock, nearestStoreWithStock } = useShop();
  const mapRef = useRef<L.Map | null>(null);

  // M2-HU11: tienda más cercana con disponibilidad (si hay libro)
  const nearest = useMemo(() => {
    if (typeof bookId !== "number") return null;
    return nearestStoreWithStock(bookId, qty, PEREIRA_CENTER);
  }, [bookId, qty, nearestStoreWithStock]);

  // Construir lista de tiendas con metadatos
  const storesWithMeta = useMemo(() => {
    return STORES.map(s => {
      const stock = typeof bookId === "number" ? getStoreStock(s.id, bookId) : null;
      const hasStock = stock === null ? true : stock >= qty;
      const distKm = haversineKm(PEREIRA_CENTER, { lat: s.lat, lng: s.lng });
      return { store: s, stock, hasStock, distKm };
    });
  }, [bookId, qty, getStoreStock]);

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
            {typeof bookId === "number"
              ? "Marcadores verdes: con stock disponible · Rojos: sin stock"
              : "Haz clic en un marcador para ver detalles"}
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
          center={[PEREIRA_CENTER.lat, PEREIRA_CENTER.lng]}
          zoom={14}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapResizeHandler />
          {storesWithMeta.map(({ store, stock, hasStock, distKm }) => {
            const isSelected = selectedStoreId === store.id;
            const isNearest = nearest?.store.id === store.id;
            const icon = typeof bookId === "number"
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
                      📏 {distKm.toFixed(2)} km del centro
                    </div>

                    {typeof bookId === "number" && (
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
                        {hasStock
                          ? `✓ Disponible: ${stock} ejemplar(es)`
                          : `✗ Sin stock (disponibles: ${stock ?? 0})`}
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
