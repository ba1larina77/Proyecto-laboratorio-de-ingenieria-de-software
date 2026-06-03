/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  MÓDULO DE REALIDAD AUMENTADA  (Responsable: Ivan)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Cubre las 2 HUs del módulo:
 *    · M-RA-HU1: Visualizar el libro en 3D / realidad aumentada.
 *    · M-RA-HU2: Activar la vista AR con la cámara del dispositivo.
 *
 *  ENFOQUE: un ÚNICO modelo 3D base (public/models/book.glb) al que se le
 *  cambia dinámicamente la textura de la PORTADA por la imagen (cover) del
 *  libro consultado. Así no se necesita un .glb por cada libro.
 *
 *  El modelo book.glb tiene 2 materiales:
 *    · "Architexture" → la cubierta/portada del libro  (← aquí va el cover)
 *    · "Bookpage"     → las páginas
 *
 *  Usa <model-viewer> de Google (https://modelviewer.dev). El script se carga
 *  en index.html. Funciona como visor 3D en cualquier navegador y ofrece AR
 *  real en móviles compatibles (Android/ARCore; iOS/ARKit requiere .usdz).
 */
import { useParams, useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import { useShop } from "../../store/ShopContext";

// model-viewer es un Web Component; declaramos el tag para que TSX no se queje.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": any;
    }
  }
}

// Modelo base único. La portada se aplica encima como textura.
const BASE_MODEL = "/models/book.glb";
// Nombre del material que representa la cubierta dentro de book.glb.
// (verificado: el modelo tiene "Architexture" = portada y "Bookpage" = páginas)
const COVER_MATERIAL_NAME = "Architexture";

