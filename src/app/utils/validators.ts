/**
 * Validadores compartidos para formularios
 */

export const validateDNI = (v: string): string => {
  if (!v) return "El DNI es obligatorio";
  if (!/^\d+$/.test(v)) return "El DNI solo debe contener números";
  if (v.length < 7 || v.length > 10) return "El DNI debe tener entre 7 y 10 dígitos";
  return "";
};

export const validateName = (v: string, field: string): string => {
  if (!v.trim()) return `${field} es obligatorio`;
  if (v.trim().length < 2) return `${field} debe tener al menos 2 caracteres`;
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/.test(v))
    return `${field} solo puede contener letras, espacios, guiones y apóstrofes`;
  if (/\s{2,}/.test(v)) return `${field} no puede tener espacios consecutivos`;
  return "";
};

export const validateDate = (v: string): string => {
  if (!v) return "La fecha de nacimiento es obligatoria";
  const date = new Date(v);
  const today = new Date();
  if (isNaN(date.getTime())) return "Fecha inválida";
  if (date > today) return "La fecha no puede ser futura";
  const age = today.getFullYear() - date.getFullYear() -
    (today < new Date(today.getFullYear(), date.getMonth(), date.getDate()) ? 1 : 0);
  if (age < 13) return "Debes tener al menos 13 años para registrarte";
  if (age > 120) return "Fecha de nacimiento inválida";
  return "";
};

export const validateEmail = (v: string): string => {
  if (!v) return "El correo electrónico es obligatorio";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Ingresa un correo electrónico válido";
  return "";
};

export const validateUsername = (v: string): string => {
  if (!v) return "El usuario es obligatorio";
  if (v.length < 4) return "El usuario debe tener al menos 4 caracteres";
  if (v.length > 20) return "El usuario no puede tener más de 20 caracteres";
  if (/\s/.test(v)) return "El usuario no puede contener espacios";
  if (!/^[a-zA-Z0-9_.-]+$/.test(v)) return "Solo letras, números, puntos, guiones y guiones bajos";
  return "";
};

export const validatePassword = (v: string): string => {
  if (!v) return "La contraseña es obligatoria";
  if (/\s/.test(v)) return "La contraseña no puede contener espacios en blanco";
  if (v.length < 8) return "La contraseña debe tener al menos 8 caracteres";
  if (!/[A-Z]/.test(v)) return "Debe incluir al menos una letra mayúscula";
  if (!/[0-9]/.test(v)) return "Debe incluir al menos un número";
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v))
    return "Debe incluir al menos un carácter especial (!@#$%...)";
  return "";
};

export const validateConfirm = (pass: string, confirm: string): string => {
  if (!confirm) return "Confirma tu contraseña";
  if (pass !== confirm) return "Las contraseñas no coinciden";
  return "";
};

export const getPasswordStrength = (v: string) => {
  if (!v) return { score: 0, label: "", color: "" };
  let score = 0;
  if (v.length >= 8) score++;
  if (/[A-Z]/.test(v)) score++;
  if (/[0-9]/.test(v)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v)) score++;
  if (v.length >= 12) score++;
  if (score <= 2) return { score, label: "Débil", color: "#C0392B" };
  if (score <= 3) return { score, label: "Media", color: "#D4A373" };
  return { score, label: "Fuerte", color: "#606C38" };
};
