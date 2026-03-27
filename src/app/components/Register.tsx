import { useState } from "react";
import { BookOpen, User, Mail, Lock, Calendar, MapPin, Home, FileText, Tag, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router";

// ── VALIDADORES ──────────────────────────────────────────────
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
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v)) return "Debe incluir al menos un carácter especial (!@#$%...)";
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

interface InputFieldProps {
  id: string; name: string; type?: string; label: string;
  value: string; placeholder?: string; icon: React.ReactNode;
  error?: string; required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  extra?: React.ReactNode;
}

function InputField({ id, name, type = "text", label, value, placeholder, icon, error, required, onChange, onBlur, extra }: InputFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium" style={{ color: "#4A3728" }}>
        {label} {required && <span style={{ color: "#C0392B" }}>*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: error ? "#C0392B" : "#D4A373" }}>
          {icon}
        </span>
        <input id={id} name={name} type={type} value={value} placeholder={placeholder}
          onChange={onChange} onBlur={onBlur}
          className="w-full pl-11 pr-4 py-3 rounded-lg border-2 focus:outline-none transition-all text-sm"
          style={{
            backgroundColor: "#FEFAE0",
            borderColor: error ? "#C0392B" : "#D4A373",
            color: "#4A3728",
          }} />
        {extra}
      </div>
      {error && (
        <p className="text-xs flex items-center gap-1" style={{ color: "#C0392B" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

export function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    dni: "", nombres: "", apellidos: "", fechaNacimiento: "",
    lugarNacimiento: "", direccion: "", genero: "", correo: "",
    temasPreferencia: [] as string[], usuario: "",
    contrasena: "", confirmarContrasena: ""
  });
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const passStrength = getPasswordStrength(formData.contrasena);

  function validate(data: typeof formData): FieldError {
    return {
      dni: validateDNI(data.dni),
      nombres: validateName(data.nombres, "Los nombres"),
      apellidos: validateName(data.apellidos, "Los apellidos"),
      fechaNacimiento: validateDate(data.fechaNacimiento),
      lugarNacimiento: !data.lugarNacimiento.trim() ? "El lugar de nacimiento es obligatorio" : "",
      direccion: !data.direccion.trim() ? "La dirección es obligatoria" : "",
      genero: !data.genero ? "Selecciona un género" : "",
      correo: validateEmail(data.correo),
      usuario: validateUsername(data.usuario),
      contrasena: validatePassword(data.contrasena),
      confirmarContrasena: validateConfirm(data.contrasena, data.confirmarContrasena),
      temasPreferencia: data.temasPreferencia.length === 0 ? "Selecciona al menos un tema de preferencia" : "",
    };
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
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

  function handleTemasChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const options = e.target.options;
    const selected: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) selected.push(options[i].value);
    }
    const updated = { ...formData, temasPreferencia: selected };
    setFormData(updated);
    if (touched.temasPreferencia) {
      setErrors(prev => ({ ...prev, temasPreferencia: selected.length === 0 ? "Selecciona al menos un tema" : "" }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(k => { allTouched[k] = true; });
    setTouched(allTouched);
    const newErrors = validate(formData);
    setErrors(newErrors);
    const hasErrors = Object.values(newErrors).some(v => v !== "");
    if (hasErrors) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#FEFAE0" }}>
        <div className="w-full max-w-md rounded-2xl shadow-2xl p-10 text-center" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: "#606C38" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="40" height="40">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
            ¡Cuenta creada!
          </h2>
          <p className="text-sm mb-6" style={{ color: "#6B5344" }}>
            Bienvenido a Biblioteca Digital, <strong>{formData.nombres}</strong>.
            Tu cuenta ha sido registrada exitosamente.
          </p>
          <button onClick={() => navigate("/")}
            className="w-full py-3 rounded-lg font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: "#4A3728", color: "#FEFAE0" }}>
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  const errorCount = Object.values(errors).filter(v => v !== "").length;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12" style={{ backgroundColor: "#FEFAE0" }}>
      <div className="w-full max-w-4xl">
        <div className="rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10" style={{ backgroundColor: "#FFFFFF" }}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: "#4A3728" }}>
              <BookOpen className="w-10 h-10" style={{ color: "#D4A373" }} />
            </div>
            <h1 className="mb-2" style={{ color: "#4A3728" }}>Registro de Nuevo Usuario</h1>
            <p className="text-sm" style={{ color: "#4A3728", opacity: 0.7 }}>
              Completa tus datos para unirte a nuestra biblioteca
            </p>
          </div>

          {/* Error summary */}
          {submitted && errorCount > 0 && (
            <div className="rounded-xl p-4 mb-6 flex items-start gap-3"
              style={{ background: "rgba(192,57,43,0.08)", border: "1.5px solid #C0392B" }}>
              <span style={{ color: "#C0392B", fontSize: 18 }}>⚠️</span>
              <p className="text-sm" style={{ color: "#C0392B" }}>
                Hay <strong>{errorCount}</strong> campo{errorCount !== 1 ? "s" : ""} con errores. Corrígelos para continuar.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Información Personal */}
            <h3 className="mb-4 pb-2 border-b text-base font-semibold" style={{ color: "#4A3728", borderColor: "#D4A373" }}>
              Información Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <InputField id="dni" name="dni" label="DNI" value={formData.dni}
                placeholder="12345678" required error={touched.dni ? errors.dni : ""}
                icon={<FileText className="w-5 h-5" />}
                onChange={handleChange} onBlur={handleBlur as any} />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: "#4A3728" }}>
                  Fecha de Nacimiento <span style={{ color: "#C0392B" }}>*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: touched.fechaNacimiento && errors.fechaNacimiento ? "#C0392B" : "#D4A373" }}>
                    <Calendar className="w-5 h-5" />
                  </span>
                  <input id="fechaNacimiento" name="fechaNacimiento" type="date"
                    value={formData.fechaNacimiento}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={handleChange} onBlur={handleBlur as any}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border-2 focus:outline-none transition-all text-sm"
                    style={{ backgroundColor: "#FEFAE0", borderColor: touched.fechaNacimiento && errors.fechaNacimiento ? "#C0392B" : "#D4A373", color: "#4A3728" }} />
                </div>
                {touched.fechaNacimiento && errors.fechaNacimiento && (
                  <p className="text-xs flex items-center gap-1" style={{ color: "#C0392B" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {errors.fechaNacimiento}
                  </p>
                )}
              </div>
              <InputField id="nombres" name="nombres" label="Nombres" value={formData.nombres}
                placeholder="Juan Carlos" required error={touched.nombres ? errors.nombres : ""}
                icon={<User className="w-5 h-5" />}
                onChange={handleChange} onBlur={handleBlur as any} />
              <InputField id="apellidos" name="apellidos" label="Apellidos" value={formData.apellidos}
                placeholder="Pérez García" required error={touched.apellidos ? errors.apellidos : ""}
                icon={<User className="w-5 h-5" />}
                onChange={handleChange} onBlur={handleBlur as any} />
              <InputField id="lugarNacimiento" name="lugarNacimiento" label="Lugar de Nacimiento"
                value={formData.lugarNacimiento} placeholder="Pereira, Colombia" required
                error={touched.lugarNacimiento ? errors.lugarNacimiento : ""}
                icon={<MapPin className="w-5 h-5" />}
                onChange={handleChange} onBlur={handleBlur as any} />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: "#4A3728" }}>
                  Género <span style={{ color: "#C0392B" }}>*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 z-10" style={{ color: "#D4A373" }}>
                    <User className="w-5 h-5" />
                  </span>
                  <select id="genero" name="genero" value={formData.genero}
                    onChange={handleChange} onBlur={handleBlur as any}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border-2 focus:outline-none transition-all appearance-none text-sm"
                    style={{ backgroundColor: "#FEFAE0", borderColor: touched.genero && errors.genero ? "#C0392B" : "#D4A373", color: "#4A3728" }}>
                    <option value="">Seleccionar...</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                    <option value="prefiero-no-decir">Prefiero no decir</option>
                  </select>
                </div>
                {touched.genero && errors.genero && (
                  <p className="text-xs" style={{ color: "#C0392B" }}>{errors.genero}</p>
                )}
              </div>
            </div>
            <InputField id="direccion" name="direccion" label="Dirección"
              value={formData.direccion} placeholder="Calle Principal 123, Barrio, Ciudad" required
              error={touched.direccion ? errors.direccion : ""}
              icon={<Home className="w-5 h-5" />}
              onChange={handleChange} onBlur={handleBlur as any} />

            {/* Información de Cuenta */}
            <h3 className="mt-7 mb-4 pb-2 border-b text-base font-semibold" style={{ color: "#4A3728", borderColor: "#D4A373" }}>
              Información de Cuenta
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <InputField id="correo" name="correo" type="email" label="Correo Electrónico"
                value={formData.correo} placeholder="tu@correo.com" required
                error={touched.correo ? errors.correo : ""}
                icon={<Mail className="w-5 h-5" />}
                onChange={handleChange} onBlur={handleBlur as any} />
              <InputField id="usuario" name="usuario" label="Usuario"
                value={formData.usuario} placeholder="nombreusuario" required
                error={touched.usuario ? errors.usuario : ""}
                icon={<User className="w-5 h-5" />}
                onChange={handleChange} onBlur={handleBlur as any} />

              {/* Contraseña con fortaleza */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: "#4A3728" }}>
                  Contraseña <span style={{ color: "#C0392B" }}>*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: touched.contrasena && errors.contrasena ? "#C0392B" : "#D4A373" }}>
                    <Lock className="w-5 h-5" />
                  </span>
                  <input id="contrasena" name="contrasena" type={showPass ? "text" : "password"}
                    value={formData.contrasena} placeholder="Mín. 8 caracteres"
                    onChange={handleChange} onBlur={handleBlur as any}
                    className="w-full pl-11 pr-11 py-3 rounded-lg border-2 focus:outline-none transition-all text-sm"
                    style={{ backgroundColor: "#FEFAE0", borderColor: touched.contrasena && errors.contrasena ? "#C0392B" : "#D4A373", color: "#4A3728" }} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#D4A373" }}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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
                {touched.contrasena && errors.contrasena && (
                  <p className="text-xs flex items-center gap-1" style={{ color: "#C0392B" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {errors.contrasena}
                  </p>
                )}
                <ul className="text-xs space-y-0.5 mt-1" style={{ color: "#6B5344", opacity: 0.8 }}>
                  {[
                    ["Sin espacios en blanco", !/\s/.test(formData.contrasena) && formData.contrasena.length > 0],
                    ["Mínimo 8 caracteres", formData.contrasena.length >= 8],
                    ["Al menos una mayúscula", /[A-Z]/.test(formData.contrasena)],
                    ["Al menos un número", /[0-9]/.test(formData.contrasena)],
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
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: touched.confirmarContrasena && errors.confirmarContrasena ? "#C0392B" : "#D4A373" }}>
                    <Lock className="w-5 h-5" />
                  </span>
                  <input id="confirmarContrasena" name="confirmarContrasena"
                    type={showConfirm ? "text" : "password"}
                    value={formData.confirmarContrasena} placeholder="Repite tu contraseña"
                    onChange={handleChange} onBlur={handleBlur as any}
                    className="w-full pl-11 pr-11 py-3 rounded-lg border-2 focus:outline-none transition-all text-sm"
                    style={{ backgroundColor: "#FEFAE0", borderColor: touched.confirmarContrasena && errors.confirmarContrasena ? "#C0392B" : formData.confirmarContrasena && !errors.confirmarContrasena ? "#606C38" : "#D4A373", color: "#4A3728" }} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#D4A373" }}>
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {touched.confirmarContrasena && errors.confirmarContrasena && (
                  <p className="text-xs flex items-center gap-1" style={{ color: "#C0392B" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {errors.confirmarContrasena}
                  </p>
                )}
                {formData.confirmarContrasena && !errors.confirmarContrasena && touched.confirmarContrasena && (
                  <p className="text-xs" style={{ color: "#606C38" }}>✓ Las contraseñas coinciden</p>
                )}
              </div>
            </div>

            {/* Preferencias */}
            <h3 className="mt-7 mb-4 pb-2 border-b text-base font-semibold" style={{ color: "#4A3728", borderColor: "#D4A373" }}>
              Preferencias de Lectura
            </h3>
            <div className="space-y-1.5">
              <label htmlFor="temasPreferencia" className="block text-sm font-medium" style={{ color: "#4A3728" }}>
                Temas de Preferencia <span style={{ color: "#C0392B" }}>*</span>{" "}
                <span className="font-normal text-xs" style={{ color: "#6B5344" }}>(Ctrl/Cmd para seleccionar varios)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 w-5 h-5 z-10" style={{ color: "#D4A373" }}>
                  <Tag className="w-5 h-5" />
                </span>
                <select id="temasPreferencia" multiple value={formData.temasPreferencia}
                  onChange={handleTemasChange}
                  onBlur={() => setTouched(p => ({ ...p, temasPreferencia: true }))}
                  className="w-full pl-11 pr-4 py-3 rounded-lg border-2 focus:outline-none transition-all min-h-32 text-sm"
                  style={{ backgroundColor: "#FEFAE0", borderColor: touched.temasPreferencia && errors.temasPreferencia ? "#C0392B" : "#D4A373", color: "#4A3728" }}>
                  <option value="ficcion">Ficción</option>
                  <option value="no-ficcion">No Ficción</option>
                  <option value="ciencia">Ciencia</option>
                  <option value="historia">Historia</option>
                  <option value="tecnologia">Tecnología</option>
                  <option value="arte">Arte</option>
                  <option value="filosofia">Filosofía</option>
                  <option value="poesia">Poesía</option>
                  <option value="biografia">Biografía</option>
                  <option value="infantil">Infantil</option>
                  <option value="juvenil">Juvenil</option>
                  <option value="novela-grafica">Novela Gráfica</option>
                </select>
              </div>
              {touched.temasPreferencia && errors.temasPreferencia && (
                <p className="text-xs" style={{ color: "#C0392B" }}>{errors.temasPreferencia}</p>
              )}
              <p className="text-xs" style={{ color: "#4A3728", opacity: 0.6 }}>
                Seleccionados: {formData.temasPreferencia.length > 0 ? formData.temasPreferencia.join(", ") : "Ninguno"}
              </p>
            </div>

            {/* Buttons */}
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
