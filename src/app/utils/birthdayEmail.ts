import emailjs from "@emailjs/browser";

// ── CLAVES EmailJS (desde .env) ───────────────────────────────
const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  as string;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  as string;

// ── PERSISTENCIA DE CUPONES (localStorage) ───────────────────
const LS_COUPONS_KEY = "biblion_birthday_coupons";

export interface BirthdayCoupon {
  userId: string;
  code: string;
  discount: number;          // porcentaje, ej: 15
  generatedAt: string;       // ISO date
  expiresAt: string;         // ISO date (generatedAt + 2 días)
  used: boolean;
  emailSentAt: string;       // ISO date del día en que se envió
}

/** Carga todos los cupones desde localStorage */
function loadCoupons(): BirthdayCoupon[] {
  try {
    const raw = localStorage.getItem(LS_COUPONS_KEY);
    return raw ? (JSON.parse(raw) as BirthdayCoupon[]) : [];
  } catch {
    return [];
  }
}

/** Guarda todos los cupones en localStorage */
function saveCoupons(coupons: BirthdayCoupon[]) {
  try {
    localStorage.setItem(LS_COUPONS_KEY, JSON.stringify(coupons));
  } catch { /* ignorar */ }
}

// ── DETECCIÓN DE CUMPLEAÑOS ──────────────────────────────────

/**
 * Retorna true si hoy (día y mes) coincide con la fecha de nacimiento.
 * @param fechaNacimiento formato ISO "YYYY-MM-DD"
 */
export function isTodayBirthday(fechaNacimiento: string): boolean {
  if (!fechaNacimiento) return false;
  const today = new Date();
  const [, birthMonth, birthDay] = fechaNacimiento.split("-");
  return (
    today.getDate()    === parseInt(birthDay,   10) &&
    today.getMonth()   === parseInt(birthMonth, 10) - 1
  );
}

// ── LÓGICA DE CUPÓN ──────────────────────────────────────────

/**
 * Genera un código de cupón único para cumpleaños.
 * Formato: CUMPLE-[4 chars aleatorios en mayúsculas]
 */
function generateCouponCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CUMPLE-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Retorna el cupón activo de cumpleaños para un usuario hoy,
 * o null si no existe / ya se usó / expiró.
 */
export function getActiveBirthdayCoupon(userId: string): BirthdayCoupon | null {
  const coupons = loadCoupons();
  const now = new Date();
  const today = now.toISOString().slice(0, 10); // "YYYY-MM-DD"

  return (
    coupons.find(
      (c) =>
        c.userId === userId &&
        !c.used &&
        new Date(c.expiresAt) > now &&
        c.emailSentAt.slice(0, 10) >= today
    ) ?? null
  );
}

/**
 * Retorna true si el correo de cumpleaños YA se envió hoy para ese usuario.
 * Evita envíos duplicados si el usuario cierra sesión y vuelve a iniciarla el mismo día.
 */
export function hasBirthdayEmailBeenSentToday(userId: string): boolean {
  const coupons = loadCoupons();
  const today = new Date().toISOString().slice(0, 10);
  return coupons.some(
    (c) => c.userId === userId && c.emailSentAt.slice(0, 10) === today
  );
}

/**
 * Crea y persiste un nuevo cupón de cumpleaños para el usuario.
 * Retorna el cupón recién creado.
 */
export function createBirthdayCoupon(userId: string): BirthdayCoupon {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); // +1 día

  const coupon: BirthdayCoupon = {
    userId,
    code: generateCouponCode(),
    discount: 15,
    generatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    used: false,
    emailSentAt: now.toISOString(),
  };

  const coupons = loadCoupons();
  saveCoupons([...coupons, coupon]);
  return coupon;
}

/**
 * Marca el cupón como usado. Retorna true si se encontró y marcó.
 */
export function useBirthdayCoupon(code: string): boolean {
  const coupons = loadCoupons();
  const idx = coupons.findIndex(
    (c) => c.code === code && !c.used && new Date(c.expiresAt) > new Date()
  );
  if (idx === -1) return false;
  coupons[idx] = { ...coupons[idx], used: true };
  saveCoupons(coupons);
  return true;
}

/**
 * Busca un cupón válido por su código. Retorna null si no existe,
 * ya fue usado, o está expirado.
 */
export function validateCouponCode(code: string): BirthdayCoupon | null {
  const coupons = loadCoupons();
  const now = new Date();
  return (
    coupons.find(
      (c) =>
        c.code === code.toUpperCase().trim() &&
        !c.used &&
        new Date(c.expiresAt) > now
    ) ?? null
  );
}

// ── ENVÍO DE CORREO ──────────────────────────────────────────

/**
 * Envía el correo de cumpleaños con el enlace del bono vía EmailJS.
 * @param nombre    Nombre del usuario
 * @param correo    Email de destino
 * @param couponCode Código del cupón generado
 * @param baseUrl   URL base de la aplicación (para el enlace)
 */
export async function sendBirthdayEmail(
  nombre: string,
  correo: string,
  couponCode: string,
  baseUrl: string = window.location.origin
): Promise<void> {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn("[Biblion] EmailJS no configurado — correo de cumpleaños no enviado.");
    return;
  }

  const bonoUrl = `${baseUrl}/?bono=cumpleanos&code=${couponCode}`;

  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      to_name:    nombre,
      to_email:   correo,
      bono_url:   bonoUrl,
      coupon_code: couponCode,
      discount:   "15%",
      expires_in: "1 día",
    },
    PUBLIC_KEY
  );
}
