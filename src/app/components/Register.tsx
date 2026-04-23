import { useState, useEffect } from "react";
import {
  BookOpen, User, Mail, Lock, Calendar,
  MapPin, Home, FileText, Tag, Eye, EyeOff,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useShop } from "../store/ShopContext";

// ── VALIDADORES ───────────────────────────────────────────────
function validateDNI(v: string) {
  if (!v) return "El DNI es obligatorio";
  if (!/^\d+$/.test(v)) return "El DNI solo debe contener números";
  if (v.length < 7 || v.length > 10) return "El DNI debe tener entre 7 y 10 dígitos";
  return "";
}
function validateName(v: string, field: string) {
  if (!v.trim()) return `${field} es obligatorio`;
  if (v.trim().length < 2) return `${field} debe tener al menos 2 caracteres`;
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/.test(v))
    return `${field} solo puede contener letras, espacios, guiones y apóstrofes`;
  if (/\s{2,}/.test(v)) return `${field} no puede tener espacios consecutivos`;
  return "";
}
function validateDate(v: string) {
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
}
function validateEmail(v: string) {
  if (!v) return "El correo electrónico es obligatorio";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Ingresa un correo electrónico válido";
  return "";
}
function validateUsername(v: string) {
  if (!v) return "El usuario es obligatorio";
  if (v.length < 4) return "El usuario debe tener al menos 4 caracteres";
  if (v.length > 20) return "El usuario no puede tener más de 20 caracteres";
  if (/\s/.test(v)) return "El usuario no puede contener espacios";
  if (!/^[a-zA-Z0-9_.-]+$/.test(v)) return "Solo letras, números, puntos, guiones y guiones bajos";
  return "";
}
function validatePassword(v: string) {
  if (!v) return "La contraseña es obligatoria";
  if (/\s/.test(v)) return "La contraseña no puede contener espacios en blanco";
  if (v.length < 8) return "La contraseña debe tener al menos 8 caracteres";
  if (!/[A-Z]/.test(v)) return "Debe incluir al menos una letra mayúscula";
  if (!/[0-9]/.test(v)) return "Debe incluir al menos un número";
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v))
    return "Debe incluir al menos un carácter especial (!@#$%...)";
  return "";
}
function validateConfirm(pass: string, confirm: string) {
  if (!confirm) return "Confirma tu contraseña";
  if (pass !== confirm) return "Las contraseñas no coinciden";
  return "";
}
function getPasswordStrength(v: string): { score: number; label: string; color: string } {
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
}

interface FieldError { [key: string]: string }