export function ARViewer() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { books } = useShop();
  const modelRef = useRef<any>(null);

  const [scriptReady, setScriptReady] = useState(false);
  const [coverApplied, setCoverApplied] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

  // Libro consultado y su portada
  const book = books.find(b => b.id === Number(bookId));
  const bookCoverUrl = book?.cover ?? "";

  // Espera a que el Web Component <model-viewer> esté disponible.
  useEffect(() => {
    if (customElements.get("model-viewer")) { setScriptReady(true); return; }
    const check = setInterval(() => {
      if (customElements.get("model-viewer")) {
        setScriptReady(true);
        clearInterval(check);
      }
    }, 300);
    return () => clearInterval(check);
  }, []);

  // Aplica la portada del libro como textura del material de la cubierta.
  // Se dispara con el evento onLoad del <model-viewer> (cuando el .glb ya cargó).
  const handleModelLoad = async () => {
    const viewer = modelRef.current;
    if (!viewer || !bookCoverUrl) return;
    try {
      // 1. Crear la textura a partir de la URL de la portada.
      //    Nota: la imagen debe permitir CORS. Las portadas de Google Books
      //    (books.google.com / *.googleusercontent.com) suelen permitirlo.
      const texture = await viewer.createTexture(bookCoverUrl);

      // 2. Localizar el material de la cubierta POR NOMBRE (más robusto que [0]).
      const materials = viewer.model?.materials ?? [];
      const coverMat =
        materials.find((m: any) => m?.name === COVER_MATERIAL_NAME) ?? materials[0];

      if (!coverMat) {
        setCoverError("El modelo no expone materiales para aplicar la portada.");
        return;
      }

      // 3. Aplicar la portada como textura de color base.
      coverMat.pbrMetallicRoughness.baseColorTexture.setTexture(texture);
      setCoverApplied(true);
      setCoverError(null);
    } catch (error: any) {
      // Causa típica: la URL de la portada no permite CORS, o no carga.
      console.error("Error al aplicar la portada 3D:", error);
      setCoverError(
        "No se pudo aplicar la portada al modelo (posible bloqueo CORS de la imagen). " +
        "Se muestra el modelo base."
      );
    }
  };

  // Paleta del módulo RA (tema oscuro/cian holográfico)
  const cyan = "#00E5FF";
  const dark = "#0A0E14";

  return (
    <div style={{ minHeight: "100vh", background: dark, color: "#E6F7FF", fontFamily: "system-ui" }}>
      {/* Barra superior */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px", borderBottom: `1px solid ${cyan}33`,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "transparent", border: `1px solid ${cyan}66`, color: cyan,
            borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer",
          }}
        >
          ← Volver
        </button>
        <div style={{ fontWeight: 700, letterSpacing: 1 }}>
          📕 Realidad Aumentada {book ? `· ${book.title}` : ""}
        </div>
        <div style={{ width: 70 }} />
      </div>

      {/* Estado de la portada */}
      {coverError && (
        <div style={{
          margin: "12px 20px", padding: "10px 14px", borderRadius: 8,
          background: "rgba(192,57,43,0.12)", border: "1px solid rgba(192,57,43,0.4)",
          fontSize: 12, color: "#ff9a8a",
        }}>
          ⚠️ {coverError}
        </div>
      )}

      {/* Visor 3D / AR */}
      <div style={{ padding: "0 20px 20px" }}>
        {!book ? (
          <div style={{
            height: "55vh", display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid ${cyan}33`, borderRadius: 16, fontSize: 14, opacity: 0.8,
          }}>
            No se encontró el libro solicitado.
          </div>
        ) : !scriptReady ? (
          <div style={{
            height: "60vh", display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 12, border: `1px solid ${cyan}33`, borderRadius: 16,
          }}>
            <div style={{ fontSize: 14, opacity: 0.8 }}>Cargando visor 3D…</div>
            <div style={{ fontSize: 12, opacity: 0.6, maxWidth: 420, textAlign: "center" }}>
              Si esto no carga, falta el script de <b>model-viewer</b> en <code>index.html</code>.
            </div>
          </div>
        ) : (
          // @ts-ignore — model-viewer es un Web Component
          <model-viewer
            ref={modelRef}
            src={BASE_MODEL}
            onLoad={handleModelLoad}
            alt={`Vista 3D de ${book.title}`}
            ar
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            auto-rotate
            shadow-intensity="1"
            style={{
              width: "100%", height: "62vh", background: "#05080C",
              borderRadius: 16, border: `1px solid ${cyan}33`,
            }}
          >
            {/* Botón de activar AR (M-RA-HU2) */}
            <button
              slot="ar-button"
              style={{
                position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
                background: cyan, color: dark, border: "none", borderRadius: 999,
                padding: "10px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer",
                boxShadow: `0 4px 20px ${cyan}66`,
              }}
            >
              📲 Ver en tu espacio (AR)
            </button>
          </model-viewer>
        )}
      </div>

      {/* Info del libro + portada 2D de referencia */}
      {book && (
        <div style={{ display: "flex", gap: 16, alignItems: "center", padding: "0 20px 30px" }}>
          {bookCoverUrl && (
            <img
              src={bookCoverUrl}
              alt={book.title}
              crossOrigin="anonymous"
              style={{ width: 70, height: 100, objectFit: "cover", borderRadius: 8, border: `1px solid ${cyan}33` }}
            />
          )}
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{book.title}</div>
            <div style={{ opacity: 0.8 }}>{book.author}</div>
            <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>
              {coverApplied
                ? "✓ Portada aplicada al modelo 3D"
                : "Aplicando portada al modelo…"}
            </div>
          </div>
        </div>
      )}

      {/* Notas para probar la RA */}
      <div style={{ padding: "0 20px 40px", fontSize: 12, opacity: 0.65, lineHeight: 1.6 }}>
        <p><b>Cómo probar la RA:</b></p>
        <p>· Android (Chrome) → "Ver en tu espacio" abre Scene Viewer (ARCore).</p>
        <p>· iPhone (Safari) → para AR real se necesita además un archivo <code>.usdz</code>.</p>
        <p>· Escritorio → visor 3D con órbita (arrastra para rotar).</p>
      </div>
    </div>
  );
}
