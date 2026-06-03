# Biblion — Biblioteca Digital

Sistema de gestión y compra de libros en línea. Proyecto de laboratorio de
Ingeniería de Software — Universidad Tecnológica de Pereira, 2026.

**Equipo:** Ivan Darío Salazar Londoño · Juan Camilo Mejía Henao · Andrés Mejía

## Stack
- Frontend: React 18 + TypeScript + Vite 6 + Tailwind 4 + Radix/shadcn + MUI 7 + React Router 7
- Mapas: Leaflet + OpenStreetMap
- Backend: Node + SQLite (carpeta server/)
- Realidad Aumentada: <model-viewer> de Google

## Instalación y ejecución (local)

### Frontend
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/ para producción
npm run preview  # previsualiza el build
```

### Backend
```bash
cd server
npm install
node index.js
```

## Variables de entorno
El archivo .env (raíz) ya incluye la clave de Google Books. Completa las de
EmailJS si vas a usar notificaciones por correo.

## Cuentas de prueba
| Rol | Usuario | Contraseña |
|-----|---------|-----------|
| Root | root | Root1234* |
| Admin | admin@biblion.co | admin1234 |
| Cliente | juan.perez@correo.com | 12345678 |

## Módulos
10 módulos, 55 historias de usuario (iteraciones 1-4). Ver el documento
Biblion_HUs_y_Despliegue.docx para el detalle, el estado de cada historia, y la
guía de despliegue completa.

El módulo de Realidad Aumentada (/ar/:bookId) usa un único modelo 3D base
(public/models/book.glb) y le aplica la portada de cada libro como textura
dinámica. El visor 3D, el botón de acceso y el cambio de portada ya funcionan.
Para AR real en iPhone (Safari) se necesita generar adicionalmente un .usdz
del modelo (ver src/app/components/ar/ARViewer.tsx y public/models/LEEME.txt).

## Despliegue recomendado
- Frontend -> Vercel o Netlify
- Backend  -> Render (con disco persistente para biblioteca.db)

Instrucciones paso a paso en Biblion_HUs_y_Despliegue.docx, sección 3.
