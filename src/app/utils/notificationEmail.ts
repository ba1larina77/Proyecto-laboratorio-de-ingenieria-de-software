import emailjs from "@emailjs/browser";

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID as string;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string;

/**
 * ID del template de respuesta de mensajes directos.
 * Agrega VITE_EMAILJS_DM_REPLY_TEMPLATE_ID en tu .env con el ID del template de EmailJS.
 * Variables del template: to_name, to_email, admin_name, message_preview, chat_url, library_name
 */
const DM_REPLY_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_DM_REPLY_TEMPLATE_ID as string;

/**
 * Clave de localStorage para controlar que no se envíe más de 1 correo
 * por sesión por conversación (evita spam si el usuario tiene el tab oculto mucho tiempo).
 */
const LS_DM_EMAIL_SENT = "biblion_dm_email_sent";

function getEmailSentRecord(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LS_DM_EMAIL_SENT);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function markEmailSent(convId: string) {
  const record = getEmailSentRecord();
  record[convId] = Date.now();
  localStorage.setItem(LS_DM_EMAIL_SENT, JSON.stringify(record));
}

/**
 * Retorna true si ya se envió un correo para esta conversación
 * en los últimos `cooldownMs` milisegundos (por defecto 5 minutos).
 */
function wasEmailRecentlySent(convId: string, cooldownMs = 5 * 60 * 1000): boolean {
  const record = getEmailSentRecord();
  const lastSent = record[convId];
  if (!lastSent) return false;
  return Date.now() - lastSent < cooldownMs;
}

/**
 * Envía un correo al usuario notificándole que el admin respondió su mensaje.
 * Solo se envía si EmailJS está configurado y no se ha enviado uno recientemente.
 *
 * @param convId       ID de la conversación (para el cooldown)
 * @param userName     Nombre del usuario destinatario
 * @param userEmail    Correo del usuario
 * @param adminName    Nombre del administrador que respondió
 * @param preview      Primeras palabras del mensaje del admin (max 100 chars)
 */
export async function sendAdminReplyEmail(
  convId: string,
  userName: string,
  userEmail: string,
  adminName: string,
  preview: string,
): Promise<void> {
  if (!SERVICE_ID || !DM_REPLY_TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn("[Biblion] VITE_EMAILJS_DM_REPLY_TEMPLATE_ID no configurado — notificación de respuesta no enviada.");
    return;
  }

  if (wasEmailRecentlySent(convId)) return;

  const chatUrl = `${window.location.origin}/`;
  const messagePreview = preview.length > 100 ? preview.slice(0, 97) + "…" : preview;

  await emailjs.send(
    SERVICE_ID,
    DM_REPLY_TEMPLATE_ID,
    {
      to_name:         userName,
      to_email:        userEmail,
      admin_name:      adminName,
      message_preview: messagePreview,
      chat_url:        chatUrl,
      library_name:    "Biblion",
    },
    PUBLIC_KEY,
  );

  markEmailSent(convId);
}
