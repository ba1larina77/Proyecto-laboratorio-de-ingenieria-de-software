# Guía de Despliegue: Biblioteca Digital (Biblion)

Esta guía detalla los pasos y configuraciones necesarias para desplegar el servidor Backend (Express + Socket.io) en **Render** (o Railway) y el Frontend (React + Vite) en **Vercel**, conectándose con tu base de datos **Supabase**.

---

## 1. Despliegue del Backend (Render / Railway)

El backend maneja la lógica de negocio, las conexiones por WebSockets (Socket.IO) y la conexión directa a Supabase.

### Opción A: Render (Recomendado y Gratis)

1. **Crear Servicio**: Inicia sesión en [Render](https://render.com/), haz clic en **New +** y selecciona **Web Service**.
2. **Conectar Repositorio**: Conecta tu repositorio de GitHub.
3. **Configuraciones Principales**:
   - **Name**: `biblion-backend` (o el nombre que prefieras).
   - **Region**: Selecciona la más cercana a tus usuarios (ej. *Ohio* o *Oregon*).
   - **Language**: `Node`.
   - **Root Directory**: `server` (⚠️ **Muy importante**: como el backend está en una subcarpeta, debemos indicar a Render que trabaje dentro de ella).
   - **Build Command**: `npm install` (Render lo ejecutará automáticamente en la carpeta `server`).
   - **Start Command**: `npm start` (o `node index.js`).
   - **Instance Type**: `Free`.
4. **Variables de Entorno**: Ve a la pestaña **Environment** y añade las siguientes variables:
   - `DATABASE_URL`: *Tu URL de Connection Pooler de Supabase* (la misma que colocaste en `server/.env`).
   - `CLIENT_URL`: *La URL de tu frontend en Vercel* (ej. `https://biblion.vercel.app`). *Nota: Puedes colocar provisionalmente `http://localhost:5173` y actualizarlo más tarde cuando Vercel te asigne tu dominio real.*
   - `NODE_ENV`: `production` (esto asegura que `database.js` se conecte usando SSL obligatorio).

---

### Opción B: Railway

1. **Crear Proyecto**: Inicia sesión en [Railway](https://railway.app/) y crea un **New Project** conectando tu repositorio de GitHub.
2. **Configurar Carpeta**:
   - Una vez importado, ve a **Settings** de la app.
   - En **General** > **Root Directory**, configúralo como `/server`.
   - En **Deploy** > **Start Command**, configúralo como `node index.js` (o `npm start`).
3. **Variables de Entorno**: Ve a **Variables** y añade:
   - `DATABASE_URL`: *Tu URL de connection pooler de Supabase*.
   - `CLIENT_URL`: *Tu dominio de Vercel* (ej. `https://biblion.vercel.app`).
   - `NODE_ENV`: `production`.

---

## 2. Despliegue del Frontend (Vercel)

El frontend de React se aloja en Vercel, optimizado para aplicaciones estáticas de Vite.

1. **Crear Proyecto**: Inicia sesión en [Vercel](https://vercel.com/), haz clic en **Add New** > **Project** e importa tu repositorio.
2. **Configuraciones de Compilación**:
   - **Framework Preset**: `Vite`.
   - **Root Directory**: `./` (dejar el directorio raíz, ya que el frontend vive en la raíz del proyecto).
   - **Build Command**: `npm run build` (o `vite build`).
   - **Output Directory**: `dist`.
3. **Variables de Entorno**: Despliega la sección **Environment Variables** y configura las siguientes:
   - `VITE_API_URL`: *La URL generada por Render/Railway para tu backend* (ej. `https://biblion-backend.onrender.com`). ⚠️ **No agregues una barra diagonal al final (`/`)**.
   - `VITE_GOOGLE_BOOKS_API_KEY`: `AIzaSyDo5DjCSMnCKOVe3OiCFvKO9sIwQooKbNY` (o tu propia API Key).
   - `VITE_EMAILJS_SERVICE_ID`: `service_2f9r1zn`
   - `VITE_EMAILJS_TEMPLATE_ID`: `template_c0icl2r`
   - `VITE_EMAILJS_PUBLIC_KEY`: `pjinHRJc-iEPwleFS`
   - `VITE_EMAILJS_ADMIN_TEMPLATE_ID`: `template_xp9zi4z`
   - `VITE_EMAILJS_DM_REPLY_TEMPLATE_ID`: *(dejar vacío o configurar si tienes una plantilla)*
4. **Desplegar**: Haz clic en **Deploy**. Vercel compilará la aplicación y te otorgará un dominio público (ej. `https://proyecto-biblioteca.vercel.app`).

---

## 3. Sincronización Final (CORS)

Una vez que Vercel termine de desplegar tu frontend y te otorgue tu URL final (por ejemplo, `https://biblion.vercel.app`):

1. Ve al panel de control de **Render** (o Railway) de tu backend.
2. Ve a las variables de entorno de tu servicio.
3. Actualiza el valor de `CLIENT_URL` colocando tu URL final de Vercel (puedes separar múltiples URLs por comas si quieres conservar `http://localhost:5173` para pruebas locales).
   - Ejemplo: `CLIENT_URL=http://localhost:5173, https://biblion.vercel.app`
4. Guarda los cambios. Render reconstruirá y desplegará de nuevo el backend automáticamente.

¡Listo! Con esto, tanto el frontend como el backend estarán sincronizados de forma segura mediante CORS, las comunicaciones Socket.IO funcionarán en tiempo real y todos los datos se persistirán permanentemente en Supabase.