export function Register() {
  const navigate = useNavigate();
  const { register } = useShop();

  const [formData, setFormData] = useState({
    dni: "", nombres: "", apellidos: "", fechaNacimiento: "",
    lugarNacimiento: "", direccion: "", genero: "", correo: "",
    temasPreferencia: [] as string[],
    usuario: "", contrasena: "", confirmarContrasena: "",
  });
  const [errors, setErrors]   = useState<FieldError>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const passStrength = getPasswordStrength(formData.contrasena);

  function validate(data: typeof formData): FieldError {
    return {
      dni:                validateDNI(data.dni),
      nombres:            validateName(data.nombres, "Los nombres"),
      apellidos:          validateName(data.apellidos, "Los apellidos"),
      fechaNacimiento:    validateDate(data.fechaNacimiento),
      lugarNacimiento:    !data.lugarNacimiento.trim() ? "El lugar de nacimiento es obligatorio" : "",
      direccion:          !data.direccion.trim() ? "La dirección es obligatoria" : "",
      genero:             !data.genero ? "Selecciona un género" : "",
      correo:             validateEmail(data.correo),
      usuario:            validateUsername(data.usuario),
      contrasena:         validatePassword(data.contrasena),
      confirmarContrasena: validateConfirm(data.contrasena, data.confirmarContrasena),
      temasPreferencia:   data.temasPreferencia.length === 0 ? "Selecciona al menos un tema de preferencia" : "",
    };
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    setServerError("");
    if (touched[name]) {
      const newErrors = validate(updated);
      setErrors(prev => ({ ...prev, [name]: newErrors[name] }));
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const newErrors = validate(formData);
    setErrors(prev => ({ ...prev, [name]: newErrors[name] }));
  }

  function toggleTema(tema: string) {
    setFormData(prev => {
      const selected = prev.temasPreferencia.includes(tema)
        ? prev.temasPreferencia.filter(t => t !== tema)
        : [...prev.temasPreferencia, tema];
      
      const newErrors = validate({ ...prev, temasPreferencia: selected });
      setErrors(curr => ({ ...curr, temasPreferencia: newErrors.temasPreferencia }));
      
      return { ...prev, temasPreferencia: selected };
    });
    setTouched(prev => ({ ...prev, temasPreferencia: true }));
  }

  // Effect para componer fechaNacimiento desde los selects
  const [bDay, setBDay] = useState("");
  const [bMonth, setBMonth] = useState("");
  const [bYear, setBYear] = useState("");

  useEffect(() => {
    if (bDay && bMonth && bYear) {
      const dateStr = `${bYear}-${bMonth.padStart(2, "0")}-${bDay.padStart(2, "0")}`;
      setFormData(prev => ({ ...prev, fechaNacimiento: dateStr }));
      if (touched.fechaNacimiento) {
        const newErrors = validate({ ...formData, fechaNacimiento: dateStr });
        setErrors(prev => ({ ...prev, fechaNacimiento: newErrors.fechaNacimiento }));
      }
    } else {
      setFormData(prev => ({ ...prev, fechaNacimiento: "" }));
    }
  }, [bDay, bMonth, bYear]);


  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    // Marcar todos los campos como tocados para mostrar errores
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(k => { allTouched[k] = true; });
    setTouched(allTouched);

    const newErrors = validate(formData);
    setErrors(newErrors);
    if (Object.values(newErrors).some(v => v !== "")) return;

    setLoading(true);
    setTimeout(() => {
      // Llamar al contexto para registrar al usuario
      const result = register({
        nombres:          formData.nombres,
        apellidos:        formData.apellidos,
        dni:              formData.dni,
        fechaNacimiento:  formData.fechaNacimiento,
        lugarNacimiento:  formData.lugarNacimiento,
        direccion:        formData.direccion,
        genero:           formData.genero,
        correo:           formData.correo,
        usuario:          formData.usuario,
        contrasena:       formData.contrasena,
        temasPreferencia: formData.temasPreferencia,
      });

      setLoading(false);

      if (!result.success) {
        // Error de servidor (correo o usuario duplicado)
        setServerError(result.error || "Error al crear la cuenta. Inténtalo de nuevo.");
        if (result.error?.includes("correo")) {
          setErrors(prev => ({ ...prev, correo: result.error! }));
          setTouched(prev => ({ ...prev, correo: true }));
        }
        if (result.error?.includes("usuario")) {
          setErrors(prev => ({ ...prev, usuario: result.error! }));
          setTouched(prev => ({ ...prev, usuario: true }));
        }
        return;
      }

      // Registro exitoso
      setSubmitted(true);
    }, 800);
  }

  // ── PANTALLA DE ÉXITO ─────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#FEFAE0" }}>
        <div className="w-full max-w-md rounded-2xl shadow-2xl p-10 text-center" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: "#606C38" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="40" height="40">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2"
            style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
            ¡Cuenta creada!
          </h2>
          <p className="text-sm mb-2" style={{ color: "#6B5344" }}>
            Bienvenido/a a Biblioteca Digital, <strong>{formData.nombres}</strong>.
          </p>
          <p className="text-xs mb-1" style={{ color: "#6B5344", opacity: 0.75 }}>
            Usuario: <strong className="font-mono">{formData.usuario}</strong>
          </p>
          <p className="text-xs mb-6" style={{ color: "#6B5344", opacity: 0.75 }}>
            Correo: <strong>{formData.correo}</strong>
          </p>

          {/* Cuadro resumen de credenciales */}
          <div className="rounded-xl p-4 mb-6 text-left"
            style={{ background: "#F5EDD3", border: "1.5px solid #E8C99A" }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "#4A3728" }}>
              🔑 Usa estas credenciales para iniciar sesión:
            </p>
            <div className="space-y-1 text-xs" style={{ color: "#6B5344" }}>
              <div className="flex gap-2">
                <span className="w-20 flex-shrink-0 font-medium">Usuario:</span>
                <span className="font-mono font-bold" style={{ color: "#4A3728" }}>{formData.usuario}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-20 flex-shrink-0 font-medium">Correo:</span>
                <span style={{ color: "#4A3728" }}>{formData.correo}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-20 flex-shrink-0 font-medium">Contraseña:</span>
                <span className="font-mono font-bold" style={{ color: "#4A3728" }}>{formData.contrasena}</span>
              </div>
            </div>
          </div>

          <button onClick={() => navigate("/")}
            className="w-full py-3 rounded-lg font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: "#4A3728", color: "#FEFAE0" }}>
            Ir a iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  const errorCount = Object.values(errors).filter(v => v !== "").length;

  // ── FORMULARIO ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12" style={{ backgroundColor: "#FEFAE0" }}>
      <div className="w-full max-w-4xl">
        <div className="rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10" style={{ backgroundColor: "#FFFFFF" }}>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
              style={{ backgroundColor: "#4A3728" }}>
              <BookOpen className="w-10 h-10" style={{ color: "#D4A373" }} />
            </div>
            <h1 className="text-2xl font-bold mb-2"
              style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
              Registro de Nuevo Usuario
            </h1>
            <p className="text-sm" style={{ color: "#4A3728", opacity: 0.7 }}>
              Completa tus datos para unirte a nuestra biblioteca
            </p>
          </div>

          {/* Error de servidor (correo/usuario duplicado) */}
          {serverError && (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3.5 mb-6"
              style={{ background: "rgba(192,57,43,0.08)", border: "1.5px solid #C0392B" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-sm" style={{ color: "#C0392B" }}>{serverError}</p>
            </div>
          )}

          {/* Error de validación (resumen) */}
          {Object.values(touched).some(Boolean) && errorCount > 0 && (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3.5 mb-6"
              style={{ background: "rgba(192,57,43,0.06)", border: "1.5px solid #C0392B" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-sm" style={{ color: "#C0392B" }}>
                Hay <strong>{errorCount}</strong> campo{errorCount !== 1 ? "s" : ""} con errores. Corrígelos para continuar.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* ── Información Personal ── */}
            <h3 className="text-sm font-bold mb-4 pb-2 border-b"
              style={{ color: "#4A3728", borderColor: "#D4A373" }}>
              Información Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

              {/* DNI */}
              <FieldInput id="dni" name="dni" label="DNI" value={formData.dni}
                placeholder="12345678" icon={<FileText className="w-5 h-5" />}
                error={touched.dni ? errors.dni : ""}
                onChange={handleChange} onBlur={handleBlur as any} />

              {/* Fecha de Nacimiento (Selects) */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-sm font-medium" style={{ color: "#4A3728" }}>
                  Fecha de Nacimiento <span style={{ color: "#C0392B" }}>*</span>
                </label>
                <div className="flex gap-2">
                  <select value={bDay} onChange={e => { setBDay(e.target.value); setTouched(p => ({ ...p, fechaNacimiento: true })); }}
                    className="flex-1 pl-3 pr-8 py-3 rounded-lg border-2 focus:outline-none appearance-none text-sm"
                    style={{ backgroundColor: "#FEFAE0", borderColor: touched.fechaNacimiento && errors.fechaNacimiento ? "#C0392B" : "#D4A373", color: "#4A3728" }}>
                    <option value="">Día</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d.toString()}>{d}</option>
                    ))}
                  </select>
                  
                  <select value={bMonth} onChange={e => { setBMonth(e.target.value); setTouched(p => ({ ...p, fechaNacimiento: true })); }}
                    className="flex-1 pl-3 pr-8 py-3 rounded-lg border-2 focus:outline-none appearance-none text-sm"
                    style={{ backgroundColor: "#FEFAE0", borderColor: touched.fechaNacimiento && errors.fechaNacimiento ? "#C0392B" : "#D4A373", color: "#4A3728" }}>
                    <option value="">Mes</option>
                    {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map((m, i) => (
                      <option key={i + 1} value={(i + 1).toString()}>{m}</option>
                    ))}
                  </select>

                  <select value={bYear} onChange={e => { setBYear(e.target.value); setTouched(p => ({ ...p, fechaNacimiento: true })); }}
                    className="flex-1 pl-3 pr-8 py-3 rounded-lg border-2 focus:outline-none appearance-none text-sm"
                    style={{ backgroundColor: "#FEFAE0", borderColor: touched.fechaNacimiento && errors.fechaNacimiento ? "#C0392B" : "#D4A373", color: "#4A3728" }}>
                    <option value="">Año</option>
                    {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 13 - i).map(y => (
                      <option key={y} value={y.toString()}>{y}</option>
                    ))}
                  </select>
                </div>
                {touched.fechaNacimiento && errors.fechaNacimiento && (
                  <FieldErr msg={errors.fechaNacimiento} />
                )}
              </div>

              <FieldInput id="nombres" name="nombres" label="Nombres" value={formData.nombres}
                placeholder="Juan Carlos" icon={<User className="w-5 h-5" />}
                error={touched.nombres ? errors.nombres : ""}
                onChange={handleChange} onBlur={handleBlur as any} />

              <FieldInput id="apellidos" name="apellidos" label="Apellidos" value={formData.apellidos}
                placeholder="Salazar Londoño" icon={<User className="w-5 h-5" />}
                error={touched.apellidos ? errors.apellidos : ""}
                onChange={handleChange} onBlur={handleBlur as any} />

              <FieldInput id="lugarNacimiento" name="lugarNacimiento" label="Lugar de Nacimiento"
                value={formData.lugarNacimiento} placeholder="Pereira, Colombia"
                icon={<MapPin className="w-5 h-5" />}
                error={touched.lugarNacimiento ? errors.lugarNacimiento : ""}
                onChange={handleChange} onBlur={handleBlur as any} />

              {/* Género */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: "#4A3728" }}>
                  Género <span style={{ color: "#C0392B" }}>*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 z-10"
                    style={{ color: "#D4A373" }} />
                  <select id="genero" name="genero" value={formData.genero}
                    onChange={handleChange} onBlur={handleBlur as any}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border-2 focus:outline-none appearance-none text-sm"
                    style={{
                      backgroundColor: "#FEFAE0",
                      borderColor: touched.genero && errors.genero ? "#C0392B" : "#D4A373",
                      color: "#4A3728",
                    }}>
                    <option value="">Seleccionar…</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                    <option value="prefiero-no-decir">Prefiero no decir</option>
                  </select>
                </div>
                {touched.genero && errors.genero && <FieldErr msg={errors.genero} />}
              </div>
            </div>

            <FieldInput id="direccion" name="direccion" label="Dirección"
              value={formData.direccion} placeholder="Calle Principal 123, Barrio, Ciudad"
              icon={<Home className="w-5 h-5" />}
              error={touched.direccion ? errors.direccion : ""}
              onChange={handleChange} onBlur={handleBlur as any} />

            {/* ── Información de Cuenta ── */}
            <h3 className="text-sm font-bold mt-7 mb-4 pb-2 border-b"
              style={{ color: "#4A3728", borderColor: "#D4A373" }}>
              Información de Cuenta
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

              <FieldInput id="correo" name="correo" type="email" label="Correo Electrónico"
                value={formData.correo} placeholder="tu@correo.com"
                icon={<Mail className="w-5 h-5" />}
                error={touched.correo ? errors.correo : ""}
                onChange={handleChange} onBlur={handleBlur as any} />

              <FieldInput id="usuario" name="usuario" label="Nombre de Usuario"
                value={formData.usuario} placeholder="ivan_Sala"
                icon={<User className="w-5 h-5" />}
                error={touched.usuario ? errors.usuario : ""}
                onChange={handleChange} onBlur={handleBlur as any} />

              {/* Contraseña */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: "#4A3728" }}>
                  Contraseña <span style={{ color: "#C0392B" }}>*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                    style={{ color: touched.contrasena && errors.contrasena ? "#C0392B" : "#D4A373" }} />
                  <input id="contrasena" name="contrasena"
                    type={showPass ? "text" : "password"}
                    value={formData.contrasena} placeholder="Mín. 8 caracteres"
                    onChange={handleChange} onBlur={handleBlur as any}
                    className="w-full pl-11 pr-11 py-3 rounded-lg border-2 focus:outline-none text-sm"
                    style={{
                      backgroundColor: "#FEFAE0",
                      borderColor: touched.contrasena && errors.contrasena ? "#C0392B" : "#D4A373",
                      color: "#4A3728",
                    }} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#D4A373" }}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Indicador de fortaleza */}
                {formData.contrasena && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-all"
                          style={{ background: i <= passStrength.score ? passStrength.color : "#EDE0C4" }} />
                      ))}
                    </div>
                    <p className="text-xs font-medium" style={{ color: passStrength.color }}>
                      Contraseña {passStrength.label}
                    </p>
                  </div>
                )}
                {touched.contrasena && errors.contrasena && <FieldErr msg={errors.contrasena} />}
                {/* Requisitos */}
                <ul className="text-xs space-y-0.5 mt-1" style={{ color: "#6B5344" }}>
                  {[
                    ["Sin espacios en blanco", !/\s/.test(formData.contrasena) && formData.contrasena.length > 0],
                    ["Mínimo 8 caracteres",    formData.contrasena.length >= 8],
                    ["Al menos una mayúscula", /[A-Z]/.test(formData.contrasena)],
                    ["Al menos un número",     /[0-9]/.test(formData.contrasena)],
                    ["Al menos un carácter especial", /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.contrasena)],
                  ].map(([text, ok]) => (
                    <li key={text as string} className="flex items-center gap-1.5">
                      <span style={{ color: ok ? "#606C38" : "#D4A373" }}>{ok ? "✓" : "○"}</span>
                      <span style={{ color: ok ? "#606C38" : "#6B5344" }}>{text as string}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Confirmar contraseña */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: "#4A3728" }}>
                  Confirmar Contraseña <span style={{ color: "#C0392B" }}>*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                    style={{ color: touched.confirmarContrasena && errors.confirmarContrasena ? "#C0392B" : "#D4A373" }} />
                  <input id="confirmarContrasena" name="confirmarContrasena"
                    type={showConfirm ? "text" : "password"}
                    value={formData.confirmarContrasena} placeholder="Repite tu contraseña"
                    onChange={handleChange} onBlur={handleBlur as any}
                    className="w-full pl-11 pr-11 py-3 rounded-lg border-2 focus:outline-none text-sm"
                    style={{
                      backgroundColor: "#FEFAE0",
                      borderColor: touched.confirmarContrasena && errors.confirmarContrasena
                        ? "#C0392B"
                        : formData.confirmarContrasena && !errors.confirmarContrasena
                          ? "#606C38"
                          : "#D4A373",
                      color: "#4A3728",
                    }} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#D4A373" }}>
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {touched.confirmarContrasena && errors.confirmarContrasena && (
                  <FieldErr msg={errors.confirmarContrasena} />
                )}
                {formData.confirmarContrasena && !errors.confirmarContrasena && touched.confirmarContrasena && (
                  <p className="text-xs" style={{ color: "#606C38" }}>✓ Las contraseñas coinciden</p>
                )}
              </div>
            </div>

            {/* ── Preferencias ── */}
            <h3 className="text-sm font-bold mt-7 mb-4 pb-2 border-b"
              style={{ color: "#4A3728", borderColor: "#D4A373" }}>
              Preferencias de Lectura
            </h3>
            <div className="space-y-3">
              <label className="block text-sm font-medium" style={{ color: "#4A3728" }}>
                Temas de Preferencia <span style={{ color: "#C0392B" }}>*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {["Ficción","No Ficción","Ciencia","Historia","Tecnología",
                  "Arte","Filosofía","Poesía","Biografía","Infantil","Juvenil","Novela Gráfica"
                ].map(t => {
                  const val = t.toLowerCase();
                  const isSelected = formData.temasPreferencia.includes(val);
                  return (
                    <button type="button" key={t} onClick={() => toggleTema(val)}
                      className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                      style={{
                        backgroundColor: isSelected ? "#606C38" : "#FEFAE0",
                        color: isSelected ? "#FEFAE0" : "#4A3728",
                        border: `1.5px solid ${isSelected ? "#606C38" : "#E8C99A"}`
                      }}>
                      {t}
                    </button>
                  );
                })}
              </div>
              {touched.temasPreferencia && errors.temasPreferencia && (
                <FieldErr msg={errors.temasPreferencia} />
              )}
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-2">
              <button type="submit" disabled={loading}
                className="flex-1 py-3 rounded-lg font-medium transition-all hover:opacity-90 hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: "#606C38", color: "#FEFAE0" }}>
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creando cuenta…</>
                  : "Crear Cuenta"}
              </button>
              <Link to="/" className="flex-1">
                <button type="button"
                  className="w-full py-3 rounded-lg font-medium border-2 transition-all hover:shadow-md"
                  style={{ borderColor: "#D4A373", color: "#4A3728", backgroundColor: "transparent" }}>
                  Ya tengo cuenta
                </button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── COMPONENTES AUXILIARES ────────────────────────────────────
function FieldErr({ msg }: { msg: string }) {
  return (
    <p className="text-xs flex items-center gap-1" style={{ color: "#C0392B" }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {msg}
    </p>
  );
}

interface FieldInputProps {
  id: string; name: string; type?: string; label: string;
  value: string; placeholder?: string; icon: React.ReactNode;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}
function FieldInput({ id, name, type = "text", label, value, placeholder, icon, error, onChange, onBlur }: FieldInputProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium" style={{ color: "#4A3728" }}>
        {label} <span style={{ color: "#C0392B" }}>*</span>
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
          style={{ color: error ? "#C0392B" : "#D4A373" }}>
          {icon}
        </span>
        <input id={id} name={name} type={type} value={value} placeholder={placeholder}
          onChange={onChange} onBlur={onBlur}
          className="w-full pl-11 pr-4 py-3 rounded-lg border-2 focus:outline-none text-sm"
          style={{
            backgroundColor: "#FEFAE0",
            borderColor: error ? "#C0392B" : "#D4A373",
            color: "#4A3728",
          }} />
      </div>
      {error && <FieldErr msg={error} />}
    </div>
  );
}
